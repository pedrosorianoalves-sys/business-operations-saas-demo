import { describe, expect, it } from 'vitest'

import { getPublicEnvironment } from './env'

describe('getPublicEnvironment', () => {
  it('reports a configured Supabase environment', () => {
    expect(
      getPublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
        NEXT_PUBLIC_GITHUB_URL: 'https://github.com/example/businessops',
      }),
    ).toEqual({
      isSupabaseConfigured: true,
      supabaseUrl: 'https://demo-project.supabase.co',
      supabaseAnonKey: 'public-anon-key',
      githubUrl: 'https://github.com/example/businessops',
    })
  })

  it('uses the portfolio repository and preview mode when database values are absent', () => {
    expect(getPublicEnvironment({})).toEqual({
      isSupabaseConfigured: false,
      supabaseUrl: null,
      supabaseAnonKey: null,
      githubUrl:
        'https://github.com/pedrosorianoalves-sys/business-operations-saas-demo',
    })
  })

  it('does not accept a partial Supabase configuration', () => {
    expect(
      getPublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo-project.supabase.co',
      }).isSupabaseConfigured,
    ).toBe(false)
  })
})
