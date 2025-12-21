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
} from '@/lib/types/sunday-school'

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
  const { destinations, church_ids, diocese_ids, ...tripData } = input

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

  const { id, destinations, church_ids, diocese_ids, ...updateData } = input

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

  return { 
    success: true, 
    data: { 
      ...trip, 
      destinations: destinations || [],
      churches: churches || [],
      dioceses: dioceses || [],
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

  // Get destinations, churches, and dioceses for all trips
  if (data && data.length > 0) {
    const tripIds = data.map(t => t.id)
    
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

    // Attach to trips
    const tripsWithDetails = data.map(trip => ({
      ...trip,
      destinations: destinationsByTrip[trip.id] || [],
      churches: churchesByTrip[trip.id] || [],
      dioceses: diocesesByTrip[trip.id] || [],
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
        phone
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

  // Get destinations, churches, and dioceses
  const [destinationsResult, churchesResult, diocesesResult] = await Promise.all([
    adminClient.from('trip_destinations').select('*').eq('trip_id', tripId).order('visit_order', { ascending: true }),
    adminClient.from('trip_churches').select('*').eq('trip_id', tripId),
    adminClient.from('trip_dioceses').select('*').eq('trip_id', tripId),
  ])

  const destinations = destinationsResult.data || []
  const churches = churchesResult.data || []
  const dioceses = diocesesResult.data || []

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

