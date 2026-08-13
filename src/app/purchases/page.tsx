import type { Metadata } from 'next'
import { CircleDollarSign, PackagePlus, ReceiptText } from 'lucide-react'

import { recordPurchase } from '@/actions/demo'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ActionDialog } from '@/components/forms/action-dialog'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { loadDemoData } from '@/data/server'
import { currency, date, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Purchases' }

export default async function PurchasesPage() {
  const data = await loadDemoData()
  const disabled = data.source !== 'supabase'
  const spend = data.purchases.reduce((sum, purchase) => sum + purchase.total_cost, 0)
  const suppliers = new Set(data.purchases.map((purchase) => purchase.supplier).filter(Boolean)).size

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Procurement"
        title="Purchases"
        description="Ingredient receipts update stock and recalculate weighted average costs in one transaction."
        action={
          <ActionDialog
            title="Record purchase"
            description="The stock movement and new weighted cost are committed together."
            triggerLabel="New purchase"
            submitLabel="Record purchase"
            fields={[
              { name: 'ingredientId', label: 'Ingredient', type: 'select', options: data.ingredients.map((item) => ({ value: item.id, label: `${item.name} (${item.unit})` })) },
              { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0, step: '0.0001' },
              { name: 'unitCost', label: 'Unit cost', type: 'number', required: true, min: 0, step: '0.000001' },
              { name: 'supplier', label: 'Supplier', placeholder: 'Demo Supply Co.' },
              { name: 'purchasedAt', label: 'Purchase date', type: 'datetime-local' },
            ]}
            action={recordPurchase}
            disabled={disabled}
          />
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Recorded spend" value={currency.format(spend)} detail="Across fictional receipts" icon={CircleDollarSign} />
        <KpiCard label="Purchase records" value={number.format(data.purchases.length)} detail="Auditable stock entries" icon={ReceiptText} tone="sky" />
        <KpiCard label="Suppliers" value={number.format(suppliers)} detail="Fictional vendors" icon={PackagePlus} tone="emerald" />
      </section>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Ingredient</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Unit cost</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>{data.purchases.map((purchase) => {
            const ingredient = data.ingredients.find((item) => item.id === purchase.ingredient_id)
            return <TableRow key={purchase.id}><TableCell className="text-slate-500">{date.format(new Date(purchase.purchased_at))}</TableCell><TableCell className="font-medium">{purchase.ingredient_name}</TableCell><TableCell className="text-slate-500">{purchase.supplier || '—'}</TableCell><TableCell className="text-right">{number.format(purchase.quantity)} {ingredient?.unit}</TableCell><TableCell className="text-right">{currency.format(purchase.unit_cost)}</TableCell><TableCell className="text-right font-semibold">{currency.format(purchase.total_cost)}</TableCell></TableRow>
          })}</TableBody>
        </Table>
      </div>
    </div>
  )
}
