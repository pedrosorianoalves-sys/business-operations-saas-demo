import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getPublicEnvironment } from '@/lib/env'

export async function createServerSupabaseClient() {
  const environment = getPublicEnvironment()
  if (!environment.isSupabaseConfigured) return null

  const cookieStore = await cookies()
  return createServerClient(
    environment.supabaseUrl!,
    environment.supabaseAnonKey!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Components cannot set cookies; the proxy refreshes them.
          }
        },
      },
    },
  )
}
