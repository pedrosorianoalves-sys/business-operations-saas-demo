import type {
  OrderMetricItem,
  OrderMetrics,
  ProductMetrics,
  Unit,
} from './types'

const MASS_UNITS = new Set<Unit>(['g', 'kg'])
const VOLUME_UNITS = new Set<Unit>(['ml', 'l'])

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function isFiniteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0
}

function areCompatible(sourceUnit: Unit, targetUnit: Unit) {
  if (sourceUnit === targetUnit) return true
  if (MASS_UNITS.has(sourceUnit) && MASS_UNITS.has(targetUnit)) return true
  return VOLUME_UNITS.has(sourceUnit) && VOLUME_UNITS.has(targetUnit)
}

export function convertQuantity(
  quantity: number,
  sourceUnit: Unit,
  targetUnit: Unit,
) {
  if (!Number.isFinite(quantity) || quantity <= 0) return null
  if (!areCompatible(sourceUnit, targetUnit)) return null
  if (sourceUnit === targetUnit) return quantity

  if (sourceUnit === 'g' && targetUnit === 'kg') return quantity / 1000
  if (sourceUnit === 'kg' && targetUnit === 'g') return quantity * 1000
  if (sourceUnit === 'ml' && targetUnit === 'l') return quantity / 1000
  if (sourceUnit === 'l' && targetUnit === 'ml') return quantity * 1000

  return null
}

export function calculateProductMetrics(
  salePrice: number,
  ingredientCosts: number[],
): ProductMetrics {
  if (!isFiniteNonNegative(salePrice)) {
    throw new Error('Sale price must be a finite non-negative number.')
  }
  if (ingredientCosts.some((cost) => !isFiniteNonNegative(cost))) {
    throw new Error('Ingredient costs must be finite non-negative numbers.')
  }

  const estimatedCost = round(
    ingredientCosts.reduce((total, cost) => total + cost, 0),
    2,
  )
  const grossProfit = round(salePrice - estimatedCost, 2)

  return {
    estimatedCost,
    grossProfit,
    grossMarginPercent:
      salePrice > 0 ? round((grossProfit / salePrice) * 100, 2) : 0,
    cogsPercent:
      salePrice > 0 ? round((estimatedCost / salePrice) * 100, 2) : 0,
  }
}

export function calculateOrderMetrics(
  items: OrderMetricItem[],
  discount: number,
): OrderMetrics {
  if (!isFiniteNonNegative(discount)) {
    throw new Error('Discount must be a finite non-negative number.')
  }

  for (const item of items) {
    const values = [
      item.quantity,
      item.courtesyQuantity,
      item.unitPrice,
      item.unitCost,
    ]
    if (values.some((value) => !isFiniteNonNegative(value))) {
      throw new Error('Order item values must be finite non-negative numbers.')
    }
    if (item.quantity <= 0) {
      throw new Error('Order item quantity must be greater than zero.')
    }
  }

  const subtotal = round(
    items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    ),
    2,
  )

  if (discount > subtotal) {
    throw new Error('Discount cannot exceed subtotal.')
  }

  const total = round(subtotal - discount, 2)
  const estimatedCost = round(
    items.reduce(
      (cost, item) =>
        cost + (item.quantity + item.courtesyQuantity) * item.unitCost,
      0,
    ),
    2,
  )
  const grossProfit = round(total - estimatedCost, 2)

  return {
    subtotal,
    discount: round(discount, 2),
    total,
    estimatedCost,
    grossProfit,
    grossMarginPercent:
      total > 0 ? round((grossProfit / total) * 100, 2) : 0,
    cogsPercent: total > 0 ? round((estimatedCost / total) * 100, 2) : 0,
  }
}
