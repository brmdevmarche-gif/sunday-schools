'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type {
  CreateTripInput,
  UpdateTripInput,
  Trip,
  TripWithDetails,
  TripParticipantWithUser,
  TripStatus,
  TripApprovalStatus,
  TripPaymentStatus,
  UpdateTripParticipantInput,
  TripOrganizer,
  TripOrganizerWithUser,
  AddTripOrganizerInput,
  UpdateTripOrganizerInput,
} from '@/lib/types/sunday-school'
import { awardTripPointsAction } from '@/app/admin/points/actions'

/**
 * Create a new trip
 */
export async function createTripAction(input: CreateTripInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  const adminClient = createAdminClient()

  // Extract associations from input
  const { destinations, church_ids, diocese_ids, class_ids, ...tripData } = input

  // Create the trip
  const { data: trip, error: tripError } = await adminClient
    .from('trips')
    .insert({
      ...tripData,
      created_by: user.id,
    })
    .select()
    .single()

  if (tripError) {
    throw new Error(`Failed to create trip: ${tripError.message}`)
  }

  // Create destinations if provided
  if (destinations && destinations.length > 0) {
    const destinationsToInsert = destinations.map((dest, index) => ({
      trip_id: trip.id,
      destination_name: dest.destination_name,
      description: dest.description || null,
      visit_order: dest.visit_order || index + 1,
    }))

    const { error: destError } = await adminClient
      .from('trip_destinations')
      .insert(destinationsToInsert)

    if (destError) {
      console.error('Failed to create destinations:', destError)
    }
  }

  // Create church associations if provided
  if (church_ids && church_ids.length > 0) {
    const churchAssociations = church_ids.map(churchId => ({
      trip_id: trip.id,
      church_id: churchId,
    }))

    const { error: churchError } = await adminClient
      .from('trip_churches')
      .insert(churchAssociations)

    if (churchError) {
      console.error('Failed to create church associations:', churchError)
    }
  }

  // Create diocese associations if provided
  if (diocese_ids && diocese_ids.length > 0) {
    const dioceseAssociations = diocese_ids.map(dioceseId => ({
      trip_id: trip.id,
      diocese_id: dioceseId,
    }))

    const { error: dioceseError } = await adminClient
      .from('trip_dioceses')
      .insert(dioceseAssociations)

    if (dioceseError) {
      console.error('Failed to create diocese associations:', dioceseError)
    }
  }

  // Create class associations if provided
  if (class_ids && class_ids.length > 0) {
    const classAssociations = class_ids.map(classId => ({
      trip_id: trip.id,
      class_id: classId,
    }))

    const { error: classError } = await adminClient
      .from('trip_classes')
      .insert(classAssociations)

    if (classError) {
      console.error('Failed to create class associations:', classError)
    }
  }

  revalidatePath('/admin/trips')
  return { success: true, data: trip }
}

/**
 * Update a trip
 */
export async function updateTripAction(input: UpdateTripInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { id, destinations, church_ids, diocese_ids, class_ids, ...updateData } = input

  // Update the trip
  const { data: trip, error: tripError } = await adminClient
    .from('trips')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (tripError) {
    throw new Error(`Failed to update trip: ${tripError.message}`)
  }

  // Update destinations if provided
  if (destinations !== undefined) {
    // Delete existing destinations
    await adminClient
      .from('trip_destinations')
      .delete()
      .eq('trip_id', id)

    // Insert new destinations
    if (destinations.length > 0) {
      const destinationsToInsert = destinations.map((dest, index) => ({
        trip_id: id,
        destination_name: dest.destination_name,
        description: dest.description || null,
        visit_order: dest.visit_order || index + 1,
      }))

      const { error: destError } = await adminClient
        .from('trip_destinations')
        .insert(destinationsToInsert)

      if (destError) {
        console.error('Failed to update destinations:', destError)
      }
    }
  }

  // Update church associations if provided
  if (church_ids !== undefined) {
    // Delete existing associations
    await adminClient
      .from('trip_churches')
      .delete()
      .eq('trip_id', id)

    // Insert new associations
    if (church_ids.length > 0) {
      const churchAssociations = church_ids.map(churchId => ({
        trip_id: id,
        church_id: churchId,
      }))

      const { error: churchError } = await adminClient
        .from('trip_churches')
        .insert(churchAssociations)

      if (churchError) {
        console.error('Failed to update church associations:', churchError)
      }
    }
  }

  // Update diocese associations if provided
  if (diocese_ids !== undefined) {
    // Delete existing associations
    await adminClient
      .from('trip_dioceses')
      .delete()
      .eq('trip_id', id)

    // Insert new associations
    if (diocese_ids.length > 0) {
      const dioceseAssociations = diocese_ids.map(dioceseId => ({
        trip_id: id,
        diocese_id: dioceseId,
      }))

      const { error: dioceseError } = await adminClient
        .from('trip_dioceses')
        .insert(dioceseAssociations)

      if (dioceseError) {
        console.error('Failed to update diocese associations:', dioceseError)
      }
    }
  }

  // Update class associations if provided
  if (class_ids !== undefined) {
    // Delete existing associations
    await adminClient
      .from('trip_classes')
      .delete()
      .eq('trip_id', id)

    // Insert new associations
    if (class_ids.length > 0) {
      const classAssociations = class_ids.map(classId => ({
        trip_id: id,
        class_id: classId,
      }))

      const { error: classError } = await adminClient
        .from('trip_classes')
        .insert(classAssociations)

      if (classError) {
        console.error('Failed to update class associations:', classError)
      }
    }
  }

  revalidatePath('/admin/trips')
  revalidatePath(`/admin/trips/${id}`)
  return { success: true, data: trip }
}

/**
 * Get trip by ID
 */
export async function getTripByIdAction(tripId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get trip
  const { data: trip, error: tripError } = await adminClient
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (tripError) {
    throw new Error(`Failed to fetch trip: ${tripError.message}`)
  }

  // Get destinations
  const { data: destinations } = await adminClient
    .from('trip_destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('visit_order', { ascending: true })

  // Get church associations
  const { data: churches } = await adminClient
    .from('trip_churches')
    .select('*')
    .eq('trip_id', tripId)

  // Get diocese associations
  const { data: dioceses } = await adminClient
    .from('trip_dioceses')
    .select('*')
    .eq('trip_id', tripId)

  // Get class associations (handle case where table doesn't exist yet)
  let classes: any[] = []
  const classesQuery = adminClient
    .from('trip_classes')
    .select('*')
    .eq('trip_id', tripId)

  const { data: classesData, error: classesError } = await classesQuery

  // If table doesn't exist, silently return empty array
  if (!classesError) {
    classes = classesData || []
  } else {
    const errorMsg = classesError.message || ''
    const errorCode = classesError.code || ''
    if (errorMsg.includes('Could not find the table') || 
        errorMsg.includes('does not exist') ||
        errorCode === '42P01') {
      // Table doesn't exist yet - migration not run, return empty array
      classes = []
    } else {
      // Other error - log it but don't fail
      console.warn('Error fetching classes:', classesError.message)
      classes = []
    }
  }

  // Get organizers (handle case where table doesn't exist yet)
  let organizers: any[] = []
  const organizersQuery = adminClient
    .from('trip_organizers')
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  const { data: organizersData, error: organizersError } = await organizersQuery

  // If table doesn't exist, silently return empty array
  if (!organizersError) {
    organizers = organizersData || []
  } else {
    const errorMsg = organizersError.message || ''
    const errorCode = organizersError.code || ''
    if (errorMsg.includes('Could not find the table') || 
        errorMsg.includes('does not exist') ||
        errorCode === '42P01') {
      // Table doesn't exist yet - migration not run, return empty array
      organizers = []
    } else {
      // Other error - log it but don't fail
      console.warn('Error fetching organizers:', organizersError.message)
      organizers = []
    }
  }

  return { 
    success: true, 
    data: { 
      ...trip, 
      destinations: destinations || [],
      churches: churches || [],
      dioceses: dioceses || [],
      classes: classes || [],
      organizers: organizers || [],
    } 
  }
}

/**
 * Delete a trip
 */
export async function deleteTripAction(tripId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('trips')
    .delete()
    .eq('id', tripId)

  if (error) {
    throw new Error(`Failed to delete trip: ${error.message}`)
  }

  revalidatePath('/admin/trips')
  return { success: true }
}

/**
 * Get all trips (admin view with filtering)
 */
export async function getTripsAction(filters?: {
  status?: TripStatus
  trip_type?: string
  church_id?: string
  diocese_id?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  let query = adminClient
    .from('trips')
    .select('*')
    .order('start_datetime', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.trip_type) {
    query = query.eq('trip_type', filters.trip_type)
  }
  if (filters?.church_id) {
    query = query.eq('church_id', filters.church_id)
  }
  if (filters?.diocese_id) {
    // Need to join with churches table
    query = query.eq('church_id', filters.diocese_id) // This will be fixed when we get church's diocese_id
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch trips: ${error.message}`)
  }

  // Get destinations, churches, dioceses, and classes for all trips
  if (data && data.length > 0) {
    const tripIds = data.map(t => t.id)
    
    const [destinationsResult, churchesResult, diocesesResult, classesResult] = await Promise.all([
      adminClient.from('trip_destinations').select('*').in('trip_id', tripIds).order('visit_order', { ascending: true }),
      adminClient.from('trip_churches').select('*').in('trip_id', tripIds),
      adminClient.from('trip_dioceses').select('*').in('trip_id', tripIds),
      (async () => {
        // Handle case where trip_classes table doesn't exist yet
        try {
          return await adminClient.from('trip_classes').select('*').in('trip_id', tripIds)
        } catch (error) {
          const errorObj = error as { message?: string; code?: string }
          const errorMsg = errorObj?.message || ''
          const errorCode = errorObj?.code || ''
          if (errorMsg.includes('Could not find the table') ||
              errorMsg.includes('does not exist') ||
              errorCode === '42P01') {
            return { data: [], error: null }
          }
          throw error
        }
      })(),
    ])

    const destinations = destinationsResult.data || []
    const churches = churchesResult.data || []
    const dioceses = diocesesResult.data || []
    const classes = classesResult.data || []

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

    const classesByTrip = classes.reduce((acc: Record<string, any[]>, classItem) => {
      if (!acc[classItem.trip_id]) acc[classItem.trip_id] = []
      acc[classItem.trip_id].push(classItem)
      return acc
    }, {})

    // Attach to trips
    const tripsWithDetails = data.map(trip => ({
      ...trip,
      destinations: destinationsByTrip[trip.id] || [],
      churches: churchesByTrip[trip.id] || [],
      dioceses: diocesesByTrip[trip.id] || [],
      classes: classesByTrip[trip.id] || [],
    }))

    return { success: true, data: tripsWithDetails }
  }

  return { success: true, data: data || [] }
}

/**
 * Get trip participants with user details
 */
export async function getTripParticipantsAction(tripId: string) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('trip_participants')
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone,
        user_code
      )
    `)
    .eq('trip_id', tripId)
    .order('registered_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch participants: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Update trip participant (approve/reject, mark paid)
 */
export async function updateTripParticipantAction(input: UpdateTripParticipantInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get the current participant data before updating (for points awarding)
  const { data: currentParticipant } = await adminClient
    .from('trip_participants')
    .select('user_id, trip_id, approval_status')
    .eq('id', input.participant_id)
    .single()

  const updateData: any = {}

  if (input.approval_status !== undefined) {
    updateData.approval_status = input.approval_status
    if (input.approval_status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = user.id
    }
  }

  if (input.payment_status !== undefined) {
    updateData.payment_status = input.payment_status
  }

  const { data, error } = await adminClient
    .from('trip_participants')
    .update(updateData)
    .eq('id', input.participant_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update participant: ${error.message}`)
  }

  // Award trip points when participant is approved (and wasn't already approved)
  if (
    input.approval_status === 'approved' &&
    currentParticipant &&
    currentParticipant.approval_status !== 'approved'
  ) {
    try {
      await awardTripPointsAction(
        currentParticipant.user_id,
        currentParticipant.trip_id,
        `Trip participation - approved`
      )
    } catch (pointsError) {
      // Log error but don't fail the participant update
      console.error('Failed to award trip points:', pointsError)
    }
  }

  revalidatePath('/admin/trips')
  return { success: true, data }
}

/**
 * Get trip details with stats
 */
export async function getTripDetailsAction(tripId: string) {
  const adminClient = createAdminClient()

  // Get trip
  const { data: trip, error: tripError } = await adminClient
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (tripError) {
    throw new Error(`Failed to fetch trip: ${tripError.message}`)
  }

  // Get destinations, churches, dioceses, classes
  const [destinationsResult, churchesResult, diocesesResult, classesResult] = await Promise.all([
    adminClient.from('trip_destinations').select('*').eq('trip_id', tripId).order('visit_order', { ascending: true }),
    adminClient.from('trip_churches').select('*').eq('trip_id', tripId),
    adminClient.from('trip_dioceses').select('*').eq('trip_id', tripId),
    (async () => {
      // Handle case where trip_classes table doesn't exist yet
      try {
        const result = await adminClient.from('trip_classes').select('*').eq('trip_id', tripId)
        return result
      } catch (error) {
        const errorObj = error as { message?: string; code?: string }
        const errorMsg = errorObj?.message || ''
        const errorCode = errorObj?.code || ''
        if (errorMsg.includes('Could not find the table') ||
            errorMsg.includes('does not exist') ||
            errorCode === '42P01') {
          return { data: [], error: null }
        }
        throw error
      }
    })(),
  ])

  const destinations = destinationsResult.data || []
  const churches = churchesResult.data || []
  const dioceses = diocesesResult.data || []
  const classes = classesResult.data || []

  // Get organizers (handle case where table doesn't exist yet)
  let organizers: any[] = []
  const organizersQuery = adminClient
    .from('trip_organizers')
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  const organizersResult = await organizersQuery

  // If table doesn't exist, silently return empty array
  if (!organizersResult.error) {
    organizers = organizersResult.data || []
  } else {
    const errorMsg = organizersResult.error.message || ''
    const errorCode = organizersResult.error.code || ''
    if (errorMsg.includes('Could not find the table') || 
        errorMsg.includes('does not exist') ||
        errorCode === '42P01') {
      // Table doesn't exist yet - migration not run, return empty array
      organizers = []
    } else {
      // Other error - log it but don't fail
      console.warn('Error fetching organizers:', organizersResult.error.message)
      organizers = []
    }
  }

  // Get participants count by status
  const { data: participants } = await adminClient
    .from('trip_participants')
    .select('approval_status, payment_status')
    .eq('trip_id', tripId)

  const participantsStats = {
    total: participants?.length || 0,
    pending: participants?.filter(p => p.approval_status === 'pending').length || 0,
    approved: participants?.filter(p => p.approval_status === 'approved').length || 0,
    rejected: participants?.filter(p => p.approval_status === 'rejected').length || 0,
    paid: participants?.filter(p => p.payment_status === 'paid').length || 0,
    unpaid: participants?.filter(p => p.payment_status === 'pending' || p.payment_status === null).length || 0,
  }

  return {
    success: true,
    data: {
      trip,
      destinations,
      churches,
      dioceses,
      classes,
      organizers,
      participantsStats,
    }
  }
}

/**
 * Get churches for dropdown (used in create/edit forms)
 */
export async function getChurchesForTrips() {
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

/**
 * Get dioceses for dropdown (used in create/edit forms)
 */
export async function getDiocesesForTrips() {
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

/**
 * Get classes for selected churches (used in create/edit forms)
 */
export async function getClassesForChurches(churchIds: string[]) {
  const supabase = await createClient()

  if (!churchIds || churchIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('classes')
    .select('id, name, church_id')
    .in('church_id', churchIds)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching classes:', error)
    return []
  }

  return data || []
}

/**
 * Get teachers/staff from selected churches for trip organizers
 */
export async function getTeachersForTripsAction(churchIds: string[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  if (!churchIds || churchIds.length === 0) {
    return { success: true, data: [] }
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('users')
    .select('id, email, full_name, phone, avatar_url, church_id')
    .in('church_id', churchIds)
    .in('role', ['teacher', 'church_admin'])
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch teachers: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Get organizers for a trip
 */
export async function getTripOrganizersAction(tripId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('trip_organizers')
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  // If table doesn't exist yet (migration not run), return empty array
  if (error) {
    if (error.message?.includes('Could not find the table') || 
        error.message?.includes('does not exist') ||
        error.code === '42P01') {
      console.warn('trip_organizers table does not exist. Please run migration 24_add_trip_organizers.sql')
      return { success: true, data: [] }
    }
    throw new Error(`Failed to fetch organizers: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Add organizer to trip
 */
export async function addTripOrganizerAction(input: AddTripOrganizerInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('trip_organizers')
    .insert({
      trip_id: input.trip_id,
      user_id: input.user_id,
      can_approve: input.can_approve || false,
      can_go: input.can_go || false,
      can_take_attendance: input.can_take_attendance || false,
      can_collect_payment: input.can_collect_payment || false,
    })
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .single()

  if (error) {
    if (error.message?.includes('Could not find the table') || 
        error.message?.includes('does not exist') ||
        error.code === '42P01') {
      throw new Error('Trip organizers table does not exist. Please run migration 24_add_trip_organizers.sql')
    }
    throw new Error(`Failed to add organizer: ${error.message}`)
  }

  revalidatePath(`/admin/trips/${input.trip_id}`)
  return { success: true, data }
}

/**
 * Update organizer roles
 */
export async function updateTripOrganizerAction(input: UpdateTripOrganizerInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  const adminClient = createAdminClient()

  const updateData: any = {}
  if (input.can_approve !== undefined) updateData.can_approve = input.can_approve
  if (input.can_go !== undefined) updateData.can_go = input.can_go
  if (input.can_take_attendance !== undefined) updateData.can_take_attendance = input.can_take_attendance
  if (input.can_collect_payment !== undefined) updateData.can_collect_payment = input.can_collect_payment

  // Get trip_id for revalidation
  const { data: organizer } = await adminClient
    .from('trip_organizers')
    .select('trip_id')
    .eq('id', input.organizer_id)
    .single()

  const { data, error } = await adminClient
    .from('trip_organizers')
    .update(updateData)
    .eq('id', input.organizer_id)
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .single()

  if (error) {
    if (error.message?.includes('Could not find the table') || 
        error.message?.includes('does not exist') ||
        error.code === '42P01') {
      throw new Error('Trip organizers table does not exist. Please run migration 24_add_trip_organizers.sql')
    }
    throw new Error(`Failed to update organizer: ${error.message}`)
  }

  if (organizer) {
    revalidatePath(`/admin/trips/${organizer.trip_id}`)
  }

  return { success: true, data }
}

/**
 * Get students from trip classes (for adding participants)
 */
export async function getStudentsFromTripClassesAction(tripId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile && ['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)

  // If not admin, check if user is an organizer with can_approve permission
  if (!isAdmin) {
    const { data: organizer } = await adminClient
      .from('trip_organizers')
      .select('can_approve')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!organizer || !organizer.can_approve) {
      throw new Error('Unauthorized: Only admins or organizers with approval permission can view students')
    }
  }

  // Get trip classes
  const { data: tripClasses, error: classesError } = await adminClient
    .from('trip_classes')
    .select('class_id')
    .eq('trip_id', tripId)

  if (classesError) {
    // If table doesn't exist yet, return empty array
    const errorMsg = classesError.message || ''
    const errorCode = classesError.code || ''
    if (errorMsg.includes('Could not find the table') || 
        errorMsg.includes('does not exist') ||
        errorCode === '42P01') {
      return { success: true, data: [] }
    }
    throw new Error(`Failed to fetch trip classes: ${classesError.message}`)
  }

  if (!tripClasses || tripClasses.length === 0) {
    return { success: true, data: [] }
  }

  const classIds = tripClasses.map(tc => tc.class_id)

  // Get all students from these classes
  const { data: classAssignments, error: assignmentsError } = await adminClient
    .from('class_assignments')
    .select(`
      user_id,
      class_id,
      user:users!class_assignments_user_id_fkey(
        id,
        full_name,
        email,
        phone,
        avatar_url,
        user_code
      ),
      classes:classes!class_assignments_class_id_fkey(
        id,
        name
      )
    `)
    .in('class_id', classIds)
    .eq('assignment_type', 'student')
    .eq('is_active', true)

  if (assignmentsError) {
    throw new Error(`Failed to fetch students: ${assignmentsError.message}`)
  }

  // Get existing participants to filter them out
  const { data: participants } = await adminClient
    .from('trip_participants')
    .select('user_id')
    .eq('trip_id', tripId)

  const participantIds = new Set(participants?.map(p => p.user_id) || [])

  // Format and filter students
  const students = (classAssignments || [])
    .map((assignment: any) => ({
      id: assignment.user?.id,
      full_name: assignment.user?.full_name,
      email: assignment.user?.email,
      phone: assignment.user?.phone,
      avatar_url: assignment.user?.avatar_url,
      user_code: assignment.user?.user_code,
      class_id: assignment.class_id,
      class_name: assignment.classes?.name || 'Unknown',
    }))
    .filter((student: any) => student.id && !participantIds.has(student.id))
    // Remove duplicates (students might be in multiple classes)
    .filter((student: any, index: number, self: any[]) => 
      index === self.findIndex((s: any) => s.id === student.id)
    )
    .sort((a: any, b: any) => {
      const nameA = a.full_name || a.email || ''
      const nameB = b.full_name || b.email || ''
      return nameA.localeCompare(nameB)
    })

  return { success: true, data: students }
}

/**
 * Subscribe a student to a trip (admin or organizer with can_approve action)
 */
export async function subscribeStudentToTripAction(tripId: string, userId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile && ['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)

  // If not admin, check if user is an organizer with can_approve permission
  if (!isAdmin) {
    const { data: organizer } = await adminClient
      .from('trip_organizers')
      .select('can_approve')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!organizer || !organizer.can_approve) {
      throw new Error('Unauthorized: Only admins or organizers with approval permission can add participants')
    }
  }

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
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to subscribe student: ${error.message}`)
  }

  revalidatePath('/admin/trips')
  revalidatePath(`/admin/trips/${tripId}`)
  return { success: true, data }
}

/**
 * Remove organizer from trip
 */
export async function removeTripOrganizerAction(organizerId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  const adminClient = createAdminClient()

  // Get trip_id for revalidation
  const { data: organizer } = await adminClient
    .from('trip_organizers')
    .select('trip_id')
    .eq('id', organizerId)
    .single()

  const { error } = await adminClient
    .from('trip_organizers')
    .delete()
    .eq('id', organizerId)

  if (error) {
    if (error.message?.includes('Could not find the table') || 
        error.message?.includes('does not exist') ||
        error.code === '42P01') {
      throw new Error('Trip organizers table does not exist. Please run migration 24_add_trip_organizers.sql')
    }
    throw new Error(`Failed to remove organizer: ${error.message}`)
  }

  if (organizer) {
    revalidatePath(`/admin/trips/${organizer.trip_id}`)
  }

  return { success: true }
}

/**
 * Mark attendance for trip participants
 */
export async function markTripAttendanceAction(
  tripId: string,
  participantId: string,
  attendanceStatus: 'present' | 'absent' | 'excused' | 'late',
  notes?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile && ['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)

  // If not admin, check if user is an organizer with can_take_attendance permission
  if (!isAdmin) {
    const { data: organizer } = await adminClient
      .from('trip_organizers')
      .select('can_take_attendance')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!organizer || !organizer.can_take_attendance) {
      throw new Error('Unauthorized: Only admins or organizers with attendance permission can mark attendance')
    }
  }

  // Verify participant belongs to this trip
  const { data: participant } = await adminClient
    .from('trip_participants')
    .select('trip_id')
    .eq('id', participantId)
    .single()

  if (!participant || participant.trip_id !== tripId) {
    throw new Error('Participant not found for this trip')
  }

  // Update attendance
  const { data, error } = await adminClient
    .from('trip_participants')
    .update({
      attendance_status: attendanceStatus,
      attendance_marked_at: new Date().toISOString(),
      attendance_marked_by: user.id,
      attendance_notes: notes || null,
    })
    .eq('id', participantId)
    .select(`
      *,
      user:users!user_id(
        id,
        full_name,
        email,
        phone
      )
    `)
    .single()

  if (error) {
    throw new Error(`Failed to mark attendance: ${error.message}`)
  }

  revalidatePath('/admin/trips')
  revalidatePath(`/admin/trips/${tripId}`)
  return { success: true, data }
}

/**
 * Bulk mark attendance for multiple trip participants
 */
export async function bulkMarkTripAttendanceAction(
  tripId: string,
  attendanceRecords: Array<{
    participant_id: string
    attendance_status: 'present' | 'absent' | 'excused' | 'late'
    notes?: string
  }>
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile && ['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)

  // If not admin, check if user is an organizer with can_take_attendance permission
  if (!isAdmin) {
    const { data: organizer } = await adminClient
      .from('trip_organizers')
      .select('can_take_attendance')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single()

    if (!organizer || !organizer.can_take_attendance) {
      throw new Error('Unauthorized: Only admins or organizers with attendance permission can mark attendance')
    }
  }

  // Update all attendance records
  const updates = attendanceRecords.map(async (record) => {
    const { error } = await adminClient
      .from('trip_participants')
      .update({
        attendance_status: record.attendance_status,
        attendance_marked_at: new Date().toISOString(),
        attendance_marked_by: user.id,
        attendance_notes: record.notes || null,
      })
      .eq('id', record.participant_id)
      .eq('trip_id', tripId)

    if (error) {
      console.error(`Failed to mark attendance for participant ${record.participant_id}:`, error)
    }
  })

  await Promise.all(updates)

  revalidatePath('/admin/trips')
  revalidatePath(`/admin/trips/${tripId}`)
  return { success: true }
}

