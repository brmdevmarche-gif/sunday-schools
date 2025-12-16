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

  // Extract destinations from input
  const { destinations, ...tripData } = input

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
      location_name: dest.location_name,
      location_address: dest.location_address || null,
      location_description: dest.location_description || null,
      visit_order: dest.visit_order || index + 1,
    }))

    const { error: destError } = await adminClient
      .from('trip_destinations')
      .insert(destinationsToInsert)

    if (destError) {
      console.error('Failed to create destinations:', destError)
      // Don't throw, trip is already created
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

  const { id, destinations, ...updateData } = input

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
        location_name: dest.location_name,
        location_address: dest.location_address || null,
        location_description: dest.location_description || null,
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

  return { success: true, data: { ...trip, destinations: destinations || [] } }
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
    .order('trip_date', { ascending: false, nullsLast: true })
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

  // Get destinations for all trips
  if (data && data.length > 0) {
    const tripIds = data.map(t => t.id)
    const { data: destinations } = await adminClient
      .from('trip_destinations')
      .select('*')
      .in('trip_id', tripIds)
      .order('visit_order', { ascending: true })

    // Group destinations by trip_id
    const destinationsByTrip = (destinations || []).reduce((acc: Record<string, any[]>, dest) => {
      if (!acc[dest.trip_id]) {
        acc[dest.trip_id] = []
      }
      acc[dest.trip_id].push(dest)
      return acc
    }, {})

    // Attach destinations to trips
    const tripsWithDestinations = data.map(trip => ({
      ...trip,
      destinations: destinationsByTrip[trip.id] || []
    }))

    return { success: true, data: tripsWithDestinations }
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
      users!user_id(
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

  // Get destinations
  const { data: destinations } = await adminClient
    .from('trip_destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('visit_order', { ascending: true })

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
      destinations: destinations || [],
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

