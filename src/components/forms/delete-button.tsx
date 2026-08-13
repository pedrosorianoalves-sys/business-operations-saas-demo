'use client'

import { useTransition } from 'react'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { ActionResult } from '@/actions/demo'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function DeleteButton({
  id,
  label,
  action,
  disabled = false,
}: {
  id: string
  label: string
  action: (formData: FormData) => Promise<ActionResult>
  disabled?: boolean
}) {
  const [pending, startTransition] = useTransition()

  function run() {
    const formData = new FormData()
    formData.set('id', id)
    startTransition(async () => {
      const result = await action(formData)
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        disabled={disabled}
        render={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${label}`} />}
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone inside this demo workspace.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={run}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
