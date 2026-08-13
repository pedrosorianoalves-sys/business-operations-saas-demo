'use client'

import { CircleAlert, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-[60vh] place-items-center"><div className="max-w-md rounded-2xl border bg-white p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600"><CircleAlert/></span><h1 className="mt-5 text-xl font-semibold">This view could not be loaded</h1><p className="mt-2 text-sm leading-6 text-slate-500">The demo session may still be initializing. Retry the request; no private business data is involved.</p><Button className="mt-5" onClick={reset}><RotateCcw/>Try again</Button></div></div>
}
