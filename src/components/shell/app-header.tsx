import { Code2, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MobileNav } from './mobile-nav'
import { ResetDemoButton } from './reset-demo-button'

export function AppHeader({ githubUrl, live }: { githubUrl: string; live: boolean }) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div>
          <p className="text-sm font-semibold text-slate-900">Restaurant operations workspace</p>
          <p className="text-xs text-slate-500">Fictional portfolio environment</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ResetDemoButton disabled={!live} />
        <Button nativeButton={false} variant="outline" size="sm" render={<a href={githubUrl} target="_blank" rel="noreferrer" />}>
          <Code2 className="size-3.5" />
          <span className="hidden sm:inline">GitHub</span>
          <ExternalLink className="size-3" />
        </Button>
      </div>
    </header>
  )
}
