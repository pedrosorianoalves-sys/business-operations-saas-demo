import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  return <Badge variant="outline" className={cn('capitalize', styles[status])}>{status}</Badge>
}
