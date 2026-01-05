'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types/sunday-school'

export async function getUsersData(filters?: {
  role?: string
  churchId?: string
  dioceseId?: string
}) {
  const supabase = await createClient()

  // First verify the current user is authenticated and has admin permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('User not authenticated')
    return []
  }

  // Get current user's profile to check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Verify user has admin permissions
  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    console.error('User does not have admin permissions')
    return []
  }

  let query = supabase
    .from('users')
    .select('*')
    .order('full_name', { ascending: true })

  if (filters?.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }
  if (filters?.churchId && filters.churchId !== 'all') {
    query = query.eq('church_id', filters.churchId)
  }
  if (filters?.dioceseId && filters.dioceseId !== 'all') {
    query = query.eq('diocese_id', filters.dioceseId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

export async function getChurchesData() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('churches')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching churches:', error)
    return []
  }

  return data
}

export async function getDiocesesData() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dioceses')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching dioceses:', error)
    return []
  }

  return data
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
  dioceseId: string | null,
  churchId: string | null,
  fullName?: string,
  username?: string
) {
  const supabase = await createClient()

  const updateData: any = {
    role,
    diocese_id: dioceseId,
    church_id: churchId,
  }

  if (fullName !== undefined) {
    updateData.full_name = fullName || null
  }

  if (username !== undefined) {
    updateData.username = username || null
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    throw new Error('Failed to update user role')
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function activateUserAction(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) {
    console.error('Error activating user:', error)
    throw new Error('Failed to activate user')
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deactivateUserAction(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) {
    console.error('Error deactivating user:', error)
    throw new Error('Failed to deactivate user')
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function linkParentToStudentAction(
  parentId: string,
  studentId: string,
  relationshipType: 'parent' | 'guardian' = 'parent'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_relationships')
    .insert({
      parent_id: parentId,
      student_id: studentId,
      relationship_type: relationshipType,
    })

  if (error) {
    console.error('Error linking parent to student:', error)
    throw new Error('Failed to link parent to student')
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function createUserAction(input: {
  email: string
  password: string
  role: UserRole
  username?: string
  full_name?: string
  church_id?: string
  diocese_id?: string
}) {
  // This will still use the API route since it requires service role key
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/create-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  )

  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    console.error('Failed to parse response:', text)
    throw new Error('Invalid response from server')
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create user')
  }

  revalidatePath('/admin/users')
  return data
}

export async function verifyAdminIdentityAction(adminPassword: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current admin user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get admin's profile to check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(profile.role)) {
    return { success: false, error: 'Not authorized' }
  }

  // Verify admin password by attempting to sign in
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Server configuration error' }
  }

  const verifyClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error: signInError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password: adminPassword,
  })

  if (signInError) {
    return { success: false, error: 'Incorrect password' }
  }

  return { success: true }
}

export async function changeUserPasswordAction(
  targetUserId: string,
  newPassword: string,
  adminPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current admin user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get admin's profile to check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role, church_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(profile.role)) {
    return { success: false, error: 'Not authorized to change passwords' }
  }

  // Verify admin password first
  const verifyResult = await verifyAdminIdentityAction(adminPassword)
  if (!verifyResult.success) {
    return { success: false, error: verifyResult.error || 'Identity verification failed' }
  }

  // For non-super admins, check if target user is in their scope
  if (profile.role !== 'super_admin') {
    const adminClient = createAdminClient()
    const { data: targetUser } = await adminClient
      .from('users')
      .select('church_id, role')
      .eq('id', targetUserId)
      .single()

    if (!targetUser) {
      return { success: false, error: 'Target user not found' }
    }

    // Church admins and teachers can only change passwords for users in their church
    if (['church_admin', 'teacher'].includes(profile.role)) {
      if (targetUser.church_id !== profile.church_id) {
        return { success: false, error: 'Cannot change password for users outside your church' }
      }
      // Teachers can only change passwords for students
      if (profile.role === 'teacher' && targetUser.role !== 'student') {
        return { success: false, error: 'Teachers can only change student passwords' }
      }
    }
  }

  // Validate new password
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' }
  }

  // Use admin client to update the user's password
  const adminClient = createAdminClient()
  const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
  })

  if (updateError) {
    console.error('Error changing password:', updateError)
    return { success: false, error: 'Failed to change password' }
  }

  revalidatePath(`/admin/users/${targetUserId}`)
  return { success: true }
}
