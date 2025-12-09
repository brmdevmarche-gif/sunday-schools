'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type {
  ParticipateActivityInput,
  CompleteActivityInput,
} from '@/lib/types/sunday-school'

/**
 * Get available activities for current user
 */
export async function getAvailableActivitiesAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('id, diocese_id, church_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  // Get user's class assignments
  const { data: classAssignments } = await supabase
    .from('class_assignments')
    .select('class_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const classIds = classAssignments?.map(a => a.class_id) || []

  const adminClient = createAdminClient()

  // Get activities available to the user
  const { data: activities, error } = await adminClient
    .from('activities')
    .select(`
      *,
      parent_activity:activities!parent_activity_id(id, name)
    `)
    .eq('status', 'active')
    .or(`diocese_id.is.null,diocese_id.eq.${profile.diocese_id},church_id.eq.${profile.church_id}${classIds.length > 0 ? `,class_id.in.(${classIds.join(',')})` : ''}`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch activities: ${error.message}`)
  }

  // Get user's participations
  const { data: participations } = await adminClient
    .from('activity_participants')
    .select('*')
    .eq('user_id', user.id)

  // Get user's completions
  const { data: completions } = await adminClient
    .from('activity_completions')
    .select('*')
    .eq('user_id', user.id)

  // Combine data
  const activitiesWithStatus = activities?.map(activity => ({
    ...activity,
    my_participation: participations?.find(p => p.activity_id === activity.id),
    my_completion: completions?.find(c => c.activity_id === activity.id && !c.is_revoked),
  })) || []

  return { success: true, data: activitiesWithStatus }
}

/**
 * Request to participate in an activity
 */
export async function participateInActivityAction(input: ParticipateActivityInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get activity details
  const { data: activity } = await adminClient
    .from('activities')
    .select('*')
    .eq('id', input.activity_id)
    .single()

  if (!activity) {
    throw new Error('Activity not found')
  }

  // Check if already participating
  const { data: existing } = await adminClient
    .from('activity_participants')
    .select('*')
    .eq('activity_id', input.activity_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    throw new Error('Already participating in this activity')
  }

  // Check capacity
  if (activity.max_participants) {
    const { data: currentParticipants } = await adminClient
      .from('activity_participants')
      .select('id')
      .eq('activity_id', input.activity_id)
      .in('status', ['approved', 'active'])

    if (currentParticipants && currentParticipants.length >= activity.max_participants) {
      throw new Error('Activity is full')
    }
  }

  // Create participation request
  const { data, error } = await adminClient
    .from('activity_participants')
    .insert({
      activity_id: input.activity_id,
      user_id: user.id,
      status: activity.requires_participation_approval ? 'pending' : 'approved',
      approved_at: activity.requires_participation_approval ? null : new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to participate: ${error.message}`)
  }

  revalidatePath('/activities')
  return { success: true, data }
}

/**
 * Withdraw from an activity
 */
export async function withdrawFromActivityAction(activityId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('activity_participants')
    .update({ status: 'withdrawn' })
    .eq('activity_id', activityId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to withdraw: ${error.message}`)
  }

  revalidatePath('/activities')
  return { success: true }
}

/**
 * Mark activity as complete
 */
export async function completeActivityAction(input: CompleteActivityInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get activity details
  const { data: activity } = await adminClient
    .from('activities')
    .select('*')
    .eq('id', input.activity_id)
    .single()

  if (!activity) {
    throw new Error('Activity not found')
  }

  // Check if user is participating
  const { data: participation } = await adminClient
    .from('activity_participants')
    .select('*')
    .eq('activity_id', input.activity_id)
    .eq('user_id', user.id)
    .single()

  if (activity.requires_participation_approval && (!participation || participation.status !== 'approved')) {
    throw new Error('Must be approved participant to complete activity')
  }

  // Check if already completed
  const { data: existing } = await adminClient
    .from('activity_completions')
    .select('*')
    .eq('activity_id', input.activity_id)
    .eq('user_id', user.id)
    .eq('is_revoked', false)
    .single()

  if (existing) {
    throw new Error('Activity already completed')
  }

  // Check deadline
  if (activity.deadline && new Date() > new Date(activity.deadline)) {
    throw new Error('Activity deadline has passed')
  }

  // Create completion (points will be calculated by trigger)
  const { data, error } = await adminClient
    .from('activity_completions')
    .insert({
      activity_id: input.activity_id,
      user_id: user.id,
      status: activity.requires_completion_approval ? 'pending' : 'completed',
      notes: input.notes,
      completed_at: new Date().toISOString(),
      approved_at: activity.requires_completion_approval ? null : new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to complete activity: ${error.message}`)
  }

  revalidatePath('/activities')
  return { success: true, data }
}

/**
 * Get my activity completions with points
 */
export async function getMyCompletionsAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('activity_completions')
    .select(`
      *,
      activities(
        id,
        name,
        description,
        image_url,
        points
      )
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch completions: ${error.message}`)
  }

  // Calculate total points
  const totalPoints = data
    ?.filter(c => c.status === 'completed' && !c.is_revoked)
    ?.reduce((sum, c) => sum + c.points_awarded, 0) || 0

  const pendingPoints = data
    ?.filter(c => c.status === 'pending' && !c.is_revoked)
    ?.reduce((sum, c) => sum + c.points_awarded, 0) || 0

  return {
    success: true,
    data: {
      completions: data || [],
      totalPoints,
      pendingPoints,
    }
  }
}

/**
 * Get activity details for student view
 */
export async function getActivityDetailsForUserAction(activityId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Get activity
  const { data: activity, error } = await adminClient
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch activity: ${error.message}`)
  }

  // Get user's participation
  const { data: participation } = await adminClient
    .from('activity_participants')
    .select('*')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .single()

  // Get user's completion
  const { data: completion } = await adminClient
    .from('activity_completions')
    .select('*')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .eq('is_revoked', false)
    .single()

  // Get sub-activities
  const { data: subActivities } = await adminClient
    .from('activities')
    .select('*')
    .eq('parent_activity_id', activityId)
    .eq('status', 'active')

  return {
    success: true,
    data: {
      activity,
      participation,
      completion,
      subActivities: subActivities || [],
    }
  }
}
