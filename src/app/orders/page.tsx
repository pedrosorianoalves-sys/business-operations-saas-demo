import type { Metadata } from 'next'
import { CircleDollarSign, Clock3, ShoppingBag } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/kpi-card'
import { OrderEditor } from '@/components/forms/order-editor'
import { OrderActions } from '@/components/orders/order-actions'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { loadDemoData } from '@/data/server'
import { currency, date, label, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Orders' }

export default async function OrdersPage() {
  const data = await loadDemoData(); const disabled = data.source !== 'supabase'
  const completed = data.orders.filter((order)=>order.status==='completed')
  const pending = data.orders.filter((order)=>order.status==='pending')
  const revenue = completed.reduce((sum,order)=>sum+order.total,0)
  return <div className="space-y-6"><PageHeader eyebrow="Sales operations" title="Orders" description="Multi-line orders with payment state, profitability, and recipe-driven stock consumption." action={<OrderEditor customers={data.customers} products={data.products} disabled={disabled}/>} />
    <section className="grid gap-4 sm:grid-cols-3"><KpiCard label="Completed revenue" value={currency.format(revenue)} detail="Excludes pending and cancelled" icon={CircleDollarSign}/><KpiCard label="Completed orders" value={number.format(completed.length)} detail="Stock already deducted" icon={ShoppingBag} tone="emerald"/><KpiCard label="Awaiting payment" value={number.format(pending.length)} detail="Can be paid or cancelled" icon={Clock3} tone="amber"/></section>
    <div className="overflow-hidden rounded-2xl border bg-white"><Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Profit</TableHead><TableHead className="w-28"/></TableRow></TableHeader><TableBody>{data.orders.map((order)=><TableRow key={order.id}><TableCell className="font-mono text-xs text-slate-500">#{order.id.slice(-6).toUpperCase()}</TableCell><TableCell className="font-medium">{order.customer_name}</TableCell><TableCell className="max-w-52 truncate text-slate-500">{order.items.map((item)=>`${number.format(item.quantity)}× ${item.product_name}`).join(', ')}</TableCell><TableCell className="text-xs text-slate-500">{label(order.payment_method)}</TableCell><TableCell><StatusBadge status={order.status}/></TableCell><TableCell className="text-slate-500">{date.format(new Date(order.ordered_at))}</TableCell><TableCell className="text-right font-medium">{currency.format(order.total)}</TableCell><TableCell className="text-right text-emerald-700">{currency.format(order.gross_profit)}</TableCell><TableCell><OrderActions id={order.id} status={order.status} disabled={disabled}/></TableCell></TableRow>)}</TableBody></Table></div>
  </div>
}
