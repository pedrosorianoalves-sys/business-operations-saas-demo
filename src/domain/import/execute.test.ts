import { describe, expect, it, vi } from 'vitest'

import { executeValidatedImport } from './execute'

const catalog = {
  customers: [],
  products: [{ id: 'product-1', name: 'Classic Cheeseburger', price: 12.9 }],
  ingredients: [],
}

describe('executeValidatedImport', () => {
  it('never invokes persistence for an invalid plan', async () => {
    const persist = vi.fn()
    const result = await executeValidatedImport('{"orders":[]}', catalog, persist)

    expect(result.success).toBe(false)
    expect(persist).not.toHaveBeenCalled()
  })

  it('persists one normalized plan and returns its summary', async () => {
    const persist = vi.fn().mockResolvedValue({ ordersCreated: 1, failedRecords: 0 })
    const json = JSON.stringify({
      orders: [{
        customer: { name: 'Demo Customer' },
        items: [{ product: 'Classic Cheeseburger', quantity: 1 }],
        paymentMethod: 'Cash',
        status: 'Pending',
      }],
    })

    const result = await executeValidatedImport(json, catalog, persist)

    expect(result).toEqual({
      success: true,
      message: 'Import completed in one transaction.',
      summary: { ordersCreated: 1, failedRecords: 0 },
      issues: [],
    })
    expect(persist).toHaveBeenCalledOnce()
    expect(persist.mock.calls[0][0].orders[0]).toMatchObject({
      paymentMethod: 'cash',
      status: 'pending',
    })
  })
})
