import { Activity } from 'lucide-react'

import { cn } from '@/lib/utils'

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn('flex items-center gap-3', className)}>
    <span className="grid size-10 place-items-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/40"><Activity className="size-5" /></span>
    {!compact && <span><span className="block text-[15px] font-semibold tracking-tight text-white">BusinessOps</span><span className="block text-xs text-slate-400">Restaurant OS Demo</span></span>}
  </div>
}
