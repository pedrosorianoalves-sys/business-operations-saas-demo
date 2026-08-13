import type { Metadata } from 'next'
import { AlertTriangle } from 'lucide-react'

import { deleteIngredient, saveIngredient } from '@/actions/demo'
import { ActionDialog, type FormFieldDefinition } from '@/components/forms/action-dialog'
import { DeleteButton } from '@/components/forms/delete-button'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { loadDemoData } from '@/data/server'
import { currency, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Ingredients' }
const unitOptions = ['g', 'kg', 'ml', 'l', 'unit'].map((value) => ({ value, label: value }))
const baseFields: FormFieldDefinition[] = [
  { name: 'name', label: 'Ingredient name', required: true },
  { name: 'unit', label: 'Base unit', type: 'select', options: unitOptions, defaultValue: 'unit' },
  { name: 'currentStock', label: 'Current stock', type: 'number', required: true, min: 0, step: '0.0001' },
  { name: 'minimumStock', label: 'Minimum stock', type: 'number', required: true, min: 0, step: '0.0001' },
  { name: 'averageCost', label: 'Average unit cost', type: 'number', required: true, min: 0, step: '0.000001' },
  { name: 'supplier', label: 'Supplier' },
]

export default async function IngredientsPage() {
  const data = await loadDemoData(); const disabled = data.source !== 'supabase'
  return <div className="space-y-6">
    <PageHeader eyebrow="Cost inputs" title="Ingredients" description="Base units, weighted costs, suppliers, and stock thresholds." action={<ActionDialog title="Create ingredient" description="Add an inventory input to the isolated workspace." triggerLabel="New ingredient" submitLabel="Create ingredient" fields={baseFields} action={saveIngredient} disabled={disabled} />} />
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><Table><TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Minimum</TableHead><TableHead className="text-right">Avg. cost</TableHead><TableHead>Status</TableHead><TableHead className="w-24" /></TableRow></TableHeader><TableBody>{data.ingredients.map((item) => {
      const low = item.current_stock < item.minimum_stock
      const editFields: FormFieldDefinition[] = [
        { name: 'id', label: '', type: 'hidden', defaultValue: item.id },
        { name: 'name', label: 'Ingredient name', defaultValue: item.name, required: true },
        { name: 'unit', label: 'Base unit', type: 'select', options: unitOptions, defaultValue: item.unit },
        { name: 'currentStock', label: 'Current stock', type: 'number', defaultValue: item.current_stock, required: true, min: 0, step: '0.0001' },
        { name: 'minimumStock', label: 'Minimum stock', type: 'number', defaultValue: item.minimum_stock, required: true, min: 0, step: '0.0001' },
        { name: 'averageCost', label: 'Average unit cost', type: 'number', defaultValue: item.average_cost, required: true, min: 0, step: '0.000001' },
        { name: 'supplier', label: 'Supplier', defaultValue: item.supplier },
      ]
      return <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-slate-500">{item.supplier}</TableCell><TableCell className="text-right">{number.format(item.current_stock)} {item.unit}</TableCell><TableCell className="text-right text-slate-500">{number.format(item.minimum_stock)}</TableCell><TableCell className="text-right">{currency.format(item.average_cost)}</TableCell><TableCell>{low ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700"><AlertTriangle className="size-3" />Low</Badge> : <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Healthy</Badge>}</TableCell><TableCell><div className="flex justify-end gap-1"><ActionDialog title="Edit ingredient" description="Stock and cost changes remain tenant-scoped and recalculate affected product margins." triggerLabel="" submitLabel="Save changes" fields={editFields} action={saveIngredient} disabled={disabled} triggerVariant="ghost" triggerSize="sm" icon="pencil" /><DeleteButton id={item.id} label={item.name} action={deleteIngredient} disabled={disabled} /></div></TableCell></TableRow>
    })}</TableBody></Table></div>
  </div>
}
