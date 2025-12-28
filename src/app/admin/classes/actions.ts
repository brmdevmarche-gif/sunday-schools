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

/**
 * Get all trips for the trips tab
 */
export async function getAllTripsAction(classId?: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Get all trips without any filters - admin should see all trips
  const { data: trips, error } = await adminClient
    .from('trips')
    .select('*')
    .order('start_datetime', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching trips:', error)
    throw new Error(`Failed to fetch trips: ${error.message}`)
  }

  if (!trips || trips.length === 0) {
    return []
  }

  // Get destinations, churches, and dioceses for all trips
  if (trips.length > 0) {
    const tripIds = trips.map(t => t.id)
    
    const [destinationsResult, churchesResult, diocesesResult] = await Promise.all([
      adminClient.from('trip_destinations').select('*').in('trip_id', tripIds).order('visit_order', { ascending: true }),
      adminClient.from('trip_churches').select('*').in('trip_id', tripIds),
      adminClient.from('trip_dioceses').select('*').in('trip_id', tripIds),
    ])

    const destinations = destinationsResult.data || []
    const churches = churchesResult.data || []
    const dioceses = diocesesResult.data || []

    // Group by trip_id
    const destinationsByTrip = destinations.reduce((acc: Record<string, any[]>, dest) => {
      if (!acc[dest.trip_id]) acc[dest.trip_id] = []
      acc[dest.trip_id].push(dest)
      return acc
    }, {})

    const churchesByTrip = churches.reduce((acc: Record<string, any[]>, church) => {
      if (!acc[church.trip_id]) acc[church.trip_id] = []
      acc[church.trip_id].push(church)
      return acc
    }, {})

    const diocesesByTrip = dioceses.reduce((acc: Record<string, any[]>, diocese) => {
      if (!acc[diocese.trip_id]) acc[diocese.trip_id] = []
      acc[diocese.trip_id].push(diocese)
      return acc
    }, {})

    // Get subscribed counts for each trip
    const tripsWithDetails = await Promise.all(
      trips.map(async (trip) => {
        // Get total subscribed count for this trip (all classes)
        const { count: totalSubscribed } = await adminClient
          .from('trip_participants')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', trip.id)

        // Get payment status counts for all classes
        const { data: allParticipants } = await adminClient
          .from('trip_participants')
          .select('payment_status')
          .eq('trip_id', trip.id)

        const totalPaid = allParticipants?.filter(p => p.payment_status === 'paid').length ?? 0
        const totalPendingPayment = allParticipants?.filter(p => p.payment_status === 'pending' || p.payment_status === null).length ?? 0

        // Get class subscribed count and payment counts for this trip if classId is provided
        let classSubscribed: number | undefined = undefined
        let classPaid: number | undefined = undefined
        let classPendingPayment: number | undefined = undefined
        if (classId) {
          try {
            const classStudents = await getClassStudentsWithTripStatusAction(classId, trip.id)
            classSubscribed = classStudents.filter((s: any) => s.isSubscribed).length
            classPaid = classStudents.filter((s: any) => s.isSubscribed && s.payment_status === 'paid').length
            classPendingPayment = classStudents.filter((s: any) => s.isSubscribed && (s.payment_status === 'pending' || s.payment_status === null)).length
          } catch (error) {
            console.error(`Error getting class students for trip ${trip.id}:`, error)
            classSubscribed = 0
            classPaid = 0
            classPendingPayment = 0
          }
        }

        return {
          ...trip,
          destinations: destinationsByTrip[trip.id] || [],
          churches: churchesByTrip[trip.id] || [],
          dioceses: diocesesByTrip[trip.id] || [],
          totalSubscribedCount: totalSubscribed ?? 0,
          totalPaidCount: totalPaid,
          totalPendingPaymentCount: totalPendingPayment,
          classSubscribedCount: classSubscribed,
          classPaidCount: classPaid,
          classPendingPaymentCount: classPendingPayment,
        }
      })
    )

    return tripsWithDetails
  }

  return trips || []
}

/**
 * Get class students with their trip subscription status for a specific trip
 */
export async function getClassStudentsWithTripStatusAction(classId: string, tripId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Get all students in the class
  const { data: classAssignments, error: assignmentsError } = await adminClient
    .from('class_assignments')
    .select(`
      user_id,
      user:users!class_assignments_user_id_fkey(
        id,
        full_name,
        email,
        phone,
        address,
        avatar_url
      )
    `)
    .eq('class_id', classId)
    .eq('assignment_type', 'student')
    .eq('is_active', true)

  if (assignmentsError) {
    console.error('Error fetching class students:', assignmentsError)
    return []
  }

  // Get trip participants for this trip
  const { data: participants, error: participantsError } = await adminClient
    .from('trip_participants')
    .select('id, user_id, approval_status, payment_status, registered_at')
    .eq('trip_id', tripId)

  if (participantsError) {
    console.error('Error fetching trip participants:', participantsError)
  }

  // Create a map of user_id to participation status
  const participantsMap = new Map()
  if (participants) {
    participants.forEach(p => {
      participantsMap.set(p.user_id, {
        participant_id: p.id,
        isSubscribed: true,
        approval_status: p.approval_status,
        payment_status: p.payment_status,
        registered_at: p.registered_at,
      })
    })
  }

  // Combine class students with subscription status
  const studentsWithStatus = (classAssignments || [])
    .filter((assignment: any) => assignment.user) // Filter out assignments without users
    .map((assignment: any) => {
      const user = assignment.user
      const participation = participantsMap.get(user?.id)

      return {
        id: user.id,
        full_name: user.full_name || null,
        email: user.email || null,
        phone: user.phone || null,
        address: user.address || null,
        avatar_url: user.avatar_url || null,
        participant_id: participation?.participant_id || null,
        isSubscribed: participation ? true : false,
        approval_status: participation?.approval_status || null,
        payment_status: participation?.payment_status || null,
        registered_at: participation?.registered_at || null,
      }
    })

  return studentsWithStatus
}

/**
 * Get trip details with all class students and their subscription status
 */
export async function getTripDetailsForClassAction(tripId: string, classId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Get trip details
  const { data: trip, error: tripError } = await adminClient
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (tripError) {
    console.error('Error fetching trip:', tripError)
    return null
  }

  // Get destinations, churches, and dioceses
  const [destinationsResult, churchesResult, diocesesResult] = await Promise.all([
    adminClient.from('trip_destinations').select('*').eq('trip_id', tripId).order('visit_order', { ascending: true }),
    adminClient.from('trip_churches').select('*').eq('trip_id', tripId),
    adminClient.from('trip_dioceses').select('*').eq('trip_id', tripId),
  ])

  // Get class students with subscription status
  const students = await getClassStudentsWithTripStatusAction(classId, tripId)

  // Get total subscribed students count (all classes)
  const { count: totalSubscribedCount } = await adminClient
    .from('trip_participants')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)

  // Count subscribed students from this class
  const classSubscribedCount = students.filter((s: any) => s.isSubscribed).length

  return {
    trip: {
      ...trip,
      destinations: destinationsResult.data || [],
      churches: churchesResult.data || [],
      dioceses: diocesesResult.data || [],
    },
    students,
    totalSubscribedCount: totalSubscribedCount || 0,
    classSubscribedCount,
  }
}

/**
 * Get trip details with all students from all classes and their subscription status
 */
export async function getTripDetailsForAllClassesAction(tripId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Get trip details
  const { data: trip, error: tripError } = await adminClient
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (tripError) {
    console.error('Error fetching trip:', tripError)
    return null
  }

  // Get destinations, churches, and dioceses
  const [destinationsResult, churchesResult, diocesesResult] = await Promise.all([
    adminClient.from('trip_destinations').select('*').eq('trip_id', tripId).order('visit_order', { ascending: true }),
    adminClient.from('trip_churches').select('*').eq('trip_id', tripId),
    adminClient.from('trip_dioceses').select('*').eq('trip_id', tripId),
  ])

  // Get all students from all classes
  const { data: classAssignments, error: assignmentsError } = await adminClient
    .from('class_assignments')
    .select(`
      class_id,
      user_id,
      user:users!class_assignments_user_id_fkey(
        id,
        full_name,
        email,
        phone,
        avatar_url
      ),
      classes:classes!class_assignments_class_id_fkey(
        id,
        name
      )
    `)
    .eq('assignment_type', 'student')
    .eq('is_active', true)

  if (assignmentsError) {
    console.error('Error fetching class students:', assignmentsError)
  }

  // Get trip participants for this trip
  const { data: participants, error: participantsError } = await adminClient
    .from('trip_participants')
    .select('user_id, approval_status, payment_status, registered_at')
    .eq('trip_id', tripId)

  if (participantsError) {
    console.error('Error fetching trip participants:', participantsError)
  }

  // Create a map of user_id to participation status
  const participantsMap = new Map()
  if (participants) {
    participants.forEach(p => {
      participantsMap.set(p.user_id, {
        isSubscribed: true,
        approval_status: p.approval_status,
        payment_status: p.payment_status,
        registered_at: p.registered_at,
      })
    })
  }

  // Group students by class and add subscription status
  const studentsByClass = new Map<string, any[]>()
  const classMap = new Map<string, any>()

  if (classAssignments) {
    classAssignments.forEach((assignment: any) => {
      const user = assignment.user
      const classData = assignment.classes
      if (!user || !classData) return

      const classId = classData.id
      const className = classData.name

      if (!classMap.has(classId)) {
        classMap.set(classId, { id: classId, name: className })
      }

      if (!studentsByClass.has(classId)) {
        studentsByClass.set(classId, [])
      }

      const participation = participantsMap.get(user.id)
      studentsByClass.get(classId)!.push({
        ...user,
        isSubscribed: participation ? true : false,
        approval_status: participation?.approval_status || null,
        payment_status: participation?.payment_status || null,
        registered_at: participation?.registered_at || null,
      })
    })
  }

  // Convert map to array
  const classesWithStudents = Array.from(classMap.values()).map(classData => ({
    ...classData,
    students: studentsByClass.get(classData.id) || [],
  }))

  return {
    trip: {
      ...trip,
      destinations: destinationsResult.data || [],
      churches: churchesResult.data || [],
      dioceses: diocesesResult.data || [],
    },
    classes: classesWithStudents,
    totalStudents: classAssignments?.length || 0,
    subscribedStudents: participants?.length || 0,
  }
}

/**
 * Subscribe a student to a trip (admin action)
 */
export async function subscribeStudentToTripAction(tripId: string, userId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Check if already subscribed
  const { data: existing } = await adminClient
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    throw new Error('Student is already subscribed to this trip')
  }

  // Create participation
  const { data, error } = await adminClient
    .from('trip_participants')
    .insert({
      trip_id: tripId,
      user_id: userId,
      approval_status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to subscribe student: ${error.message}`)
  }

  revalidatePath('/admin/classes')
  revalidatePath('/admin/classes/*')
  
  return { success: true, data }
}

/**
 * Approve trip participant (admin action)
 */
export async function approveTripParticipantAction(participantId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Get current user for approved_by
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const updateData: any = {
    approval_status: 'approved',
    approved_at: new Date().toISOString(),
  }

  if (user) {
    updateData.approved_by = user.id
  }

  const { data, error } = await adminClient
    .from('trip_participants')
    .update(updateData)
    .eq('id', participantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to approve participant: ${error.message}`)
  }

  revalidatePath('/admin/classes')
  revalidatePath('/admin/classes/*')
  
  return { success: true, data }
}

/**
 * Mark trip participant as paid (admin action)
 */
export async function markTripParticipantAsPaidAction(participantId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('trip_participants')
    .update({ payment_status: 'paid' })
    .eq('id', participantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to mark as paid: ${error.message}`)
  }

  revalidatePath('/admin/classes')
  revalidatePath('/admin/classes/*')
  
  return { success: true, data }
}

/**
 * Get student price tier (for now defaults to normal, but can be extended to check user profile)
 */
export async function getStudentPriceTier(userId: string): Promise<'normal' | 'mastor' | 'botl'> {
  // TODO: Check user profile for price tier field
  // For now, defaulting to normal
  // In the future, this could check a user.price_tier field or relationship
  return 'normal'
}