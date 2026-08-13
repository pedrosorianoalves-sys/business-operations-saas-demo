import type { OrderStatus, PaymentMethod, Unit } from '@/domain/types'

export interface CustomerRecord {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  total_spent: number
  total_orders: number
  last_order_at: string | null
}

export interface ProductRecord {
  id: string
  name: string
  category: string | null
  description: string | null
  price: number
  estimated_cost: number
  gross_profit: number
  gross_margin_percent: number
  is_active: boolean
}

export interface IngredientRecord {
  id: string
  name: string
  unit: Unit
  current_stock: number
  minimum_stock: number
  average_cost: number
  supplier: string | null
}

export interface RecipeRecord {
  id: string
  product_id: string
  product_name: string
  yield_quantity: number
  estimated_cost: number
  items: {
    id: string
    ingredient_id: string
    ingredient_name: string
    quantity: number
    unit: Unit
  }[]
}

export interface PurchaseRecord {
  id: string
  ingredient_id: string
  ingredient_name: string
  quantity: number
  unit_cost: number
  total_cost: number
  supplier: string | null
  purchased_at: string
}

export interface OrderRecord {
  id: string
  customer_id: string | null
  customer_name: string
  status: OrderStatus
  payment_method: PaymentMethod
  subtotal: number
  discount: number
  total: number
  estimated_cost: number
  gross_profit: number
  gross_margin_percent: number
  ordered_at: string
  items: {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
  }[]
}

export interface DemoData {
  source: 'supabase' | 'preview'
  sourceMessage: string | null
  companyName: string
  customers: CustomerRecord[]
  products: ProductRecord[]
  ingredients: IngredientRecord[]
  recipes: RecipeRecord[]
  purchases: PurchaseRecord[]
  orders: OrderRecord[]
}
