export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'unit'

export type OrderStatus = 'pending' | 'completed' | 'cancelled'

export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'digital_wallet'

export interface ProductMetrics {
  estimatedCost: number
  grossProfit: number
  grossMarginPercent: number
  cogsPercent: number
}

export interface OrderMetricItem {
  quantity: number
  courtesyQuantity: number
  unitPrice: number
  unitCost: number
}

export interface OrderMetrics extends ProductMetrics {
  subtotal: number
  discount: number
  total: number
}
