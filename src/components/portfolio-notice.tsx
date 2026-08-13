import { FlaskConical } from 'lucide-react'

export function PortfolioNotice({ message }: { message?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-950">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-indigo-600" />
      <p>
        <span className="font-semibold">Portfolio demo.</span> All people, products, recipes, suppliers, prices, and orders are fictional.
        {message ? <span className="text-indigo-700"> {message}</span> : null}
      </p>
    </div>
  )
}
