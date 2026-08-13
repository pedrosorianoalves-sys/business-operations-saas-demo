import type { Metadata } from 'next'
import { deleteCustomer, saveCustomer } from '@/actions/demo'
import { ActionDialog } from '@/components/forms/action-dialog'
import { DeleteButton } from '@/components/forms/delete-button'
import { PageHeader } from '@/components/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { loadDemoData } from '@/data/server'
import { currency, date, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Customers' }

export default async function CustomersPage() {
  const data = await loadDemoData()
  const disabled = data.source !== 'supabase'
  const newFields = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'phone', label: 'Phone', placeholder: '+1 555 010 1201' },
    { name: 'email', label: 'Email', type: 'email' as const, placeholder: 'demo.customer@example.com' },
    { name: 'notes', label: 'Notes', type: 'textarea' as const, span: 2 as const },
  ]
  return <div className="space-y-6">
    <PageHeader eyebrow="CRM" title="Customers" description="Fictional customer profiles with spend, order count, and last-order context." action={<ActionDialog title="Create customer" description="Add a fictional customer to your isolated demo workspace." triggerLabel="New customer" submitLabel="Create customer" fields={newFields} action={saveCustomer} disabled={disabled} />} />
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Last order</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Lifetime spend</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
      <TableBody>{data.customers.map((customer) => <TableRow key={customer.id}><TableCell><div className="font-medium text-slate-900">{customer.name}</div><div className="text-xs text-slate-400">{customer.email}</div></TableCell><TableCell className="text-slate-500">{customer.phone || '—'}</TableCell><TableCell className="text-slate-500">{customer.last_order_at ? date.format(new Date(customer.last_order_at)) : 'No orders'}</TableCell><TableCell className="text-right">{number.format(customer.total_orders)}</TableCell><TableCell className="text-right font-medium">{currency.format(customer.total_spent)}</TableCell><TableCell><div className="flex justify-end gap-1"><ActionDialog title="Edit customer" description={`Update ${customer.name}'s fictional profile.`} triggerLabel="" submitLabel="Save changes" triggerVariant="ghost" triggerSize="sm" icon="pencil" fields={[{name:'id',label:'',type:'hidden',defaultValue:customer.id},{name:'name',label:'Full name',defaultValue:customer.name,required:true},{name:'phone',label:'Phone',defaultValue:customer.phone},{name:'email',label:'Email',type:'email',defaultValue:customer.email},{name:'notes',label:'Notes',type:'textarea',defaultValue:customer.notes,span:2}]} action={saveCustomer} disabled={disabled} /><DeleteButton id={customer.id} label={customer.name} action={deleteCustomer} disabled={disabled} /></div></TableCell></TableRow>)}</TableBody></Table>
    </div>
  </div>
}
