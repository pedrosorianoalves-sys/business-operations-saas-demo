'use client'

import { useMemo, useState, useTransition } from 'react'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { saveRecipe } from '@/actions/demo'
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
import { Input } from '@/components/ui/input'
import type { IngredientRecord, ProductRecord, RecipeRecord } from '@/data/types'

interface EditableItem {
  ingredientId: string
  quantity: number
  unit: string
}

export function RecipeEditor({
  products,
  ingredients,
  recipe,
  disabled,
}: {
  products: ProductRecord[]
  ingredients: IngredientRecord[]
  recipe?: RecipeRecord
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const initialProduct = recipe?.product_id ?? products[0]?.id ?? ''
  const [productId, setProductId] = useState(initialProduct)
  const [items, setItems] = useState<EditableItem[]>(
    recipe?.items.map((item) => ({ ingredientId: item.ingredient_id, quantity: item.quantity, unit: item.unit })) ??
      [{ ingredientId: ingredients[0]?.id ?? '', quantity: 1, unit: ingredients[0]?.unit ?? 'unit' }],
  )
  const product = useMemo(() => products.find((item) => item.id === productId), [productId, products])

  function update(index: number, patch: Partial<EditableItem>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function submit() {
    const formData = new FormData()
    formData.set('productId', productId)
    formData.set('items', JSON.stringify(items))
    startTransition(async () => {
      const result = await saveRecipe(formData)
      if (result.success) {
        toast.success(result.message)
        setOpen(false)
      } else toast.error(result.message)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={disabled} render={<Button variant={recipe ? 'ghost' : 'default'} size={recipe ? 'sm' : 'default'} />}>
        {!recipe && <Plus className="size-4" />}{recipe ? 'Edit recipe' : 'New recipe'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{recipe ? `Edit ${recipe.product_name}` : 'Create recipe'}</DialogTitle>
          <DialogDescription>Ingredient quantities calculate the product cost and margin automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block text-xs font-medium text-slate-700">Product
            <select className="mt-1.5 h-9 w-full rounded-lg border bg-white px-3 text-sm" value={productId} onChange={(event) => setProductId(event.target.value)} disabled={Boolean(recipe)}>
              {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="rounded-xl border bg-slate-50/60 p-3">
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Recipe ingredients</p><Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, { ingredientId: ingredients[0]?.id ?? '', quantity: 1, unit: ingredients[0]?.unit ?? 'unit' }])}><Plus />Add line</Button></div>
            <div className="space-y-2">{items.map((item, index) => {
              const ingredient = ingredients.find((candidate) => candidate.id === item.ingredientId)
              return <div key={`${item.ingredientId}-${index}`} className="grid grid-cols-[minmax(0,1fr)_90px_74px_30px] items-center gap-2">
                <select className="h-8 rounded-lg border bg-white px-2 text-xs" value={item.ingredientId} onChange={(event) => { const selected=ingredients.find((candidate)=>candidate.id===event.target.value);update(index,{ingredientId:event.target.value,unit:selected?.unit??'unit'}) }}>{ingredients.map((option)=><option key={option.id} value={option.id}>{option.name}</option>)}</select>
                <Input type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event)=>update(index,{quantity:Number(event.target.value)})} />
                <span className="rounded-lg border bg-white px-2 py-2 text-center text-xs text-slate-500">{ingredient?.unit ?? item.unit}</span>
                <Button type="button" variant="ghost" size="icon-sm" disabled={items.length===1} onClick={()=>setItems((current)=>current.filter((_,itemIndex)=>itemIndex!==index))}><Trash2 /></Button>
              </div>
            })}</div>
          </div>
          <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">Editing {product?.name ?? 'a product'} · unit compatibility is validated in both TypeScript and PostgreSQL.</div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={pending||!productId}>{pending&&<LoaderCircle className="animate-spin"/>}{pending?'Saving…':'Save recipe'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
