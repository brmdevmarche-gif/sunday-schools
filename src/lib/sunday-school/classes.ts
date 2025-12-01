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

// =====================================================
// PRIORITY 1: CORE FUNCTIONALITY
// =====================================================

/**
 * Toggle class active/inactive status
 */
export async function toggleClassStatus(
  classId: string,
  isActive: boolean
): Promise<Class> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('classes')
    .update({ is_active: isActive })
    .eq('id', classId)
    .select()
    .single()

  if (error) throw error
  return data as Class
}

/**
 * Get teachers count for a class
 */
export async function getClassTeachersCount(classId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('class_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('assignment_type', 'teacher')
    .eq('is_active', true)

  if (error) throw error
  return count || 0
}

/**
 * Get all classes a user is assigned to
 */
export async function getClassesByUser(
  userId: string,
  assignmentType?: AssignmentType
): Promise<Class[]> {
  const supabase = createClient()

  let query = supabase
    .from('class_assignments')
    .select(`
      class:classes(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)

  if (assignmentType) {
    query = query.eq('assignment_type', assignmentType)
  }

  const { data, error } = await query

  if (error) throw error
  return data.map((item: any) => item.class).filter(Boolean) as Class[]
}

/**
 * Get classes by academic year
 */
export async function getClassesByAcademicYear(
  academicYear: string,
  churchId?: string
): Promise<Class[]> {
  const supabase = createClient()

  let query = supabase
    .from('classes')
    .select('*')
    .eq('academic_year', academicYear)
    .order('name', { ascending: true })

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Class[]
}

/**
 * Check class capacity and availability
 */
export async function checkClassCapacity(classId: string): Promise<{
  current: number
  capacity: number
  available: number
  isFull: boolean
}> {
  const supabase = createClient()

  // Get class capacity
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('capacity')
    .eq('id', classId)
    .single()

  if (classError) throw classError

  // Get current enrollment
  const current = await getClassStudentsCount(classId)
  const capacity = classData.capacity || 0
  const available = Math.max(0, capacity - current)

  return {
    current,
    capacity,
    available,
    isFull: current >= capacity,
  }
}

// =====================================================
// PRIORITY 2: ENHANCED OPERATIONS
// =====================================================

/**
 * Bulk assign users to a class
 */
export async function bulkAssignUsersToClass(
  classId: string,
  userIds: string[],
  assignmentType: AssignmentType
): Promise<ClassAssignment[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const assignments = userIds.map(userId => ({
    class_id: classId,
    user_id: userId,
    assignment_type: assignmentType,
    assigned_by: user.id,
  }))

  const { data, error } = await supabase
    .from('class_assignments')
    .insert(assignments)
    .select()

  if (error) throw error
  return data as ClassAssignment[]
}

/**
 * Bulk remove users from a class
 */
export async function bulkRemoveUsersFromClass(
  assignmentIds: string[]
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('class_assignments')
    .delete()
    .in('id', assignmentIds)

  if (error) throw error
}

/**
 * Search classes with filters
 */
export interface ClassSearchFilters {
  churchId?: string
  dioceseId?: string
  gradeLevel?: string
  academicYear?: string
  isActive?: boolean
}

export async function searchClasses(
  searchTerm: string,
  filters?: ClassSearchFilters
): Promise<Class[]> {
  const supabase = createClient()

  let query = supabase
    .from('classes')
    .select(`
      *,
      church:churches(
        id,
        diocese_id
      )
    `)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

  if (filters?.churchId) {
    query = query.eq('church_id', filters.churchId)
  }
  if (filters?.dioceseId) {
    // Filter by diocese through church relationship
    query = query.eq('church.diocese_id', filters.dioceseId)
  }
  if (filters?.gradeLevel) {
    query = query.eq('grade_level', filters.gradeLevel)
  }
  if (filters?.academicYear) {
    query = query.eq('academic_year', filters.academicYear)
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  query = query.order('name', { ascending: true })

  const { data, error } = await query
  if (error) throw error
  return data as Class[]
}

/**
 * Get comprehensive class statistics
 */
export interface ClassStatistics {
  studentsCount: number
  teachersCount: number
  capacity: number
  enrollmentRate: number
  lessonsCount: number
  attendanceRate?: number
  upcomingLessons?: number
}

export async function getClassStatistics(classId: string): Promise<ClassStatistics> {
  const supabase = createClient()

  // Get class info
  const classData = await getClassById(classId)
  if (!classData) throw new Error('Class not found')

  // Get counts
  const [studentsCount, teachersCount] = await Promise.all([
    getClassStudentsCount(classId),
    getClassTeachersCount(classId),
  ])

  // Get lessons count
  const { count: lessonsCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)

  const capacity = classData.capacity || 0
  const enrollmentRate = capacity > 0 ? (studentsCount / capacity) * 100 : 0

  return {
    studentsCount,
    teachersCount,
    capacity,
    enrollmentRate: Math.round(enrollmentRate * 100) / 100,
    lessonsCount: lessonsCount || 0,
  }
}

/**
 * Duplicate/clone a class for new academic year
 */
export async function duplicateClass(
  classId: string,
  newName: string,
  academicYear?: string,
  copyAssignments: boolean = false
): Promise<Class> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get original class
  const originalClass = await getClassById(classId)
  if (!originalClass) throw new Error('Class not found')

  if (!originalClass.church_id) {
    throw new Error('Original class must have a church_id')
  }

  // Create new class
  const newClass = await createClass({
    church_id: originalClass.church_id,
    name: newName,
    description: originalClass.description || undefined,
    grade_level: originalClass.grade_level || undefined,
    academic_year: academicYear || originalClass.academic_year || undefined,
    schedule: originalClass.schedule || undefined,
    capacity: originalClass.capacity || undefined,
  })

  // Optionally copy assignments
  if (copyAssignments) {
    const assignments = await getClassAssignments(classId)
    const userIds = assignments.map(a => a.user_id).filter(Boolean) as string[]
    const assignmentTypes = assignments.map(a => a.assignment_type) as AssignmentType[]

    // Bulk assign (need to handle different types separately)
    const teacherIds: string[] = []
    const studentIds: string[] = []
    const assistantIds: string[] = []

    assignments.forEach((assignment, index) => {
      if (assignment.user_id) {
        if (assignment.assignment_type === 'teacher') {
          teacherIds.push(assignment.user_id)
        } else if (assignment.assignment_type === 'student') {
          studentIds.push(assignment.user_id)
        } else if (assignment.assignment_type === 'assistant') {
          assistantIds.push(assignment.user_id)
        }
      }
    })

    // Assign by type
    if (teacherIds.length > 0) {
      await bulkAssignUsersToClass(newClass.id, teacherIds, 'teacher')
    }
    if (studentIds.length > 0) {
      await bulkAssignUsersToClass(newClass.id, studentIds, 'student')
    }
    if (assistantIds.length > 0) {
      await bulkAssignUsersToClass(newClass.id, assistantIds, 'assistant')
    }
  }

  return newClass
}

// =====================================================
// PRIORITY 3: ADVANCED FEATURES
// =====================================================

/**
 * Export class roster to CSV or JSON
 */
export async function exportClassRoster(
  classId: string,
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  const assignments = await getClassAssignments(classId)
  const classData = await getClassById(classId)

  if (!classData) {
    throw new Error('Class not found')
  }

  if (format === 'json') {
    return JSON.stringify(
      {
        class: classData,
        roster: assignments,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    )
  }

  // CSV format
  const headers = ['Name', 'Email', 'Role', 'Assigned At']
  const rows = assignments.map(a => [
    a.user?.full_name || a.user?.email || 'N/A',
    a.user?.email || 'N/A',
    a.assignment_type,
    new Date(a.assigned_at).toLocaleDateString(),
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

/**
 * Get upcoming classes (based on academic year)
 */
export async function getUpcomingClasses(
  churchId?: string,
  limit?: number
): Promise<Class[]> {
  const supabase = createClient()

  // Get current year and next year
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const currentAcademicYear = `${currentYear}-${nextYear}`
  const nextAcademicYear = `${nextYear}-${nextYear + 1}`

  let query = supabase
    .from('classes')
    .select('*')
    .in('academic_year', [currentAcademicYear, nextAcademicYear])
    .eq('is_active', true)
    .order('academic_year', { ascending: true })
    .order('name', { ascending: true })

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Class[]
}

/**
 * Archive a class (soft delete by setting is_active to false)
 */
export async function archiveClass(classId: string): Promise<Class> {
  return toggleClassStatus(classId, false)
}

/**
 * Get classes by grade level
 */
export async function getClassesByGradeLevel(
  gradeLevel: string,
  churchId?: string
): Promise<Class[]> {
  const supabase = createClient()

  let query = supabase
    .from('classes')
    .select('*')
    .eq('grade_level', gradeLevel)
    .order('academic_year', { ascending: false })
    .order('name', { ascending: true })

  if (churchId) {
    query = query.eq('church_id', churchId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Class[]
}