'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateClassInput } from '@/lib/types/sunday-school'

export async function getClassesData(churchId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true })

  if (churchId && churchId !== 'all') {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching classes:', error)
    return []
  }

  return data || []
}

export async function getClassStudentsCountData(classId: string) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('class_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('assignment_type', 'student')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching student count:', error)
    return 0
  }

  return count || 0
}

export async function getAllClassesWithCounts(churchId?: string) {
  const classes = await getClassesData(churchId)

  const classesWithCounts = await Promise.all(
    classes.map(async (cls) => ({
      ...cls,
      studentCount: await getClassStudentsCountData(cls.id),
    }))
  )

  return classesWithCounts
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

  return data || []
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

  return data || []
}

export async function createClassAction(input: CreateClassInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('classes').insert({
    ...input,
    created_by: user.id,
  })

  if (error) {
    console.error('Error creating class:', error)
    throw new Error('Failed to create class')
  }

  revalidatePath('/admin/classes')
  return { success: true }
}

export async function updateClassAction(id: string, updates: Partial<CreateClassInput>) {
  const supabase = await createClient()

  const { error } = await supabase.from('classes').update(updates).eq('id', id)

  if (error) {
    console.error('Error updating class:', error)
    throw new Error('Failed to update class')
  }

  revalidatePath('/admin/classes')
  return { success: true }
}

export async function deleteClassAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('classes').delete().eq('id', id)

  if (error) {
    console.error('Error deleting class:', error)
    throw new Error('Failed to delete class')
  }

  revalidatePath('/admin/classes')
  return { success: true }
}

export async function getClassAssignmentsData(classId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('class_assignments')
    .select(
      `
      *,
      user:users!class_assignments_user_id_fkey(
        id,
        email,
        full_name,
        username
      )
    `
    )
    .eq('class_id', classId)
    .eq('is_active', true)
    .order('assignment_type', { ascending: false })

  if (error) {
    console.error('Error fetching class assignments:', error)
    return []
  }

  return data || []
}

export async function getAvailableTeachersData(churchId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, username, avatar_url, phone')
    .eq('role', 'teacher')
    .eq('church_id', churchId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching teachers:', error)
    return []
  }

  return data || []
}

export async function getAvailableStudentsData(churchId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, username, avatar_url, phone')
    .eq('role', 'student')
    .eq('church_id', churchId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching students:', error)
    return []
  }

  return data || []
}

export async function assignUserToClassAction(
  classId: string,
  userId: string,
  assignmentType: 'teacher' | 'student'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use admin client to bypass RLS for assignment operations
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Check if an assignment already exists (active or inactive)
  const { data: existing } = await adminClient
    .from('class_assignments')
    .select('id, is_active')
    .eq('class_id', classId)
    .eq('user_id', userId)
    .eq('assignment_type', assignmentType)
    .single()

  if (existing) {
    // If assignment exists but is inactive, reactivate it
    if (!existing.is_active) {
      const { error } = await adminClient
        .from('class_assignments')
        .update({ is_active: true, assigned_by: user.id })
        .eq('id', existing.id)

      if (error) {
        console.error('Error reactivating user assignment:', error)
        throw new Error('Failed to assign user to class')
      }
    }
    // If already active, it's already assigned - silently succeed
  } else {
    // No existing assignment, create a new one
    const { error } = await adminClient.from('class_assignments').insert({
      class_id: classId,
      user_id: userId,
      assignment_type: assignmentType,
      assigned_by: user.id,
      is_active: true,
    })

    if (error) {
      console.error('Error assigning user to class:', error)
      throw new Error('Failed to assign user to class')
    }
  }

  revalidatePath('/admin/classes')
  revalidatePath(`/admin/classes/${classId}`)
  return { success: true }
}

export async function removeUserFromClassAction(assignmentId: string, classId?: string) {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use admin client to bypass RLS
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('class_assignments')
    .update({ is_active: false })
    .eq('id', assignmentId)

  if (error) {
    console.error('Error removing user from class:', error)
    throw new Error('Failed to remove user from class')
  }

  revalidatePath('/admin/classes')
  if (classId) {
    revalidatePath(`/admin/classes/${classId}`)
  }
  return { success: true }
}

export async function getCurrentUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}
