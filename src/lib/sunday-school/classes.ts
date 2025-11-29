import { createClient } from '../supabase/client'
import type { Class, CreateClassInput, ClassAssignment, AssignmentType } from '../types/sunday-school'

/**
 * Get all classes
 */
export async function getClasses(churchId?: string): Promise<Class[]> {
  const supabase = createClient()

  let query = supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true })

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Class[]
}

/**
 * Get a single class by ID
 */
export async function getClassById(id: string): Promise<Class | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as Class
}

/**
 * Create a new class
 */
export async function createClass(input: CreateClassInput): Promise<Class> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('classes')
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as Class
}

/**
 * Update a class
 */
export async function updateClass(
  id: string,
  updates: Partial<CreateClassInput>
): Promise<Class> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Class
}

/**
 * Delete a class
 */
export async function deleteClass(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get class with church and diocese information
 */
export async function getClassWithDetails(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      church:churches(
        *,
        diocese:dioceses(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Get students count for a class
 */
export async function getClassStudentsCount(classId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('class_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('assignment_type', 'student')
    .eq('is_active', true)

  if (error) throw error
  return count || 0
}

/**
 * Assign user to class (teacher or student)
 */
export async function assignUserToClass(
  classId: string,
  userId: string,
  assignmentType: AssignmentType
): Promise<ClassAssignment> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('class_assignments')
    .insert({
      class_id: classId,
      user_id: userId,
      assignment_type: assignmentType,
      assigned_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as ClassAssignment
}

/**
 * Remove user from class
 */
export async function removeUserFromClass(assignmentId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('class_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) throw error
}

/**
 * Get class assignments (teachers and students)
 */
export async function getClassAssignments(classId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('class_assignments')
    .select(`
      *,
      user:users(*)
    `)
    .eq('class_id', classId)
    .eq('is_active', true)
    .order('assignment_type', { ascending: true })

  if (error) throw error
  return data
}
