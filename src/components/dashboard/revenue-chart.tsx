import { compactCurrency } from '@/lib/format'

export function RevenueChart({ daily }: { daily: { label: string; revenue: number; cogs: number }[] }) {
  const max = Math.max(1, ...daily.map((day) => day.revenue))
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Revenue vs COGS</h2>
          <p className="mt-1 text-xs text-slate-500">Completed orders · trailing 7 days</p>
        </div>
        <div className="flex gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-500" />Revenue</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-300" />COGS</span>
        </div>
      </div>
      <div className="mt-7 flex h-[220px] items-end gap-3 border-b border-slate-100 pb-1 sm:gap-5">
        {daily.map((day) => (
          <div key={day.label} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="invisible rounded-md bg-slate-950 px-2 py-1 text-[10px] text-white group-hover:visible">
              {compactCurrency.format(day.revenue)} / {compactCurrency.format(day.cogs)}
            </div>
            <div className="flex h-[165px] w-full max-w-[56px] items-end justify-center gap-1">
              <div className="w-[42%] rounded-t-md bg-indigo-500 transition hover:bg-indigo-600" style={{ height: `${Math.max(3, (day.revenue / max) * 100)}%` }} />
              <div className="w-[42%] rounded-t-md bg-slate-300" style={{ height: `${Math.max(3, (day.cogs / max) * 100)}%` }} />
            </div>
            <span className="text-[10px] font-medium text-slate-400">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
