import type { Metadata } from 'next'
import { deleteProduct, saveProduct } from '@/actions/demo'
import { ActionDialog } from '@/components/forms/action-dialog'
import { DeleteButton } from '@/components/forms/delete-button'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { loadDemoData } from '@/data/server'
import { currency, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Products' }

export default async function ProductsPage() {
  const data = await loadDemoData(); const disabled = data.source !== 'supabase'
  const baseFields = [{name:'name',label:'Product name',required:true},{name:'category',label:'Category'},{name:'price',label:'Sale price',type:'number' as const,required:true,min:0,step:'0.01'},{name:'isActive',label:'Status',type:'select' as const,defaultValue:'true',options:[{value:'true',label:'Active'},{value:'false',label:'Inactive'}]},{name:'description',label:'Description',type:'textarea' as const,span:2 as const}]
  return <div className="space-y-6"><PageHeader eyebrow="Catalog" title="Products" description="Menu catalog with recipe-derived cost, gross profit, and margin." action={<ActionDialog title="Create product" description="Add a fictional sellable product." triggerLabel="New product" submitLabel="Create product" fields={baseFields} action={saveProduct} disabled={disabled} />} />
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.products.map((product) => <article key={product.id} className="rounded-2xl border border-slate-200/80 bg-white p-5"><div className="flex items-start justify-between"><div><Badge variant="secondary">{product.category || 'Uncategorized'}</Badge><h2 className="mt-3 font-semibold text-slate-950">{product.name}</h2></div><Badge variant={product.is_active?'default':'outline'}>{product.is_active?'Active':'Inactive'}</Badge></div><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{product.description}</p><div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center"><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Price</p><p className="mt-1 text-sm font-semibold">{currency.format(product.price)}</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Cost</p><p className="mt-1 text-sm font-semibold">{currency.format(product.estimated_cost)}</p></div><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Margin</p><p className="mt-1 text-sm font-semibold text-emerald-600">{number.format(product.gross_margin_percent)}%</p></div></div><div className="mt-4 flex justify-end gap-1"><ActionDialog title="Edit product" description={`Update ${product.name}. Recipe cost stays calculated from ingredients.`} triggerLabel="" submitLabel="Save changes" triggerVariant="ghost" triggerSize="sm" icon="pencil" fields={[{name:'id',label:'',type:'hidden',defaultValue:product.id},...baseFields.map((field) => ({...field,defaultValue:field.name==='name'?product.name:field.name==='category'?product.category:field.name==='price'?product.price:field.name==='isActive'?String(product.is_active):product.description}))]} action={saveProduct} disabled={disabled} /><DeleteButton id={product.id} label={product.name} action={deleteProduct} disabled={disabled} /></div></article>)}</div></div>
}
