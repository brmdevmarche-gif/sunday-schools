import { createClient } from './supabase/client'

export interface UserProfile {
  id: string
  email: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string | null
}

export interface UpdateProfileData {
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
}

/**
 * Get the current user's profile from the users table
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()

  // First get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Not authenticated')
  }

  // Query the users table for profile data
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    // If profile doesn't exist, return null
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as UserProfile
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(updates: UpdateProfileData): Promise<UserProfile> {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Not authenticated')
  }

  // Update profile
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error

  return data as UserProfile
}

/**
 * Get a user's profile by ID
 * Note: This requires a public read policy if you want to view other users' profiles
 */
export async function getProfileById(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as UserProfile
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (error) throw error

  return data === null
}
