import { Crown } from 'lucide-react'

import { currency, number } from '@/lib/format'

export function TopProducts({ products }: { products: { id: string; name: string; quantity: number; revenue: number }[] }) {
  const max = Math.max(1, ...products.map((product) => product.quantity))
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between">
        <div><h2 className="text-sm font-semibold text-slate-950">Top products</h2><p className="mt-1 text-xs text-slate-500">By completed units</p></div>
        <Crown className="size-4 text-amber-500" />
      </div>
      <div className="mt-5 space-y-4">
        {products.map((product, index) => (
          <div key={product.id}>
            <div className="flex items-center gap-3 text-xs">
              <span className="grid size-6 place-items-center rounded-md bg-slate-100 font-semibold text-slate-500">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{product.name}</span>
              <span className="text-slate-400">{number.format(product.quantity)} units</span>
              <span className="w-16 text-right font-medium text-slate-700">{currency.format(product.revenue)}</span>
            </div>
            <div className="ml-9 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(product.quantity / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
