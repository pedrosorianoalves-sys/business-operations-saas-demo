'use client'

import { useTransition } from 'react'
import { Ban, CheckCircle2, LoaderCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { deletePendingOrder, updateOrderStatus } from '@/actions/demo'
import { Button } from '@/components/ui/button'

export function OrderActions({ id, status, disabled }: { id: string; status: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition()
  function run(operation: 'complete' | 'cancel' | 'delete') {
    const formData = new FormData(); formData.set('id', id); formData.set('operation', operation)
    startTransition(async () => {
      const result = operation === 'delete' ? await deletePendingOrder(formData) : await updateOrderStatus(formData)
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    })
  }
  if (status !== 'pending') return null
  return <div className="flex justify-end gap-1">
    <Button variant="ghost" size="icon-sm" disabled={disabled||pending} title="Mark paid" onClick={()=>run('complete')}>{pending?<LoaderCircle className="animate-spin"/>:<CheckCircle2/>}</Button>
    <Button variant="ghost" size="icon-sm" disabled={disabled||pending} title="Cancel order" onClick={()=>run('cancel')}><Ban/></Button>
    <Button variant="ghost" size="icon-sm" disabled={disabled||pending} title="Delete pending order" onClick={()=>run('delete')}><Trash2/></Button>
  </div>
}
