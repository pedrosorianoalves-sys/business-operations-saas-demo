import { describe, expect, it } from 'vitest'

import { summarizeDashboard } from './dashboard'

describe('summarizeDashboard', () => {
  it('derives portfolio KPIs and the last seven daily buckets', () => {
    const summary = summarizeDashboard(
      {
        customers: [{ id: 'c1' }, { id: 'c2' }],
        products: [
          { id: 'p1', name: 'Demo Burger', gross_margin_percent: 62 },
          { id: 'p2', name: 'Demo Fries', gross_margin_percent: 71 },
        ],
        ingredients: [
          { id: 'i1', current_stock: 3, minimum_stock: 5 },
          { id: 'i2', current_stock: 9, minimum_stock: 5 },
        ],
        orders: [
          {
            id: 'o1',
            status: 'completed',
            total: 40,
            estimated_cost: 12,
            ordered_at: '2026-08-12T12:00:00.000Z',
            items: [{ product_id: 'p1', quantity: 2 }],
          },
          {
            id: 'o2',
            status: 'cancelled',
            total: 100,
            estimated_cost: 25,
            ordered_at: '2026-08-11T12:00:00.000Z',
            items: [{ product_id: 'p2', quantity: 1 }],
          },
          {
            id: 'o3',
            status: 'completed',
            total: 15,
            estimated_cost: 5,
            ordered_at: '2026-08-10T12:00:00.000Z',
            items: [{ product_id: 'p1', quantity: 1 }],
          },
        ],
      },
      new Date('2026-08-12T18:00:00.000Z'),
    )

    expect(summary).toMatchObject({
      revenue: 55,
      cogs: 17,
      grossProfit: 38,
      grossMarginPercent: 69.09,
      completedOrders: 2,
      averageOrderValue: 27.5,
      activeCustomers: 2,
      inventoryValue: 0,
      lowStockCount: 1,
      statusCounts: { completed: 2, pending: 0, cancelled: 1 },
    })
    expect(summary.topProducts[0]).toEqual({
      id: 'p1',
      name: 'Demo Burger',
      quantity: 3,
      revenue: 55,
    })
    expect(summary.daily).toHaveLength(7)
    expect(summary.daily.at(-1)).toMatchObject({ revenue: 40, cogs: 12 })
  })
})
