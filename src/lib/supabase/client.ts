'use client'

import { createBrowserClient } from '@supabase/ssr'

import { getPublicEnvironment } from '@/lib/env'

export function createBrowserSupabaseClient() {
  const environment = getPublicEnvironment()
  if (!environment.isSupabaseConfigured) return null

  return createBrowserClient(
    environment.supabaseUrl!,
    environment.supabaseAnonKey!,
  )
}
