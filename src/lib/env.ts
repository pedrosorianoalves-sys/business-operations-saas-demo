const DEFAULT_GITHUB_URL =
  'https://github.com/pedrosorianoalves-sys/business-operations-saas-demo'

type PublicEnvironmentSource = Partial<
  Record<
    | 'NEXT_PUBLIC_SUPABASE_URL'
    | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    | 'NEXT_PUBLIC_GITHUB_URL',
    string | undefined
  >
>

export interface PublicEnvironment {
  isSupabaseConfigured: boolean
  supabaseUrl: string | null
  supabaseAnonKey: string | null
  githubUrl: string
}

export function getPublicEnvironment(
  source: PublicEnvironmentSource = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL,
  },
): PublicEnvironment {
  const supabaseUrl = source.NEXT_PUBLIC_SUPABASE_URL?.trim() || null
  const supabaseAnonKey = source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null

  return {
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseUrl,
    supabaseAnonKey,
    githubUrl: source.NEXT_PUBLIC_GITHUB_URL?.trim() || DEFAULT_GITHUB_URL,
  }
}
