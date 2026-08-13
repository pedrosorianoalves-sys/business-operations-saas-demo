'use client'

import { useMemo, useState, useTransition } from 'react'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { createOrder } from '@/actions/demo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { CustomerRecord, ProductRecord } from '@/data/types'
import { currency } from '@/lib/format'

interface LineItem { productId: string; quantity: number; courtesyQuantity: number }

export function OrderEditor({ customers, products, disabled }: { customers: CustomerRecord[]; products: ProductRecord[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [paymentMethod, setPaymentMethod] = useState('credit_card')
  const [status, setStatus] = useState('pending')
  const [discount, setDiscount] = useState(0)
  const [items, setItems] = useState<LineItem[]>([{ productId: products[0]?.id ?? '', quantity: 1, courtesyQuantity: 0 }])
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0), [items, products])

  function update(index: number, patch: Partial<LineItem>) {
    setItems((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, ...patch } : item))
  }

  function submit() {
    const formData = new FormData()
    formData.set('customerId', customerId)
    formData.set('paymentMethod', paymentMethod)
    formData.set('status', status)
    formData.set('discount', String(discount))
    formData.set('items', JSON.stringify(items))
    startTransition(async () => {
      const result = await createOrder(formData)
      if (result.success) { toast.success(result.message); setOpen(false) }
      else toast.error(result.message)
    })
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger disabled={disabled} title={disabled ? 'Connect Supabase to enable this action.' : undefined} render={<Button />}><Plus />New order</DialogTrigger>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Create order</DialogTitle><DialogDescription>Pending orders can be paid later; completed orders consume recipe stock atomically.</DialogDescription></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-xs font-medium text-slate-700 sm:col-span-2">Customer<select className="mt-1.5 h-9 w-full rounded-lg border bg-white px-3 text-sm" value={customerId} onChange={(event)=>setCustomerId(event.target.value)}>{customers.map((customer)=><option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-700">Status<select className="mt-1.5 h-9 w-full rounded-lg border bg-white px-3 text-sm" value={status} onChange={(event)=>setStatus(event.target.value)}><option value="pending">Pending</option><option value="completed">Completed / paid</option></select></label>
        <label className="text-xs font-medium text-slate-700">Payment<select className="mt-1.5 h-9 w-full rounded-lg border bg-white px-3 text-sm" value={paymentMethod} onChange={(event)=>setPaymentMethod(event.target.value)}><option value="credit_card">Credit Card</option><option value="debit_card">Debit Card</option><option value="cash">Cash</option><option value="digital_wallet">Digital Wallet</option></select></label>
        <label className="text-xs font-medium text-slate-700">Discount<Input className="mt-1.5" type="number" min="0" step="0.01" value={discount} onChange={(event)=>setDiscount(Number(event.target.value))}/></label>
      </div>
      <div className="rounded-xl border bg-slate-50/60 p-3">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Order items</p><Button variant="outline" size="sm" onClick={()=>setItems((current)=>[...current,{productId:products[0]?.id??'',quantity:1,courtesyQuantity:0}])}><Plus/>Add item</Button></div>
        <div className="space-y-2">{items.map((item,index)=><div key={`${item.productId}-${index}`} className="grid grid-cols-[minmax(0,1fr)_80px_90px_30px] gap-2"><select className="h-8 rounded-lg border bg-white px-2 text-xs" value={item.productId} onChange={(event)=>update(index,{productId:event.target.value})}>{products.map((product)=><option key={product.id} value={product.id}>{product.name} · {currency.format(product.price)}</option>)}</select><Input type="number" min="0.0001" step="1" value={item.quantity} aria-label="Quantity" onChange={(event)=>update(index,{quantity:Number(event.target.value)})}/><Input type="number" min="0" step="1" value={item.courtesyQuantity} aria-label="Courtesy quantity" title="Courtesy quantity" onChange={(event)=>update(index,{courtesyQuantity:Number(event.target.value)})}/><Button variant="ghost" size="icon-sm" disabled={items.length===1} onClick={()=>setItems((current)=>current.filter((_,itemIndex)=>itemIndex!==index))}><Trash2/></Button></div>)}</div>
      </div>
      <div className="flex justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-950"><span>Estimated total</span><strong>{currency.format(Math.max(0,subtotal-discount))}</strong></div>
      <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={pending||!customerId||items.some((item)=>!item.productId||item.quantity<=0)}>{pending&&<LoaderCircle className="animate-spin"/>}{pending?'Creating…':'Create order'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
