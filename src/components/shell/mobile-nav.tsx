'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import { BrandMark } from '@/components/brand/brand-mark'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav'

export function MobileNav() {
  const pathname = usePathname()
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" />}>
        <Menu />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[290px] border-r-0 !bg-[#0b1530] p-0 text-slate-100">
        <SheetHeader className="border-b border-white/10 p-5">
          <SheetTitle><BrandMark /></SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400', active && 'bg-indigo-500/15 text-indigo-200')}>
                <item.icon className="size-4" />{item.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
