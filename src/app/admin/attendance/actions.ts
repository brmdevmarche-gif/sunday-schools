'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { CreateAttendanceInput, UpdateAttendanceInput } from '@/lib/types/sunday-school'

/**
 * Mark attendance for a student in a class
 */
export async function markAttendanceAction(input: CreateAttendanceInput) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client to bypass RLS
  const adminClient = createAdminClient()

  // Check if attendance already exists for this date
  const { data: existing } = await adminClient
    .from('attendance')
    .select('id')
    .eq('class_id', input.class_id)
    .eq('user_id', input.user_id)
    .eq('attendance_date', input.attendance_date)
    .single()

  if (existing) {
    // Update existing attendance
    const { error } = await adminClient
      .from('attendance')
      .update({
        status: input.status,
        notes: input.notes || null,
        lesson_id: input.lesson_id || null,
        marked_by: user.id,
      })
      .eq('id', existing.id)

    if (error) {
      throw new Error(`Failed to update attendance: ${error.message}`)
    }
  } else {
    // Create new attendance record
    const { error } = await adminClient
      .from('attendance')
      .insert({
        class_id: input.class_id,
        user_id: input.user_id,
        attendance_date: input.attendance_date,
        status: input.status,
        notes: input.notes || null,
        lesson_id: input.lesson_id || null,
        marked_by: user.id,
      })

    if (error) {
      throw new Error(`Failed to mark attendance: ${error.message}`)
    }
  }

  revalidatePath('/admin/attendance')
  return { success: true }
}

/**
 * Bulk mark attendance for multiple students
 */
export async function bulkMarkAttendanceAction(records: CreateAttendanceInput[]) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Process each record
  for (const record of records) {
    try {
      await markAttendanceAction(record)
    } catch (error) {
      console.error(`Failed to mark attendance for user ${record.user_id}:`, error)
      // Continue with other records even if one fails
    }
  }

  revalidatePath('/admin/attendance')
  return { success: true }
}

/**
 * Get attendance records for a class on a specific date
 */
export async function getClassAttendanceAction(classId: string, date: string) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('attendance')
    .select(`
      *,
      user:users!attendance_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('class_id', classId)
    .eq('attendance_date', date)

  if (error) {
    throw new Error(`Failed to fetch attendance: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Get attendance history for a student
 */
export async function getStudentAttendanceHistoryAction(
  userId: string,
  classId?: string,
  startDate?: string,
  endDate?: string
) {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('attendance')
    .select(`
      *,
      class:classes!attendance_class_id_fkey (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('attendance_date', { ascending: false })

  if (classId) {
    query = query.eq('class_id', classId)
  }

  if (startDate) {
    query = query.gte('attendance_date', startDate)
  }

  if (endDate) {
    query = query.lte('attendance_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch student attendance: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Get attendance statistics for a class
 */
export async function getClassAttendanceStatsAction(
  classId: string,
  startDate?: string,
  endDate?: string
) {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('attendance')
    .select('status, user_id, attendance_date')
    .eq('class_id', classId)

  if (startDate) {
    query = query.gte('attendance_date', startDate)
  }

  if (endDate) {
    query = query.lte('attendance_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch attendance stats: ${error.message}`)
  }

  // Calculate statistics
  const stats = {
    total: data?.length || 0,
    present: data?.filter(a => a.status === 'present').length || 0,
    absent: data?.filter(a => a.status === 'absent').length || 0,
    excused: data?.filter(a => a.status === 'excused').length || 0,
    late: data?.filter(a => a.status === 'late').length || 0,
  }

  return { success: true, data: stats }
}

/**
 * Delete attendance record
 */
export async function deleteAttendanceAction(attendanceId: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('attendance')
    .delete()
    .eq('id', attendanceId)

  if (error) {
    throw new Error(`Failed to delete attendance: ${error.message}`)
  }

  revalidatePath('/admin/attendance')
  return { success: true }
}

/**
 * Get students for a class (bypasses RLS)
 */
export async function getClassStudentsAction(classId: string) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('class_assignments')
    .select(`
      user_id,
      users!class_assignments_user_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('class_id', classId)
    .eq('assignment_type', 'student')
    .eq('is_active', true)
    .order('users(full_name)', { ascending: true })

  if (error) {
    console.error('Error fetching class students:', error)
    throw new Error(`Failed to fetch students: ${error.message}`)
  }

  // Extract the user objects from the join
  const students = data
    ?.map((assignment: any) => assignment.users)
    .filter(Boolean) || []

  return { success: true, data: students }
}
