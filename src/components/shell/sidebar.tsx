'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code2 } from 'lucide-react'

import { BrandMark } from '@/components/brand/brand-mark'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav'

export function Sidebar({ githubUrl }: { githubUrl: string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden h-screen w-[272px] shrink-0 flex-col border-r border-white/10 bg-[#0b1530] text-slate-100 lg:flex">
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <BrandMark />
      </div>
      <nav aria-label="Primary navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white',
                active && 'bg-indigo-500/15 text-indigo-200 ring-1 ring-inset ring-indigo-400/20',
              )}
            >
              <item.icon className="size-[17px]" aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300 transition hover:border-indigo-400/40 hover:bg-white/[0.07]"
        >
          <Code2 className="size-4 text-indigo-300" />
          <span>
            <span className="block font-medium text-slate-100">Open source portfolio</span>
            <span className="mt-0.5 block text-slate-500">View implementation</span>
          </span>
        </a>
      </div>
    </aside>
  )
}
