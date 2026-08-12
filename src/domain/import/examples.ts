import type { ImportExample } from './types'

export const IMPORT_EXAMPLES: ImportExample[] = [
  {
    name: 'Customer Import',
    description: 'Create new customers and confidently match existing contacts.',
    json: JSON.stringify(
      {
        customers: [
          {
            name: 'Olivia Turner',
            phone: '+1 555 010 1201',
            email: 'olivia.turner@example.com',
          },
          {
            name: 'Ethan Parker',
            phone: '+1 555 010 1202',
            email: 'ethan.parker@example.com',
          },
        ],
      },
      null,
      2,
    ),
  },
  {
    name: 'Product & Recipe Import',
    description: 'Create ingredients, a product, and its relational recipe together.',
    json: JSON.stringify(
      {
        ingredients: [
          { name: 'Veggie Patty', unit: 'unit', cost: 1.65 },
          { name: 'Whole Wheat Bun', unit: 'unit', cost: 0.62 },
          { name: 'Arugula', unit: 'g', cost: 0.018 },
        ],
        products: [
          { name: 'Garden Veggie Burger', category: 'Burgers', price: 11.9 },
        ],
        recipes: [
          {
            product: 'Garden Veggie Burger',
            ingredients: [
              { ingredient: 'Veggie Patty', quantity: 1, unit: 'unit' },
              { ingredient: 'Whole Wheat Bun', quantity: 1, unit: 'unit' },
              { ingredient: 'Arugula', quantity: 18, unit: 'g' },
            ],
          },
        ],
      },
      null,
      2,
    ),
  },
  {
    name: 'Orders Batch Import',
    description: 'Create a batch of orders while matching customers and products.',
    json: JSON.stringify(
      {
        orders: [
          {
            customer: {
              name: 'Emma Collins',
              phone: '+1 555 010 1001',
              email: 'emma.collins@example.com',
            },
            items: [{ product: 'Classic Cheeseburger', quantity: 2 }],
            paymentMethod: 'Credit Card',
            status: 'Completed',
          },
          {
            customer: {
              name: 'Noah Reed',
              email: 'noah.reed@example.com',
            },
            items: [{ product: 'Classic Cheeseburger', quantity: 1 }],
            paymentMethod: 'Digital Wallet',
            status: 'Pending',
          },
        ],
      },
      null,
      2,
    ),
  },
]
