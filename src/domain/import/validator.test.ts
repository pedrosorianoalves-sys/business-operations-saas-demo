import { describe, expect, it } from 'vitest'

import { IMPORT_EXAMPLES } from './examples'
import { validateImportJson } from './validator'

const catalog = {
  customers: [
    {
      id: 'customer-1',
      name: 'Emma Collins',
      phone: '+1 555 010 1001',
      email: 'emma.collins@example.com',
    },
  ],
  products: [{ id: 'product-1', name: 'Classic Cheeseburger', price: 12.9 }],
  ingredients: [{ id: 'ingredient-1', name: 'Burger Bun', unit: 'unit' as const }],
}

describe('validateImportJson', () => {
  it('reports malformed JSON without throwing', () => {
    expect(validateImportJson('{"customers": [}', catalog)).toEqual({
      success: false,
      plan: null,
      preview: null,
      issues: [{ path: '$', message: 'Invalid JSON. Check commas, quotes, and brackets.' }],
    })
  })

  it('rejects an object with no supported records', () => {
    const result = validateImportJson('{}', catalog)

    expect(result.success).toBe(false)
    expect(result.issues).toContainEqual({
      path: '$',
      message: 'Add at least one customer, product, ingredient, recipe, or order.',
    })
  })

  it.each([
    ['customers', 'Customer Import'],
    ['products and recipes', 'Product & Recipe Import'],
    ['orders', 'Orders Batch Import'],
  ])('validates the built-in %s example', (_label, exampleName) => {
    const example = IMPORT_EXAMPLES.find((item) => item.name === exampleName)
    expect(example).toBeDefined()

    const result = validateImportJson(example!.json, catalog)

    expect(result.success).toBe(true)
    expect(result.issues).toEqual([])
    expect(result.plan).not.toBeNull()
  })

  it('normalizes public example aliases to database values', () => {
    const result = validateImportJson(
      JSON.stringify({
        orders: [
          {
            customer: { name: 'Emma Collins', phone: '+1 555 010 1001' },
            items: [{ product: 'Classic Cheeseburger', quantity: 2 }],
            paymentMethod: 'Credit Card',
            status: 'Completed',
          },
        ],
      }),
      catalog,
    )

    expect(result.success).toBe(true)
    expect(result.plan?.orders[0]).toMatchObject({
      customerMatch: { type: 'matched', customerId: 'customer-1', matchedBy: 'phone' },
      paymentMethod: 'credit_card',
      status: 'completed',
      items: [{ productId: 'product-1', product: 'Classic Cheeseburger', quantity: 2 }],
    })
  })

  it('reports the exact missing product path', () => {
    const result = validateImportJson(
      JSON.stringify({
        orders: [
          {
            customer: { name: 'Olivia Turner' },
            items: [{ product: 'Example Burger', quantity: 1 }],
            paymentMethod: 'Cash',
            status: 'Pending',
          },
        ],
      }),
      catalog,
    )

    expect(result.success).toBe(false)
    expect(result.issues).toContainEqual({
      path: 'orders[0].items[0].product',
      message: 'Product "Example Burger" was not found.',
    })
  })

  it('rejects non-positive quantities and unknown enum values', () => {
    const result = validateImportJson(
      JSON.stringify({
        orders: [
          {
            customer: { name: 'Olivia Turner' },
            items: [{ product: 'Classic Cheeseburger', quantity: 0 }],
            paymentMethod: 'Crypto',
            status: 'Cooking',
          },
        ],
      }),
      catalog,
    )

    expect(result.success).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          path: 'orders[0].items[0].quantity',
          message: 'Quantity must be greater than zero.',
        },
        {
          path: 'orders[0].paymentMethod',
          message: 'Payment method must be Credit Card, Debit Card, Cash, or Digital Wallet.',
        },
        {
          path: 'orders[0].status',
          message: 'Status must be Pending, Completed, or Cancelled.',
        },
      ]),
    )
  })

  it('rejects a recipe referencing an unknown ingredient', () => {
    const result = validateImportJson(
      JSON.stringify({
        recipes: [
          {
            product: 'Classic Cheeseburger',
            ingredients: [{ ingredient: 'Secret Sauce', quantity: 1, unit: 'unit' }],
          },
        ],
      }),
      catalog,
    )

    expect(result.issues).toContainEqual({
      path: 'recipes[0].ingredients[0].ingredient',
      message: 'Ingredient "Secret Sauce" was not found.',
    })
  })

  it('rejects incompatible recipe units and changes to an existing ingredient unit', () => {
    const result = validateImportJson(
      JSON.stringify({
        ingredients: [{ name: 'Burger Bun', unit: 'g', cost: 0.72 }],
        recipes: [
          {
            product: 'Classic Cheeseburger',
            ingredients: [{ ingredient: 'Burger Bun', quantity: 1, unit: 'ml' }],
          },
        ],
      }),
      catalog,
    )

    expect(result.success).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          path: 'ingredients[0].unit',
          message: 'Existing ingredient unit cannot be changed from unit to g.',
        },
        {
          path: 'recipes[0].ingredients[0].unit',
          message: 'Unit ml is incompatible with ingredient unit unit.',
        },
      ]),
    )
  })
})
