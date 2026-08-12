import { describe, expect, it } from 'vitest'

import {
  calculateOrderMetrics,
  calculateProductMetrics,
  convertQuantity,
} from './costing'

describe('convertQuantity', () => {
  it.each([
    [1000, 'g', 'kg', 1],
    [1.25, 'kg', 'g', 1250],
    [750, 'ml', 'l', 0.75],
    [2.4, 'l', 'ml', 2400],
    [3, 'unit', 'unit', 3],
  ] as const)(
    'converts %s %s to %s',
    (quantity, sourceUnit, targetUnit, expected) => {
      expect(convertQuantity(quantity, sourceUnit, targetUnit)).toBe(expected)
    },
  )

  it('rejects incompatible dimensions', () => {
    expect(convertQuantity(1, 'kg', 'l')).toBeNull()
    expect(convertQuantity(1, 'unit', 'g')).toBeNull()
  })

  it('rejects non-positive and non-finite quantities', () => {
    expect(convertQuantity(0, 'g', 'kg')).toBeNull()
    expect(convertQuantity(-1, 'g', 'kg')).toBeNull()
    expect(convertQuantity(Number.NaN, 'g', 'kg')).toBeNull()
  })
})

describe('calculateProductMetrics', () => {
  it('returns hand-checked cost, profit, and gross margin', () => {
    expect(calculateProductMetrics(12.9, [1.85, 0.72, 0.38])).toEqual({
      estimatedCost: 2.95,
      grossProfit: 9.95,
      grossMarginPercent: 77.13,
      cogsPercent: 22.87,
    })
  })

  it('uses zero percentages when sale price is zero', () => {
    expect(calculateProductMetrics(0, [1.5])).toEqual({
      estimatedCost: 1.5,
      grossProfit: -1.5,
      grossMarginPercent: 0,
      cogsPercent: 0,
    })
  })
})

describe('calculateOrderMetrics', () => {
  it('calculates charged revenue and all-item cost independently', () => {
    expect(
      calculateOrderMetrics(
        [
          { quantity: 2, courtesyQuantity: 1, unitPrice: 12.9, unitCost: 2.95 },
          { quantity: 1, courtesyQuantity: 0, unitPrice: 4.5, unitCost: 0.8 },
        ],
        2,
      ),
    ).toEqual({
      subtotal: 30.3,
      discount: 2,
      total: 28.3,
      estimatedCost: 9.65,
      grossProfit: 18.65,
      grossMarginPercent: 65.9,
      cogsPercent: 34.1,
    })
  })

  it('rejects discounts larger than the subtotal', () => {
    expect(() =>
      calculateOrderMetrics(
        [{ quantity: 1, courtesyQuantity: 0, unitPrice: 5, unitCost: 2 }],
        5.01,
      ),
    ).toThrow('Discount cannot exceed subtotal.')
  })
})
