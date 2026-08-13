import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return <div className="space-y-6" aria-label="Loading BusinessOps data">
    <div className="space-y-2"><Skeleton className="h-4 w-32"/><Skeleton className="h-9 w-72"/><Skeleton className="h-4 w-full max-w-xl"/></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4},(_,index)=><Skeleton key={index} className="h-40 rounded-2xl"/>)}</div>
    <div className="grid gap-4 xl:grid-cols-2"><Skeleton className="h-80 rounded-2xl"/><Skeleton className="h-80 rounded-2xl"/></div>
  </div>
}
