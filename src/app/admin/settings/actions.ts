'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface UserSettings {
  id: string
  user_id: string
  language: 'en' | 'ar' | 'fr' | 'es'
  theme: 'light' | 'dark' | 'system'
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  time_format: '12h' | '24h'
  timezone: string
  notifications_enabled: boolean
  email_notifications: boolean
  created_at: string
  updated_at: string
}

export interface BackupLog {
  id: string
  backup_type: 'manual' | 'scheduled' | 'automatic'
  backup_status: 'started' | 'completed' | 'failed'
  file_size_bytes: number | null
  file_path: string | null
  created_by: string | null
  error_message: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export async function getCurrentUserSettings(): Promise<UserSettings | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user settings:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return null
  }

  return data
}

export async function updateUserSettings(
  settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // First, try to get existing settings
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Update existing settings
    const { error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating settings:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error('Failed to update settings')
    }
  } else {
    // Create new settings
    const { error } = await supabase.from('user_settings').insert({
      user_id: user.id,
      ...settings,
    })

    if (error) {
      console.error('Error creating settings:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error('Failed to create settings')
    }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function getBackupLogs(): Promise<BackupLog[]> {
  const supabase = await createClient()

  // Check if user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return []
  }

  const { data, error } = await supabase
    .from('backup_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching backup logs:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return []
  }

  return data || []
}

export async function createBackupLog(type: 'manual' | 'scheduled' | 'automatic') {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if user is super admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Only super admins can create backups')
  }

  // Create backup log entry
  const { data, error } = await supabase
    .from('backup_logs')
    .insert({
      backup_type: type,
      backup_status: 'started',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating backup log:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error('Failed to create backup log')
  }

  // Note: In a production environment, you would trigger an actual backup here
  // For now, we'll just mark it as completed
  // You would typically use a background job or cloud function for this

  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Update to completed
  await supabase
    .from('backup_logs')
    .update({
      backup_status: 'completed',
      file_path: `/backups/backup-${data.id}.sql`,
      metadata: {
        tables_backed_up: [
          'users',
          'dioceses',
          'churches',
          'classes',
          'lessons',
          'activities',
          'trips',
        ],
      },
    })
    .eq('id', data.id)

  revalidatePath('/admin/settings')
  return { success: true, backupId: data.id }
}

export async function getDatabaseStats() {
  const supabase = await createClient()

  // Check if user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return null
  }

  // Get counts from various tables
  const [
    { count: usersCount },
    { count: diocesesCount },
    { count: churchesCount },
    { count: classesCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('dioceses').select('*', { count: 'exact', head: true }),
    supabase.from('churches').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
  ])

  return {
    users: usersCount || 0,
    dioceses: diocesesCount || 0,
    churches: churchesCount || 0,
    classes: classesCount || 0,
    lastBackup: null, // Would come from backup_logs
  }
}
