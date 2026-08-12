export const IMPORT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'BusinessOps Demo Import',
  type: 'object',
  properties: {
    customers: { type: 'array' },
    products: { type: 'array' },
    ingredients: { type: 'array' },
    recipes: { type: 'array' },
    orders: { type: 'array' },
  },
  additionalProperties: false,
} as const
