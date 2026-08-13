import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppHeader } from '@/components/shell/app-header'
import { Sidebar } from '@/components/shell/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { getPublicEnvironment } from '@/lib/env'

import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'BusinessOps Demo',
    template: '%s · BusinessOps Demo',
  },
  description:
    'A public portfolio SaaS demonstrating restaurant operations, relational data, inventory costing, orders, reports, and validated JSON imports.',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const environment = getPublicEnvironment()
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen lg:flex">
          <Sidebar githubUrl={environment.githubUrl} />
          <div className="min-w-0 flex-1 bg-[#f7f9fc]">
            <AppHeader githubUrl={environment.githubUrl} live={environment.isSupabaseConfigured} />
            <main className="mx-auto w-full max-w-[1540px] p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
