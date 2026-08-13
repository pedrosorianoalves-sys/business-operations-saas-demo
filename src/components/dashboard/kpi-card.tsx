import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'indigo',
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: 'indigo' | 'emerald' | 'amber' | 'sky'
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  }
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between">
        <div className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-[18px]" /></div>
        <ArrowUpRight className="size-4 text-slate-300" />
      </div>
      <p className="mt-5 text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  )
}
