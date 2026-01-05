'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type {
  CreateActivityInput,
  UpdateActivityInput,
  ApproveParticipationInput,
  ApproveCompletionInput,
  RevokePointsInput,
  ActivityStatus,
  ParticipationStatus,
  CompletionStatus,
} from '@/lib/types/sunday-school'

/**
 * Create a new activity
 */
export async function createActivityAction(input: CreateActivityInput) {
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

  const { data, error } = await adminClient
    .from('activities')
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create activity: ${error.message}`)
  }

  revalidatePath('/admin/activities')
  return { success: true, data }
}

/**
 * Update an activity
 */
export async function updateActivityAction(input: UpdateActivityInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { id, ...updateData } = input

  const { data, error } = await adminClient
    .from('activities')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update activity: ${error.message}`)
  }

  revalidatePath('/admin/activities')
  return { success: true, data }
}

/**
 * Get activity by ID
 */
export async function getActivityByIdAction(activityId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch activity: ${error.message}`)
  }

  return { success: true, data }
}

/**
 * Delete an activity
 */
export async function deleteActivityAction(activityId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) {
    throw new Error(`Failed to delete activity: ${error.message}`)
  }

  revalidatePath('/admin/activities')
  return { success: true }
}

/**
 * Get all activities (admin view with filtering)
 */
export async function getActivitiesAction(filters?: {
  status?: ActivityStatus
  diocese_id?: string
  church_id?: string
  class_id?: string
  parent_activity_id?: string | null
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  let query = adminClient
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.diocese_id) {
    query = query.eq('diocese_id', filters.diocese_id)
  }
  if (filters?.church_id) {
    query = query.eq('church_id', filters.church_id)
  }
  if (filters?.class_id) {
    query = query.eq('class_id', filters.class_id)
  }
  if (filters?.parent_activity_id !== undefined) {
    if (filters.parent_activity_id === null) {
      query = query.is('parent_activity_id', null)
    } else {
      query = query.eq('parent_activity_id', filters.parent_activity_id)
    }
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch activities: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Get activity participants with user details
 */
export async function getActivityParticipantsAction(activityId: string) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('activity_participants')
    .select(`
      *,
      users!user_id(
        id,
        full_name,
        email,
        user_code
      )
    `)
    .eq('activity_id', activityId)
    .order('requested_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch participants: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Get activity completions with user details
 */
export async function getActivityCompletionsAction(activityId: string) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('activity_completions')
    .select(`
      *,
      users!user_id(
        id,
        full_name,
        email,
        user_code
      )
    `)
    .eq('activity_id', activityId)
    .order('completed_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch completions: ${error.message}`)
  }

  return { success: true, data: data || [] }
}

/**
 * Approve or reject participation request
 */
export async function approveParticipationAction(input: ApproveParticipationInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const updateData: any = {
    status: input.approved ? ('approved' as ParticipationStatus) : ('rejected' as ParticipationStatus),
    approved_at: new Date().toISOString(),
    approved_by: user.id,
  }

  if (!input.approved && input.rejection_reason) {
    updateData.rejection_reason = input.rejection_reason
  }

  const { data, error } = await adminClient
    .from('activity_participants')
    .update(updateData)
    .eq('id', input.participation_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update participation: ${error.message}`)
  }

  revalidatePath('/admin/activities')
  return { success: true, data }
}

/**
 * Approve or reject completion request
 */
export async function approveCompletionAction(input: ApproveCompletionInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const updateData: any = {
    status: input.approved ? ('completed' as CompletionStatus) : ('rejected' as CompletionStatus),
    approved_at: new Date().toISOString(),
    approved_by: user.id,
  }

  if (input.admin_notes) {
    updateData.admin_notes = input.admin_notes
  }

  const { data, error } = await adminClient
    .from('activity_completions')
    .update(updateData)
    .eq('id', input.completion_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update completion: ${error.message}`)
  }

  revalidatePath('/admin/activities')
  return { success: true, data }
}

/**
 * Revoke points from a completion
 */
export async function revokePointsAction(input: RevokePointsInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('activity_completions')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
      revoke_reason: input.revoke_reason,
      points_awarded: 0,
    })
    .eq('id', input.completion_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to revoke points: ${error.message}`)
  }

  revalidatePath('/admin/activities')
  return { success: true, data }
}

/**
 * Bulk approve participations
 */
export async function bulkApproveParticipationsAction(participationIds: string[], approved: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const results = await Promise.allSettled(
    participationIds.map(id =>
      approveParticipationAction({ participation_id: id, approved })
    )
  )

  const successCount = results.filter(r => r.status === 'fulfilled').length
  const failedCount = results.filter(r => r.status === 'rejected').length

  revalidatePath('/admin/activities')
  return { success: true, successCount, failedCount }
}

/**
 * Bulk approve completions
 */
export async function bulkApproveCompletionsAction(completionIds: string[], approved: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const results = await Promise.allSettled(
    completionIds.map(id =>
      approveCompletionAction({ completion_id: id, approved })
    )
  )

  const successCount = results.filter(r => r.status === 'fulfilled').length
  const failedCount = results.filter(r => r.status === 'rejected').length

  revalidatePath('/admin/activities')
  return { success: true, successCount, failedCount }
}

/**
 * Get activity details with stats
 */
export async function getActivityDetailsAction(activityId: string) {
  const adminClient = createAdminClient()

  // Get activity
  const { data: activity, error: activityError } = await adminClient
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single()

  if (activityError) {
    throw new Error(`Failed to fetch activity: ${activityError.message}`)
  }

  // Get participants count by status
  const { data: participants } = await adminClient
    .from('activity_participants')
    .select('status')
    .eq('activity_id', activityId)

  // Get completions count by status
  const { data: completions } = await adminClient
    .from('activity_completions')
    .select('status, points_awarded, is_revoked')
    .eq('activity_id', activityId)

  const participantsStats = {
    pending: participants?.filter(p => p.status === 'pending').length || 0,
    approved: participants?.filter(p => p.status === 'approved').length || 0,
    rejected: participants?.filter(p => p.status === 'rejected').length || 0,
  }

  const completionsStats = {
    pending: completions?.filter(c => c.status === 'pending').length || 0,
    completed: completions?.filter(c => c.status === 'completed' && !c.is_revoked).length || 0,
    rejected: completions?.filter(c => c.status === 'rejected').length || 0,
    revoked: completions?.filter(c => c.is_revoked).length || 0,
  }

  const totalPointsAwarded = completions
    ?.filter(c => !c.is_revoked)
    ?.reduce((sum, c) => sum + c.points_awarded, 0) || 0

  return {
    success: true,
    data: {
      activity,
      participantsStats,
      completionsStats,
      totalPointsAwarded,
    }
  }
}
