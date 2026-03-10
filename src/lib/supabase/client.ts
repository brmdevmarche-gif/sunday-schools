import { createBrowserClient } from '@supabase/ssr'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase config. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. ' +
        'Restart the dev server after changing env vars.'
    )
  }

  if (!url.startsWith('https://') && !url.startsWith('http://127.0.0.1') && !url.startsWith('http://localhost')) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://xxx.supabase.co or http://127.0.0.1:54321 for local)'
    )
  }

  return { url, key }
}

export function createClient() {
  const { url, key } = getSupabaseConfig()
  return createBrowserClient(url, key)
}
