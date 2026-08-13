'use client'

import { useState, useTransition } from 'react'
import { LoaderCircle, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'

import type { ActionResult } from '@/actions/demo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export interface FormFieldDefinition {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'datetime-local' | 'hidden'
  defaultValue?: string | number | null
  placeholder?: string
  required?: boolean
  min?: number
  step?: string
  options?: { value: string; label: string }[]
  span?: 1 | 2
}

export function ActionDialog({
  title,
  description,
  triggerLabel,
  submitLabel,
  fields,
  action,
  disabled = false,
  triggerVariant = 'default',
  triggerSize = 'default',
  icon = 'plus',
}: {
  title: string
  description: string
  triggerLabel: string
  submitLabel: string
  fields: FormFieldDefinition[]
  action: (formData: FormData) => Promise<ActionResult>
  disabled?: boolean
  triggerVariant?: 'default' | 'outline' | 'ghost'
  triggerSize?: 'default' | 'sm'
  icon?: 'plus' | 'pencil' | 'none'
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await action(formData)
      if (result.success) {
        toast.success(result.message)
        setOpen(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={disabled}
        title={disabled ? 'Connect Supabase to enable this action.' : undefined}
        render={<Button variant={triggerVariant} size={triggerSize} />}
      >
        {icon === 'plus' && <Plus className="size-4" />}
        {icon === 'pencil' && <Pencil className="size-4" />}
        {triggerLabel || <span className="sr-only">{title}</span>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-5">
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              if (field.type === 'hidden') {
                return <input key={field.name} type="hidden" name={field.name} value={field.defaultValue ?? ''} />
              }
              const common = {
                name: field.name,
                defaultValue: field.defaultValue ?? '',
                placeholder: field.placeholder,
                required: field.required,
              }
              return (
                <Field key={field.name} className={field.span === 2 ? 'sm:col-span-2' : undefined}>
                  <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
                  {field.type === 'textarea' ? (
                    <Textarea id={field.name} rows={3} {...common} />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
                      {...common}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type ?? 'text'}
                      min={field.min}
                      step={field.step}
                      {...common}
                    />
                  )}
                </Field>
              )
            })}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {pending ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
