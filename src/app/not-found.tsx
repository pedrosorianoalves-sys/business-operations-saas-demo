import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound(){return <div className="grid min-h-[60vh] place-items-center text-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">404</p><h1 className="mt-3 text-2xl font-semibold">Page not found</h1><p className="mt-2 text-sm text-slate-500">That BusinessOps view does not exist.</p><Button nativeButton={false} className="mt-5" render={<Link href="/"/>}>Return to overview</Button></div></div>}
