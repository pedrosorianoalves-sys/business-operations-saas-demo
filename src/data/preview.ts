import type {
  CustomerRecord,
  DemoData,
  IngredientRecord,
  OrderRecord,
  ProductRecord,
  PurchaseRecord,
  RecipeRecord,
} from './types'

const CUSTOMER_NAMES = [
  'Emma Collins', 'Daniel Brooks', 'Olivia Turner', 'Ethan Parker', 'Sophia Bennett',
  'Noah Reed', 'Ava Mitchell', 'Liam Foster', 'Mia Harper', 'Lucas Grant',
  'Isabella Ward', 'Henry Cooper', 'Amelia Ross', 'James Wilson', 'Charlotte Hayes',
  'Benjamin Price', 'Harper Stone', 'Alexander King', 'Evelyn Scott', 'Michael Lane',
  'Abigail Moore', 'Samuel Clark', 'Ella Adams', 'Jack Morris', 'Grace Bell',
]

const INGREDIENT_SEED = [
  ['Burger Bun', 'unit', 302, 80, 0.72, 'Demo Bakery Co.'],
  ['Beef Patty', 'unit', 176, 60, 1.85, 'Demo Protein Co.'],
  ['Chicken Fillet', 'unit', 222, 45, 1.62, 'Demo Protein Co.'],
  ['Veggie Patty', 'unit', 142, 35, 1.48, 'Demo Plant Foods'],
  ['Cheddar Cheese', 'unit', 508, 100, 0.38, 'Demo Dairy Co.'],
  ['Lettuce', 'g', 5180, 5680, 0.0041, 'Demo Produce Co.'],
  ['Tomato', 'g', 68120, 9000, 0.0048, 'Demo Produce Co.'],
  ['Red Onion', 'g', 47140, 6000, 0.0036, 'Demo Produce Co.'],
  ['Pickles', 'g', 3420, 3920, 0.0062, 'Demo Pantry Co.'],
  ['Burger Sauce', 'ml', 63140, 8000, 0.0075, 'Demo Pantry Co.'],
  ['Potato', 'kg', 287.4, 45, 1.15, 'Demo Produce Co.'],
  ['Vegetable Oil', 'l', 84.5, 14, 2.25, 'Demo Pantry Co.'],
  ['Salt', 'g', 29620, 3500, 0.0012, 'Demo Pantry Co.'],
  ['Milk', 'l', 111.5, 18, 1.1, 'Demo Dairy Co.'],
  ['Vanilla Ice Cream', 'l', 97.6, 18, 3.15, 'Demo Dairy Co.'],
  ['Chocolate Syrup', 'ml', 4180, 4680, 0.0088, 'Demo Pantry Co.'],
  ['Lemonade Base', 'l', 6.4, 11.4, 2.05, 'Demo Beverage Co.'],
  ['Soft Drink Can', 'unit', 382, 60, 0.68, 'Demo Beverage Co.'],
] as const

const PRODUCT_SEED = [
  ['Classic Cheeseburger', 'Burgers', 12.9, 3.75],
  ['Double Smash Burger', 'Burgers', 16.9, 5.68],
  ['Crispy Chicken Sandwich', 'Sandwiches', 13.5, 2.75],
  ['Veggie Burger', 'Burgers', 11.9, 2.64],
  ['French Fries', 'Sides', 4.5, 0.27],
  ['Loaded Fries', 'Sides', 7.9, 1.2],
  ['Chocolate Shake', 'Beverages', 6.9, 1.43],
  ['Vanilla Shake', 'Beverages', 6.5, 1.36],
  ['Soft Drink', 'Beverages', 3.5, 0.68],
  ['House Lemonade', 'Beverages', 4.9, 0.16],
] as const

const RECIPE_SEED: Record<string, [string, number, string][]> = {
  'Classic Cheeseburger': [['Burger Bun', 1, 'unit'], ['Beef Patty', 1, 'unit'], ['Cheddar Cheese', 1, 'unit'], ['Lettuce', 15, 'g'], ['Tomato', 20, 'g'], ['Burger Sauce', 15, 'ml']],
  'Double Smash Burger': [['Burger Bun', 1, 'unit'], ['Beef Patty', 2, 'unit'], ['Cheddar Cheese', 2, 'unit'], ['Pickles', 10, 'g'], ['Burger Sauce', 20, 'ml']],
  'Crispy Chicken Sandwich': [['Burger Bun', 1, 'unit'], ['Chicken Fillet', 1, 'unit'], ['Lettuce', 18, 'g'], ['Tomato', 20, 'g'], ['Burger Sauce', 15, 'ml']],
  'Veggie Burger': [['Burger Bun', 1, 'unit'], ['Veggie Patty', 1, 'unit'], ['Lettuce', 15, 'g'], ['Tomato', 20, 'g'], ['Red Onion', 10, 'g']],
  'French Fries': [['Potato', 0.18, 'kg'], ['Vegetable Oil', 0.025, 'l'], ['Salt', 2, 'g']],
  'Loaded Fries': [['Potato', 0.22, 'kg'], ['Vegetable Oil', 0.03, 'l'], ['Cheddar Cheese', 2, 'unit'], ['Burger Sauce', 15, 'ml']],
  'Chocolate Shake': [['Milk', 0.25, 'l'], ['Vanilla Ice Cream', 0.3, 'l'], ['Chocolate Syrup', 30, 'ml']],
  'Vanilla Shake': [['Milk', 0.25, 'l'], ['Vanilla Ice Cream', 0.32, 'l']],
  'Soft Drink': [['Soft Drink Can', 1, 'unit']],
  'House Lemonade': [['Lemonade Base', 0.08, 'l']],
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function createPreviewData(now = new Date()): DemoData {
  const ingredients: IngredientRecord[] = INGREDIENT_SEED.map((row, index) => ({
    id: `ingredient-${index + 1}`,
    name: row[0],
    unit: row[1],
    current_stock: row[2],
    minimum_stock: row[3],
    average_cost: row[4],
    supplier: row[5],
  }))
  const ingredientByName = new Map(ingredients.map((item) => [item.name, item]))

  const products: ProductRecord[] = PRODUCT_SEED.map((row, index) => ({
    id: `product-${index + 1}`,
    name: row[0],
    category: row[1],
    description: `Fictional ${row[0].toLowerCase()} prepared for the BusinessOps portfolio demo.`,
    price: row[2],
    estimated_cost: row[3],
    gross_profit: round(row[2] - row[3]),
    gross_margin_percent: round(((row[2] - row[3]) / row[2]) * 100),
    is_active: true,
  }))
  const productByName = new Map(products.map((item) => [item.name, item]))

  const recipes: RecipeRecord[] = products.map((product, index) => ({
    id: `recipe-${index + 1}`,
    product_id: product.id,
    product_name: product.name,
    yield_quantity: 1,
    estimated_cost: product.estimated_cost,
    items: (RECIPE_SEED[product.name] ?? []).map((item, itemIndex) => ({
      id: `recipe-item-${index + 1}-${itemIndex + 1}`,
      ingredient_id: ingredientByName.get(item[0])?.id ?? '',
      ingredient_name: item[0],
      quantity: item[1],
      unit: item[2] as IngredientRecord['unit'],
    })),
  }))

  const customers: CustomerRecord[] = CUSTOMER_NAMES.map((name, index) => ({
    id: `customer-${index + 1}`,
    name,
    phone: `+1 555 010 ${String(1001 + index).padStart(4, '0')}`,
    email: `${slug(name).replaceAll('-', '.')}@example.com`,
    notes: index % 5 === 0 ? 'Fictional returning customer.' : null,
    total_spent: 0,
    total_orders: 0,
    last_order_at: null,
  }))

  const orders: OrderRecord[] = Array.from({ length: 72 }, (_, index) => {
    const primary = products[index % 4]
    const extras = [
      ...(index % 2 === 0 ? [products[4]] : []),
      ...(index % 3 === 0 ? [products[index % 2 === 0 ? 6 : 7]] : []),
    ]
    const items = [primary, ...extras].map((product, itemIndex) => ({
      product_id: product.id,
      product_name: product.name,
      quantity: itemIndex === 0 ? 1 + (index % 2) : 1,
      unit_price: product.price,
    }))
    const subtotal = round(items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0))
    const estimatedCost = round(items.reduce((sum, item) => sum + item.quantity * (productByName.get(item.product_name)?.estimated_cost ?? 0), 0))
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - ((71 - index) % 28))
    date.setUTCHours(10 + (index % 8), (index * 7) % 60, 0, 0)
    const status = index % 11 === 0 ? 'cancelled' : index % 7 === 0 ? 'pending' : 'completed'
    const customer = customers[index % customers.length]
    return {
      id: `order-${String(index + 1).padStart(3, '0')}`,
      customer_id: customer.id,
      customer_name: customer.name,
      status,
      payment_method: (['credit_card', 'debit_card', 'cash', 'digital_wallet'] as const)[index % 4],
      subtotal,
      discount: 0,
      total: subtotal,
      estimated_cost: estimatedCost,
      gross_profit: round(subtotal - estimatedCost),
      gross_margin_percent: round(((subtotal - estimatedCost) / subtotal) * 100),
      ordered_at: date.toISOString(),
      items,
    }
  })

  for (const order of orders.filter((item) => item.status === 'completed')) {
    const customer = customers.find((item) => item.id === order.customer_id)
    if (!customer) continue
    customer.total_spent = round(customer.total_spent + order.total)
    customer.total_orders += 1
    if (!customer.last_order_at || order.ordered_at > customer.last_order_at) {
      customer.last_order_at = order.ordered_at
    }
  }

  const purchases: PurchaseRecord[] = ingredients.map((ingredient, index) => {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - 35 - (index % 6))
    const quantity = INGREDIENT_SEED[index][2] * 1.4
    return {
      id: `purchase-${index + 1}`,
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      quantity,
      unit_cost: ingredient.average_cost,
      total_cost: round(quantity * ingredient.average_cost),
      supplier: ingredient.supplier,
      purchased_at: date.toISOString(),
    }
  })

  return {
    source: 'preview',
    sourceMessage: 'Connect a dedicated Supabase project to enable private visitor workspaces and mutations.',
    companyName: 'BusinessOps Demo',
    customers,
    products,
    ingredients,
    recipes,
    purchases,
    orders: orders.sort((left, right) => right.ordered_at.localeCompare(left.ordered_at)),
  }
}
