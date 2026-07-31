
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function requireAdmin() {
  console.log('=== DEBUG: requireAdmin called ===')

  const supabase = createClient()
  console.log('Supabase client created successfully')

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Auth getUser result:', { user, authError })

  if (authError) {
    console.error('Auth error:', authError)
    throw new Error('Authentication failed')
  }

  if (!user) {
    console.error('No user found in session')
    throw new Error('Not authenticated')
  }

  console.log('User found:', user.id)

  // Try to fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('Profile query result:', { profile, profileError })

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    throw new Error('Database access error')
  }

  console.log('Profile data:', profile)

  if (profile?.role !== 'super_admin') {
    console.error('Role mismatch - expected super_admin, got:', profile?.role)
    throw new Error('Insufficient permissions')
  }

  console.log('Admin access granted')
  return { user, profile }
}
