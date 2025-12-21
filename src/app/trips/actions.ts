'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { SubscribeToTripInput, TripWithDetails } from '@/lib/types/sunday-school'

/**
 * Get available trips for students (published trips)
 */
export async function getAvailableTripsAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get available trips
  const { data: trips, error } = await adminClient
    .from('trips')
    .select('*')
    .eq('available', true)
    .in('status', ['active', 'started'])
    .order('start_datetime', { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(`Failed to fetch trips: ${error.message}`)
  }

  // Get destinations for all trips
  if (trips && trips.length > 0) {
    const tripIds = trips.map(t => t.id)
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

    // Get user's participations
    const { data: participations } = await adminClient
      .from('trip_participants')
      .select('trip_id, approval_status, payment_status')
      .eq('user_id', user.id)

    const participationsByTrip = (participations || []).reduce((acc: Record<string, any>, p) => {
      acc[p.trip_id] = p
      return acc
    }, {})

    // Get churches and dioceses for trips
    const { data: allChurches } = await adminClient
      .from('trip_churches')
      .select('*')
      .in('trip_id', tripIds)

    const { data: allDioceses } = await adminClient
      .from('trip_dioceses')
      .select('*')
      .in('trip_id', tripIds)

    const churchesByTrip = (allChurches || []).reduce((acc: Record<string, any[]>, church) => {
      if (!acc[church.trip_id]) acc[church.trip_id] = []
      acc[church.trip_id].push(church)
      return acc
    }, {})

    const diocesesByTrip = (allDioceses || []).reduce((acc: Record<string, any[]>, diocese) => {
      if (!acc[diocese.trip_id]) acc[diocese.trip_id] = []
      acc[diocese.trip_id].push(diocese)
      return acc
    }, {})

    // Attach destinations and participation status to trips
    const tripsWithDetails: TripWithDetails[] = trips.map(trip => ({
      ...trip,
      destinations: destinationsByTrip[trip.id] || [],
      churches: churchesByTrip[trip.id] || [],
      dioceses: diocesesByTrip[trip.id] || [],
      my_participation: participationsByTrip[trip.id] || undefined,
    }))

    return { success: true, data: tripsWithDetails }
  }

  return { success: true, data: [] }
}

/**
 * Subscribe to a trip (student application)
 */
export async function subscribeToTripAction(input: SubscribeToTripInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is a student
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') {
    throw new Error('Only students can subscribe to trips')
  }

  const adminClient = createAdminClient()

  // Check if already subscribed
  const { data: existing } = await adminClient
    .from('trip_participants')
    .select('id')
    .eq('trip_id', input.trip_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    throw new Error('You are already subscribed to this trip')
  }

  // Check if trip exists and is available
  const { data: trip } = await adminClient
    .from('trips')
    .select('max_participants, available, status')
    .eq('id', input.trip_id)
    .single()

  if (!trip || !trip.available || !['active', 'started'].includes(trip.status)) {
    throw new Error('This trip is not available for subscription')
  }

  // Check if trip is full
  if (trip.max_participants) {
    const { data: participants } = await adminClient
      .from('trip_participants')
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', input.trip_id)
      .eq('approval_status', 'approved')

    const participantCount = participants?.length || 0
    if (participantCount >= trip.max_participants) {
      throw new Error('This trip is full')
    }
  }

  // Create participation
  const { data, error } = await adminClient
    .from('trip_participants')
    .insert({
      trip_id: input.trip_id,
      user_id: user.id,
      approval_status: 'pending',
      payment_status: 'pending',
      emergency_contact: input.emergency_contact || null,
      medical_info: input.medical_info || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to subscribe to trip: ${error.message}`)
  }

  revalidatePath('/trips')
  return { success: true, data }
}

/**
 * Get my trips (trips I've subscribed to)
 */
export async function getMyTripsAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get user's trip participations
  const { data: participations, error } = await adminClient
    .from('trip_participants')
    .select(`
      *,
      trips!trip_id(*)
    `)
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch trips: ${error.message}`)
  }

  // Get destinations for trips
  if (participations && participations.length > 0) {
    const tripIds = participations.map(p => p.trip_id).filter(Boolean) as string[]
    const { data: destinations } = await adminClient
      .from('trip_destinations')
      .select('*')
      .in('trip_id', tripIds)
      .order('visit_order', { ascending: true })

    const destinationsByTrip = (destinations || []).reduce((acc: Record<string, any[]>, dest) => {
      if (!acc[dest.trip_id]) {
        acc[dest.trip_id] = []
      }
      acc[dest.trip_id].push(dest)
      return acc
    }, {})

    // Format the data
    const tripsWithDetails = participations.map((p: any) => ({
      ...p.trips,
      destinations: destinationsByTrip[p.trip_id] || [],
      my_participation: {
        id: p.id,
        approval_status: p.approval_status,
        payment_status: p.payment_status,
        registered_at: p.registered_at,
      },
    }))

    return { success: true, data: tripsWithDetails }
  }

  return { success: true, data: [] }
}

/**
 * Get trip details by ID
 */
export async function getTripDetailsAction(tripId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get trip
  const { data: trip, error } = await adminClient
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (error || !trip) {
    return { success: false, data: null }
  }

  // Get destinations
  const { data: destinations } = await adminClient
    .from('trip_destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('visit_order', { ascending: true })

  // Get user's participation status
  const { data: participation } = await adminClient
    .from('trip_participants')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single()

  // Get participant count
  const { count } = await adminClient
    .from('trip_participants')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('approval_status', 'approved')

  // Get churches and dioceses
  const { data: churches } = await adminClient
    .from('trip_churches')
    .select('*')
    .eq('trip_id', tripId)

  const { data: dioceses } = await adminClient
    .from('trip_dioceses')
    .select('*')
    .eq('trip_id', tripId)

  const tripWithDetails: TripWithDetails = {
    ...trip,
    destinations: destinations || [],
    churches: churches || [],
    dioceses: dioceses || [],
    my_participation: participation || undefined,
    participants_count: count || 0,
  }

  return { success: true, data: tripWithDetails }
}


