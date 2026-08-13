import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { getPublicEnvironment } from '@/lib/env'
import { ensureDemoSession, type DemoSessionClient } from './session'

export async function updateDemoSession(request: NextRequest) {
  const environment = getPublicEnvironment()
  if (!environment.isSupabaseConfigured) return NextResponse.next({ request })

  let response = NextResponse.next({ request })
  const client = createServerClient(
    environment.supabaseUrl!,
    environment.supabaseAnonKey!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  try {
    await ensureDemoSession(client as unknown as DemoSessionClient)
  } catch (error) {
    response.headers.set(
      'x-businessops-session-error',
      error instanceof Error ? error.message : 'Demo session initialization failed.',
    )
  }

  return response
}
