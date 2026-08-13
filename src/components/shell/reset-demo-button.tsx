'use client'

import { useState, useTransition } from 'react'
import { LoaderCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { resetDemo } from '@/actions/demo'
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

export function ResetDemoButton({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function reset() {
    startTransition(async () => {
      const result = await resetDemo()
      if (result.success) {
        toast.success(result.message)
        setOpen(false)
      } else toast.error(result.message)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={disabled}
        title={disabled ? 'Connect Supabase to enable reset.' : undefined}
        render={<Button variant="outline" size="sm" />}
      >
        <RotateCcw className="size-3.5" />
        <span className="hidden sm:inline">Reset demo data</span>
        <span className="sm:hidden">Reset</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore the fictional dataset?</AlertDialogTitle>
          <AlertDialogDescription>
            This replaces every change in your private visitor workspace with the original deterministic demo data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={reset} disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            Restore demo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
