interface DashboardInput {
  customers: { id: string }[]
  products: { id: string; name: string; gross_margin_percent: number }[]
  ingredients: { id: string; current_stock: number; minimum_stock: number; average_cost?: number }[]
  orders: {
    id: string
    status: string
    total: number
    estimated_cost: number
    ordered_at: string
    items: { product_id: string; quantity: number }[]
  }[]
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function summarizeDashboard(input: DashboardInput, now = new Date()) {
  const completed = input.orders.filter((order) => order.status === 'completed')
  const revenue = round(completed.reduce((sum, order) => sum + order.total, 0))
  const cogs = round(completed.reduce((sum, order) => sum + order.estimated_cost, 0))
  const grossProfit = round(revenue - cogs)

  const productTotals = new Map<string, { quantity: number; revenue: number }>()
  for (const order of completed) {
    const quantityTotal = order.items.reduce((sum, item) => sum + item.quantity, 0)
    for (const item of order.items) {
      const current = productTotals.get(item.product_id) ?? { quantity: 0, revenue: 0 }
      current.quantity += item.quantity
      current.revenue += quantityTotal > 0 ? order.total * (item.quantity / quantityTotal) : 0
      productTotals.set(item.product_id, current)
    }
  }

  const productNames = new Map(input.products.map((product) => [product.id, product.name]))
  const topProducts = [...productTotals.entries()]
    .map(([id, total]) => ({
      id,
      name: productNames.get(id) ?? 'Unknown product',
      quantity: round(total.quantity, 1),
      revenue: round(total.revenue),
    }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5)

  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() - (6 - index))
    const key = dateKey(date)
    const orders = completed.filter((order) => dateKey(new Date(order.ordered_at)) === key)
    return {
      date: key,
      label: new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      }).format(date),
      revenue: round(orders.reduce((sum, order) => sum + order.total, 0)),
      cogs: round(orders.reduce((sum, order) => sum + order.estimated_cost, 0)),
    }
  })

  return {
    revenue,
    cogs,
    grossProfit,
    grossMarginPercent: revenue > 0 ? round((grossProfit / revenue) * 100) : 0,
    completedOrders: completed.length,
    averageOrderValue: completed.length > 0 ? round(revenue / completed.length) : 0,
    activeCustomers: input.customers.length,
    inventoryValue: round(input.ingredients.reduce(
      (sum, ingredient) => sum + ingredient.current_stock * (ingredient.average_cost ?? 0),
      0,
    )),
    lowStockCount: input.ingredients.filter(
      (ingredient) => ingredient.current_stock < ingredient.minimum_stock,
    ).length,
    statusCounts: {
      completed: completed.length,
      pending: input.orders.filter((order) => order.status === 'pending').length,
      cancelled: input.orders.filter((order) => order.status === 'cancelled').length,
    },
    topProducts,
    daily,
  }
}
