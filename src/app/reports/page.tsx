import type { Metadata } from 'next'
import { CircleDollarSign, Percent, ReceiptText, TrendingUp } from 'lucide-react'

import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopProducts } from '@/components/dashboard/top-products'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { loadDemoData } from '@/data/server'
import { summarizeDashboard } from '@/domain/dashboard'
import { currency, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage(){const data=await loadDemoData();const summary=summarizeDashboard(data);const ranked=[...data.products].sort((a,b)=>b.gross_margin_percent-a.gross_margin_percent);return <div className="space-y-6"><PageHeader eyebrow="Decision support" title="Reports" description="Revenue, COGS, product contribution, and recipe-derived margins in one operational view."/><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Revenue" value={currency.format(summary.revenue)} detail="Completed orders" icon={CircleDollarSign}/><KpiCard label="COGS" value={currency.format(summary.cogs)} detail="Estimated recipe cost" icon={ReceiptText} tone="amber"/><KpiCard label="Gross profit" value={currency.format(summary.grossProfit)} detail="Revenue less COGS" icon={TrendingUp} tone="emerald"/><KpiCard label="Gross margin" value={`${number.format(summary.grossMarginPercent)}%`} detail="Portfolio-wide" icon={Percent} tone="sky"/></section><section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]"><RevenueChart daily={summary.daily}/><TopProducts products={summary.topProducts}/></section><div className="overflow-hidden rounded-2xl border bg-white"><div className="border-b px-5 py-4"><h2 className="text-sm font-semibold">Product economics</h2><p className="mt-1 text-xs text-slate-500">Current recipe cost against sale price</p></div><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Gross profit</TableHead><TableHead className="text-right">Margin</TableHead></TableRow></TableHeader><TableBody>{ranked.map((product)=><TableRow key={product.id}><TableCell className="font-medium">{product.name}</TableCell><TableCell className="text-slate-500">{product.category}</TableCell><TableCell className="text-right">{currency.format(product.price)}</TableCell><TableCell className="text-right">{currency.format(product.estimated_cost)}</TableCell><TableCell className="text-right text-emerald-700">{currency.format(product.gross_profit)}</TableCell><TableCell className="text-right font-semibold">{number.format(product.gross_margin_percent)}%</TableCell></TableRow>)}</TableBody></Table></div></div>}
