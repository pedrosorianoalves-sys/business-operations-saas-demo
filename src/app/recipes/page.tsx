import type { Metadata } from 'next'

import { deleteRecipe } from '@/actions/demo'
import { DeleteButton } from '@/components/forms/delete-button'
import { RecipeEditor } from '@/components/forms/recipe-editor'
import { PageHeader } from '@/components/page-header'
import { loadDemoData } from '@/data/server'
import { currency, number } from '@/lib/format'

export const metadata: Metadata = { title: 'Recipes' }

export default async function RecipesPage() {
  const data = await loadDemoData(); const disabled = data.source !== 'supabase'
  return <div className="space-y-6"><PageHeader eyebrow="Unit economics" title="Recipes" description="Relational product formulas that drive ingredient consumption, cost, profit, and margin." action={<RecipeEditor products={data.products} ingredients={data.ingredients} disabled={disabled} />} />
    <div className="grid gap-4 lg:grid-cols-2">{data.recipes.map((recipe)=><article key={recipe.id} className="rounded-2xl border border-slate-200/80 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-950">{recipe.product_name}</h2><p className="mt-1 text-xs text-slate-500">Yield {number.format(recipe.yield_quantity)} · {recipe.items.length} ingredients</p></div><div className="flex items-center gap-1"><RecipeEditor products={data.products} ingredients={data.ingredients} recipe={recipe} disabled={disabled}/><DeleteButton id={recipe.id} label={`${recipe.product_name} recipe`} action={deleteRecipe} disabled={disabled}/></div></div><div className="mt-4 divide-y rounded-xl border border-slate-100 bg-slate-50/50 px-3">{recipe.items.map((item)=><div key={item.id} className="flex items-center justify-between py-2.5 text-xs"><span className="font-medium text-slate-700">{item.ingredient_name}</span><span className="text-slate-500">{number.format(item.quantity)} {item.unit}</span></div>)}</div><div className="mt-4 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-xs"><span className="text-indigo-700">Estimated recipe cost</span><strong className="text-indigo-950">{currency.format(recipe.estimated_cost)}</strong></div></article>)}</div>
  </div>
}
