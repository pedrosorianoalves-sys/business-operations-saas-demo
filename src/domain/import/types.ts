import type { OrderStatus, PaymentMethod, Unit } from '../types'

export interface ImportIssue {
  path: string
  message: string
}

export interface CustomerCandidate {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

export type CustomerMatch =
  | { type: 'matched'; customerId: string; matchedBy: 'phone' | 'email' | 'name' }
  | { type: 'new' }
  | { type: 'ambiguous'; reason: string; customerIds: string[] }

export interface ImportCatalog {
  customers: CustomerCandidate[]
  products: { id: string; name: string; price: number }[]
  ingredients: { id: string; name: string; unit: Unit }[]
}

export interface CustomerPlan {
  name: string
  phone: string | null
  email: string | null
  match: CustomerMatch
}

export interface ProductPlan {
  id: string | null
  name: string
  category: string | null
  price: number
}

export interface IngredientPlan {
  id: string | null
  name: string
  unit: Unit
  cost: number
  currentStock: number
  minimumStock: number
}

export interface RecipePlan {
  productId: string | null
  product: string
  ingredients: {
    ingredientId: string | null
    ingredient: string
    quantity: number
    unit: Unit
  }[]
}

export interface OrderPlan {
  customer: {
    name: string
    phone: string | null
    email: string | null
  }
  customerMatch: CustomerMatch
  items: {
    productId: string | null
    product: string
    quantity: number
    unitPrice: number | null
  }[]
  paymentMethod: PaymentMethod
  status: OrderStatus
  orderedAt: string | null
}

export interface ImportPlan {
  customers: CustomerPlan[]
  products: ProductPlan[]
  ingredients: IngredientPlan[]
  recipes: RecipePlan[]
  orders: OrderPlan[]
}

export interface ImportPreview {
  counts: {
    customers: number
    products: number
    ingredients: number
    recipes: number
    orders: number
  }
  customers: { name: string; action: 'create' | 'match' | 'ambiguous' }[]
  products: { name: string; action: 'create' | 'update' }[]
  ingredients: { name: string; action: 'create' | 'update' }[]
  recipes: { product: string; itemCount: number }[]
  orders: { customer: string; itemCount: number; status: OrderStatus }[]
}

export interface ImportValidationResult {
  success: boolean
  plan: ImportPlan | null
  preview: ImportPreview | null
  issues: ImportIssue[]
}

export interface ImportExample {
  name: 'Customer Import' | 'Product & Recipe Import' | 'Orders Batch Import'
  description: string
  json: string
}
