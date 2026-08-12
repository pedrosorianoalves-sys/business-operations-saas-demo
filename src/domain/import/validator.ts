import type { OrderStatus, PaymentMethod, Unit } from '../types'
import { matchCustomer, normalizeEmail, normalizePhone } from './matching'
import type {
  CustomerPlan,
  ImportCatalog,
  ImportIssue,
  ImportPlan,
  ImportPreview,
  ImportValidationResult,
  IngredientPlan,
  OrderPlan,
  ProductPlan,
  RecipePlan,
} from './types'

const UNITS = new Set<Unit>(['g', 'kg', 'ml', 'l', 'unit'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizedLookup(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(value: unknown) {
  const result = text(value)
  return result || null
}

function number(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return Number.NaN
}

function readArray(
  payload: Record<string, unknown>,
  key: string,
  issues: ImportIssue[],
) {
  const value = payload[key]
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    issues.push({ path: key, message: `${key} must be an array.` })
    return []
  }
  return value
}

function unit(value: unknown): Unit | null {
  return typeof value === 'string' && UNITS.has(value as Unit)
    ? (value as Unit)
    : null
}

function paymentMethod(value: unknown): PaymentMethod | null {
  const normalized = text(value).toLocaleLowerCase('en-US').replace(/[\s-]+/g, '_')
  const aliases: Record<string, PaymentMethod> = {
    credit_card: 'credit_card',
    debit_card: 'debit_card',
    cash: 'cash',
    digital_wallet: 'digital_wallet',
  }
  return aliases[normalized] ?? null
}

function orderStatus(value: unknown): OrderStatus | null {
  const normalized = text(value).toLocaleLowerCase('en-US')
  if (normalized === 'pending') return 'pending'
  if (normalized === 'completed') return 'completed'
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled'
  return null
}

function customerAction(customer: CustomerPlan) {
  if (customer.match.type === 'matched') return 'match' as const
  if (customer.match.type === 'ambiguous') return 'ambiguous' as const
  return 'create' as const
}

function buildPreview(plan: ImportPlan): ImportPreview {
  return {
    counts: {
      customers: plan.customers.length,
      products: plan.products.length,
      ingredients: plan.ingredients.length,
      recipes: plan.recipes.length,
      orders: plan.orders.length,
    },
    customers: plan.customers.map((customer) => ({
      name: customer.name,
      action: customerAction(customer),
    })),
    products: plan.products.map((product) => ({
      name: product.name,
      action: product.id ? 'update' : 'create',
    })),
    ingredients: plan.ingredients.map((ingredient) => ({
      name: ingredient.name,
      action: ingredient.id ? 'update' : 'create',
    })),
    recipes: plan.recipes.map((recipe) => ({
      product: recipe.product,
      itemCount: recipe.ingredients.length,
    })),
    orders: plan.orders.map((order) => ({
      customer: order.customer.name,
      itemCount: order.items.length,
      status: order.status,
    })),
  }
}

export function validateImportJson(
  jsonText: string,
  catalog: ImportCatalog,
): ImportValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return {
      success: false,
      plan: null,
      preview: null,
      issues: [
        {
          path: '$',
          message: 'Invalid JSON. Check commas, quotes, and brackets.',
        },
      ],
    }
  }

  const payload = record(parsed)
  if (!payload) {
    return {
      success: false,
      plan: null,
      preview: null,
      issues: [{ path: '$', message: 'The JSON root must be an object.' }],
    }
  }

  const issues: ImportIssue[] = []
  const customerRows = readArray(payload, 'customers', issues)
  const productRows = readArray(payload, 'products', issues)
  const ingredientRows = readArray(payload, 'ingredients', issues)
  const recipeRows = readArray(payload, 'recipes', issues)
  const orderRows = readArray(payload, 'orders', issues)

  if (
    customerRows.length +
      productRows.length +
      ingredientRows.length +
      recipeRows.length +
      orderRows.length ===
    0
  ) {
    issues.push({
      path: '$',
      message: 'Add at least one customer, product, ingredient, recipe, or order.',
    })
  }

  const customers: CustomerPlan[] = []
  for (const [index, unknownRow] of customerRows.entries()) {
    const path = `customers[${index}]`
    const row = record(unknownRow)
    if (!row) {
      issues.push({ path, message: 'Customer must be an object.' })
      continue
    }
    const name = text(row.name)
    const phone = normalizePhone(optionalText(row.phone))
    const email = normalizeEmail(optionalText(row.email))
    if (!name) issues.push({ path: `${path}.name`, message: 'Name is required.' })
    if (email && !EMAIL_PATTERN.test(email)) {
      issues.push({ path: `${path}.email`, message: 'Email is invalid.' })
    }
    if (name && (!email || EMAIL_PATTERN.test(email))) {
      const match = matchCustomer({ name, phone, email }, catalog.customers)
      if (match.type === 'ambiguous') {
        issues.push({ path, message: match.reason })
      }
      customers.push({ name, phone, email, match })
    }
  }

  const products: ProductPlan[] = []
  const productByName = new Map(
    catalog.products.map((product) => [normalizedLookup(product.name), product]),
  )
  for (const [index, unknownRow] of productRows.entries()) {
    const path = `products[${index}]`
    const row = record(unknownRow)
    if (!row) {
      issues.push({ path, message: 'Product must be an object.' })
      continue
    }
    const name = text(row.name)
    const price = number(row.price ?? row.sale_price)
    const category = optionalText(row.category)
    if (!name) issues.push({ path: `${path}.name`, message: 'Name is required.' })
    if (!Number.isFinite(price) || price <= 0) {
      issues.push({ path: `${path}.price`, message: 'Price must be greater than zero.' })
    }
    if (name && Number.isFinite(price) && price > 0) {
      const existing = productByName.get(normalizedLookup(name))
      const plan = { id: existing?.id ?? null, name, category, price }
      products.push(plan)
      productByName.set(normalizedLookup(name), {
        id: plan.id ?? '',
        name,
        price,
      })
    }
  }

  const ingredients: IngredientPlan[] = []
  const ingredientByName = new Map(
    catalog.ingredients.map((ingredient) => [
      normalizedLookup(ingredient.name),
      ingredient,
    ]),
  )
  for (const [index, unknownRow] of ingredientRows.entries()) {
    const path = `ingredients[${index}]`
    const row = record(unknownRow)
    if (!row) {
      issues.push({ path, message: 'Ingredient must be an object.' })
      continue
    }
    const name = text(row.name)
    const parsedUnit = unit(row.unit)
    const cost = row.cost === undefined ? 0 : number(row.cost)
    const currentStock =
      row.currentStock === undefined && row.current_stock === undefined
        ? 0
        : number(row.currentStock ?? row.current_stock)
    const minimumStock =
      row.minimumStock === undefined && row.minimum_stock === undefined
        ? 0
        : number(row.minimumStock ?? row.minimum_stock)
    if (!name) issues.push({ path: `${path}.name`, message: 'Name is required.' })
    if (!parsedUnit) {
      issues.push({ path: `${path}.unit`, message: 'Unit must be g, kg, ml, l, or unit.' })
    }
    for (const [key, value] of [
      ['cost', cost],
      ['currentStock', currentStock],
      ['minimumStock', minimumStock],
    ] as const) {
      if (!Number.isFinite(value) || value < 0) {
        issues.push({ path: `${path}.${key}`, message: `${key} cannot be negative.` })
      }
    }
    if (
      name &&
      parsedUnit &&
      [cost, currentStock, minimumStock].every(
        (value) => Number.isFinite(value) && value >= 0,
      )
    ) {
      const existing = ingredientByName.get(normalizedLookup(name))
      const plan = {
        id: existing?.id || null,
        name,
        unit: parsedUnit,
        cost,
        currentStock,
        minimumStock,
      }
      ingredients.push(plan)
      ingredientByName.set(normalizedLookup(name), {
        id: plan.id ?? '',
        name,
        unit: parsedUnit,
      })
    }
  }

  const recipes: RecipePlan[] = []
  for (const [index, unknownRow] of recipeRows.entries()) {
    const path = `recipes[${index}]`
    const row = record(unknownRow)
    if (!row) {
      issues.push({ path, message: 'Recipe must be an object.' })
      continue
    }
    const productName = text(row.product)
    const product = productByName.get(normalizedLookup(productName))
    if (!productName) {
      issues.push({ path: `${path}.product`, message: 'Product is required.' })
    } else if (!product) {
      issues.push({
        path: `${path}.product`,
        message: `Product "${productName}" was not found.`,
      })
    }
    if (!Array.isArray(row.ingredients) || row.ingredients.length === 0) {
      issues.push({
        path: `${path}.ingredients`,
        message: 'Recipe must include at least one ingredient.',
      })
      continue
    }
    const recipeIngredients: RecipePlan['ingredients'] = []
    for (const [itemIndex, unknownItem] of row.ingredients.entries()) {
      const itemPath = `${path}.ingredients[${itemIndex}]`
      const item = record(unknownItem)
      if (!item) {
        issues.push({ path: itemPath, message: 'Recipe ingredient must be an object.' })
        continue
      }
      const ingredientName = text(item.ingredient)
      const ingredient = ingredientByName.get(normalizedLookup(ingredientName))
      const quantity = number(item.quantity)
      const parsedUnit = unit(item.unit) ?? ingredient?.unit ?? null
      if (!ingredientName) {
        issues.push({ path: `${itemPath}.ingredient`, message: 'Ingredient is required.' })
      } else if (!ingredient) {
        issues.push({
          path: `${itemPath}.ingredient`,
          message: `Ingredient "${ingredientName}" was not found.`,
        })
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        issues.push({
          path: `${itemPath}.quantity`,
          message: 'Quantity must be greater than zero.',
        })
      }
      if (!parsedUnit) {
        issues.push({
          path: `${itemPath}.unit`,
          message: 'Unit must be g, kg, ml, l, or unit.',
        })
      }
      if (ingredient && Number.isFinite(quantity) && quantity > 0 && parsedUnit) {
        recipeIngredients.push({
          ingredientId: ingredient.id || null,
          ingredient: ingredientName,
          quantity,
          unit: parsedUnit,
        })
      }
    }
    if (productName && product && recipeIngredients.length === row.ingredients.length) {
      recipes.push({
        productId: product.id || null,
        product: productName,
        ingredients: recipeIngredients,
      })
    }
  }

  const orders: OrderPlan[] = []
  for (const [index, unknownRow] of orderRows.entries()) {
    const path = `orders[${index}]`
    const row = record(unknownRow)
    if (!row) {
      issues.push({ path, message: 'Order must be an object.' })
      continue
    }
    const customer = record(row.customer)
    const customerName = text(customer?.name)
    const customerPhone = normalizePhone(optionalText(customer?.phone))
    const customerEmail = normalizeEmail(optionalText(customer?.email))
    if (!customerName) {
      issues.push({ path: `${path}.customer.name`, message: 'Customer name is required.' })
    }
    if (customerEmail && !EMAIL_PATTERN.test(customerEmail)) {
      issues.push({ path: `${path}.customer.email`, message: 'Email is invalid.' })
    }
    const match = customerName
      ? matchCustomer(
          { name: customerName, phone: customerPhone, email: customerEmail },
          catalog.customers,
        )
      : ({ type: 'new' } as const)
    if (match.type === 'ambiguous') {
      issues.push({ path: `${path}.customer`, message: match.reason })
    }

    const method = paymentMethod(row.paymentMethod ?? row.payment_method)
    if (!method) {
      issues.push({
        path: `${path}.paymentMethod`,
        message:
          'Payment method must be Credit Card, Debit Card, Cash, or Digital Wallet.',
      })
    }
    const status = orderStatus(row.status)
    if (!status) {
      issues.push({
        path: `${path}.status`,
        message: 'Status must be Pending, Completed, or Cancelled.',
      })
    }
    const orderedAt = optionalText(row.orderedAt ?? row.ordered_at)
    if (orderedAt && Number.isNaN(Date.parse(orderedAt))) {
      issues.push({ path: `${path}.orderedAt`, message: 'Order date is invalid.' })
    }
    if (!Array.isArray(row.items) || row.items.length === 0) {
      issues.push({
        path: `${path}.items`,
        message: 'Order must include at least one item.',
      })
      continue
    }
    const items: OrderPlan['items'] = []
    for (const [itemIndex, unknownItem] of row.items.entries()) {
      const itemPath = `${path}.items[${itemIndex}]`
      const item = record(unknownItem)
      if (!item) {
        issues.push({ path: itemPath, message: 'Order item must be an object.' })
        continue
      }
      const productName = text(item.product)
      const product = productByName.get(normalizedLookup(productName))
      const quantity = number(item.quantity)
      const unitPrice =
        item.unitPrice === undefined && item.unit_price === undefined
          ? null
          : number(item.unitPrice ?? item.unit_price)
      if (!productName) {
        issues.push({ path: `${itemPath}.product`, message: 'Product is required.' })
      } else if (!product) {
        issues.push({
          path: `${itemPath}.product`,
          message: `Product "${productName}" was not found.`,
        })
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        issues.push({
          path: `${itemPath}.quantity`,
          message: 'Quantity must be greater than zero.',
        })
      }
      if (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
        issues.push({ path: `${itemPath}.unitPrice`, message: 'Unit price is invalid.' })
      }
      if (
        product &&
        Number.isFinite(quantity) &&
        quantity > 0 &&
        (unitPrice === null || (Number.isFinite(unitPrice) && unitPrice >= 0))
      ) {
        items.push({
          productId: product.id || null,
          product: productName,
          quantity,
          unitPrice,
        })
      }
    }
    if (
      customerName &&
      (!customerEmail || EMAIL_PATTERN.test(customerEmail)) &&
      match.type !== 'ambiguous' &&
      method &&
      status &&
      (!orderedAt || !Number.isNaN(Date.parse(orderedAt))) &&
      items.length === row.items.length
    ) {
      orders.push({
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
        customerMatch: match,
        items,
        paymentMethod: method,
        status,
        orderedAt,
      })
    }
  }

  const plan: ImportPlan = {
    customers,
    products,
    ingredients,
    recipes,
    orders,
  }
  return {
    success: issues.length === 0,
    plan: issues.length === 0 ? plan : null,
    preview: issues.length === 0 ? buildPreview(plan) : null,
    issues,
  }
}
