import { createClient } from './supabase/client'

export async function signUp(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signIn(emailOrUserCode: string, password: string) {
  const supabase = createClient()

  let email = emailOrUserCode

  // Check if input is a user_code (numeric, 6 digits) instead of email
  if (/^\d{6}$/.test(emailOrUserCode)) {
    // Look up the email by user_code
    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('email')
      .eq('user_code', emailOrUserCode)
      .single()

    if (lookupError || !user) {
      throw new Error('Invalid user code')
    }

    email = user.email
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}
