import type { Metadata } from 'next'
import { CircleDollarSign, ClipboardCheck, PackageSearch, UsersRound } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopProducts } from '@/components/dashboard/top-products'
import { PageHeader } from '@/components/page-header'
import { PortfolioNotice } from '@/components/portfolio-notice'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { summarizeDashboard } from '@/domain/dashboard'
import { loadDemoData } from '@/data/server'
import { currency, date, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Operations Overview' }

export default async function OverviewPage() {
  const data = await loadDemoData()
  const summary = summarizeDashboard(data)
  const recent = data.orders.slice(0, 7)
  const lowStock = data.ingredients.filter((item) => item.current_stock < item.minimum_stock)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Executive dashboard" title="Operations overview" description="Revenue, product economics, order activity, and inventory health across the fictional BusinessOps workspace." />
      <PortfolioNotice message={data.sourceMessage} />
      <section aria-label="Key performance indicators" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Completed revenue" value={currency.format(summary.revenue)} detail={`${summary.completedOrders} completed orders`} icon={CircleDollarSign} tone="indigo" />
        <KpiCard label="Gross profit" value={currency.format(summary.grossProfit)} detail={`${number.format(summary.grossMarginPercent)}% gross margin`} icon={ClipboardCheck} tone="emerald" />
        <KpiCard label="Active customers" value={number.format(summary.activeCustomers)} detail="Fictional customer profiles" icon={UsersRound} tone="sky" />
        <KpiCard label="Low stock" value={number.format(summary.lowStockCount)} detail="Ingredients below minimum" icon={PackageSearch} tone="amber" />
      </section>
      <section aria-label="Business pulse" className="grid overflow-hidden rounded-2xl border border-slate-200/80 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {[['Average order value', currency.format(summary.averageOrderValue)], ['Cost of goods sold', currency.format(summary.cogs)], ['Inventory value', currency.format(summary.inventoryValue)], ['Gross margin', `${number.format(summary.grossMarginPercent)}%`]].map(([label, value], index) => <div key={label} className={`px-5 py-4 ${index > 0 ? 'border-t sm:border-l sm:border-t-0' : ''}`}><p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 text-lg font-semibold text-slate-900">{value}</p></div>)}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
        <RevenueChart daily={summary.daily} />
        <TopProducts products={summary.topProducts} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.7fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-950">Recent orders</h2><p className="mt-1 text-xs text-slate-500">Latest activity across all statuses</p></div>
          <Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>{recent.map((order) => <TableRow key={order.id}><TableCell className="font-mono text-xs text-slate-500">#{order.id.slice(-6).toUpperCase()}</TableCell><TableCell className="font-medium">{order.customer_name}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell><TableCell className="text-slate-500">{date.format(new Date(order.ordered_at))}</TableCell><TableCell className="text-right font-medium">{currency.format(order.total)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h2 className="text-sm font-semibold text-slate-950">Inventory attention</h2><p className="mt-1 text-xs text-slate-500">Below configured minimum stock</p>
          <div className="mt-5 space-y-4">{lowStock.map((item) => <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-800">{item.name}</span><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">LOW</span></div><div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>{number.format(item.current_stock)} {item.unit} left</span><span>Min {number.format(item.minimum_stock)}</span></div></div>)}</div>
        </div>
      </section>
    </div>
  )
}
