'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from '@/lib/types'

function computeRepublishTo(nowIso: string, oldFrom?: string | null, oldTo?: string | null) {
  if (!oldTo) return null
  if (!oldFrom) return oldTo

  const from = new Date(oldFrom)
  const to = new Date(oldTo)
  const deltaMs = to.getTime() - from.getTime()
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return null

  const now = new Date(nowIso)
  return new Date(now.getTime() + deltaMs).toISOString()
}

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  return { userId: user.id, role: profile.role as string }
}

export async function getAnnouncementsAdminAction() {
  await requireAdminUser()
  const adminClient = createAdminClient()

  const { data: announcements, error } = await adminClient
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    const msg = error.message || ''
    // PostgREST schema cache error when migrations haven't been applied yet
    if (msg.includes("Could not find the table 'public.announcements'") || msg.includes('schema cache')) {
      return { success: true as const, data: [] as any[], schemaMissing: true as const }
    }
    throw new Error(`Failed to fetch announcements: ${error.message}`)
  }

  const ids = (announcements || []).map(a => a.id)
  if (ids.length === 0) {
    return { success: true as const, data: [] as any[], schemaMissing: false as const }
  }

  const [diocesesRes, churchesRes, classesRes] = await Promise.all([
    adminClient.from('announcement_dioceses').select('announcement_id, diocese_id').in('announcement_id', ids),
    adminClient.from('announcement_churches').select('announcement_id, church_id').in('announcement_id', ids),
    adminClient.from('announcement_classes').select('announcement_id, class_id').in('announcement_id', ids),
  ])

  const dioceseByAnn = (diocesesRes.data || []).reduce((acc: Record<string, string[]>, r: any) => {
    ;(acc[r.announcement_id] ||= []).push(r.diocese_id)
    return acc
  }, {})
  const churchByAnn = (churchesRes.data || []).reduce((acc: Record<string, string[]>, r: any) => {
    ;(acc[r.announcement_id] ||= []).push(r.church_id)
    return acc
  }, {})
  const classByAnn = (classesRes.data || []).reduce((acc: Record<string, string[]>, r: any) => {
    ;(acc[r.announcement_id] ||= []).push(r.class_id)
    return acc
  }, {})

  const combined = (announcements || []).map((a: any) => ({
    ...a,
    diocese_ids: dioceseByAnn[a.id] || [],
    church_ids: churchByAnn[a.id] || [],
    class_ids: classByAnn[a.id] || [],
  }))

  return { success: true as const, data: combined, schemaMissing: false as const }
}

export async function getAnnouncementTypesAction() {
  await requireAdminUser()
  const adminClient = createAdminClient()

  // Distinct tag list from existing announcements
  const { data, error } = await adminClient.rpc('get_distinct_announcement_types')

  // If RPC doesn't exist yet (first run), fall back to empty list
  if (error) {
    return { success: true as const, data: [] as string[] }
  }

  return { success: true as const, data: (data as string[]) || [] }
}

export async function getAnnouncementByIdAdminAction(announcementId: string) {
  await requireAdminUser()
  const adminClient = createAdminClient()

  const { data: announcement, error } = await adminClient
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single()

  if (error) throw new Error(`Failed to fetch announcement: ${error.message}`)

  const [diocesesRes, churchesRes, classesRes] = await Promise.all([
    adminClient.from('announcement_dioceses').select('diocese_id').eq('announcement_id', announcementId),
    adminClient.from('announcement_churches').select('church_id').eq('announcement_id', announcementId),
    adminClient.from('announcement_classes').select('class_id').eq('announcement_id', announcementId),
  ])

  return {
    success: true as const,
    data: {
      ...announcement,
      diocese_ids: (diocesesRes.data || []).map((r: any) => r.diocese_id),
      church_ids: (churchesRes.data || []).map((r: any) => r.church_id),
      class_ids: (classesRes.data || []).map((r: any) => r.class_id),
    },
  }
}

async function replaceScopeRows(announcementId: string, input: Pick<CreateAnnouncementInput, 'diocese_ids' | 'church_ids' | 'class_ids'>) {
  const adminClient = createAdminClient()

  await Promise.all([
    adminClient.from('announcement_dioceses').delete().eq('announcement_id', announcementId),
    adminClient.from('announcement_churches').delete().eq('announcement_id', announcementId),
    adminClient.from('announcement_classes').delete().eq('announcement_id', announcementId),
  ])

  if (input.diocese_ids && input.diocese_ids.length) {
    await adminClient.from('announcement_dioceses').insert(input.diocese_ids.map(dioceseId => ({
      announcement_id: announcementId,
      diocese_id: dioceseId,
    })))
  }

  if (input.church_ids && input.church_ids.length) {
    await adminClient.from('announcement_churches').insert(input.church_ids.map(churchId => ({
      announcement_id: announcementId,
      church_id: churchId,
    })))
  }

  if (input.class_ids && input.class_ids.length) {
    await adminClient.from('announcement_classes').insert(input.class_ids.map(classId => ({
      announcement_id: announcementId,
      class_id: classId,
    })))
  }
}

export async function createAnnouncementAction(input: CreateAnnouncementInput) {
  const { userId } = await requireAdminUser()
  const adminClient = createAdminClient()

  const { diocese_ids, church_ids, class_ids, ...announcementData } = input

  const { data, error } = await adminClient
    .from('announcements')
    .insert({
      ...announcementData,
      created_by: userId,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create announcement: ${error.message}`)

  await replaceScopeRows(data.id, { diocese_ids, church_ids, class_ids })

  revalidatePath('/admin/announcements')
  return { success: true as const, data }
}

export async function updateAnnouncementAction(input: UpdateAnnouncementInput) {
  await requireAdminUser()
  const adminClient = createAdminClient()

  const { id, diocese_ids, church_ids, class_ids, ...updateData } = input

  const { data, error } = await adminClient
    .from('announcements')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update announcement: ${error.message}`)

  // If any scope arrays were provided, replace scope rows
  if (diocese_ids !== undefined || church_ids !== undefined || class_ids !== undefined) {
    await replaceScopeRows(id, {
      diocese_ids: diocese_ids || [],
      church_ids: church_ids || [],
      class_ids: class_ids || [],
    })
  }

  revalidatePath('/admin/announcements')
  return { success: true as const, data }
}

export async function softDeleteAnnouncementAction(announcementId: string) {
  const { userId } = await requireAdminUser()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('announcements')
    .update({
      is_deleted: true,
      deactivated_at: new Date().toISOString(),
      deactivated_by: userId,
    })
    .eq('id', announcementId)

  if (error) {
    const msg = error.message || ''
    // If PostgREST schema cache is stale and doesn't know these columns yet, retry without them.
    if (msg.includes('schema cache') && (msg.includes('deactivated_at') || msg.includes('deactivated_by'))) {
      const { error: retryError } = await adminClient
        .from('announcements')
        .update({ is_deleted: true })
        .eq('id', announcementId)
      if (retryError) throw new Error(`Failed to delete announcement: ${retryError.message}`)
    } else {
      throw new Error(`Failed to delete announcement: ${error.message}`)
    }
  }

  revalidatePath('/admin/announcements')
  return { success: true as const }
}

export async function deactivateAnnouncementAction(announcementId: string, reason: string) {
  const { userId } = await requireAdminUser()
  const adminClient = createAdminClient()

  const cleaned = (reason || '').trim()

  const { error } = await adminClient
    .from('announcements')
    .update({
      is_deleted: true,
      deactivated_reason: cleaned ? cleaned : null,
      deactivated_at: new Date().toISOString(),
      deactivated_by: userId,
    })
    .eq('id', announcementId)

  if (error) {
    const msg = error.message || ''
    if (msg.includes('schema cache') && (msg.includes('deactivated_at') || msg.includes('deactivated_reason') || msg.includes('deactivated_by'))) {
      const { error: retryError } = await adminClient
        .from('announcements')
        .update({ is_deleted: true })
        .eq('id', announcementId)
      if (retryError) throw new Error(`Failed to deactivate announcement: ${retryError.message}`)
    } else {
      throw new Error(`Failed to deactivate announcement: ${error.message}`)
    }
  }

  revalidatePath('/admin/announcements')
  return { success: true as const }
}

export async function republishAnnouncementAction(announcementId: string, withEdit?: Partial<UpdateAnnouncementInput>) {
  await requireAdminUser()
  const adminClient = createAdminClient()

  const { data: existing, error: existingError } = await adminClient
    .from('announcements')
    .select('publish_from, publish_to')
    .eq('id', announcementId)
    .single()

  if (existingError) throw new Error(`Failed to load announcement: ${existingError.message}`)

  const nowIso = new Date().toISOString()
  const publish_to = computeRepublishTo(nowIso, existing?.publish_from, existing?.publish_to)

  const updatePayload: any = {
    publish_from: nowIso,
    publish_to,
    // Republish should bring it back even if it was soft-deleted
    is_deleted: false,
    deactivated_reason: null,
    deactivated_at: null,
    deactivated_by: null,
  }

  if (withEdit) {
    // do not allow overriding id
    const { id: _ignore, ...rest } = withEdit as any
    Object.assign(updatePayload, rest)
  }

  const { data, error } = await adminClient
    .from('announcements')
    .update(updatePayload)
    .eq('id', announcementId)
    .select('*')
    .single()

  if (error) {
    const msg = error.message || ''
    // If PostgREST schema cache is stale and doesn't know these columns yet, retry without them.
    if (msg.includes('schema cache') && (msg.includes('deactivated_at') || msg.includes('deactivated_reason') || msg.includes('deactivated_by'))) {
      const retryPayload: any = { ...updatePayload }
      delete retryPayload.deactivated_reason
      delete retryPayload.deactivated_at
      delete retryPayload.deactivated_by

      const { data: retryData, error: retryError } = await adminClient
        .from('announcements')
        .update(retryPayload)
        .eq('id', announcementId)
        .select('*')
        .single()

      if (retryError) throw new Error(`Failed to republish announcement: ${retryError.message}`)
      revalidatePath('/admin/announcements')
      return { success: true as const, data: retryData }
    }

    throw new Error(`Failed to republish announcement: ${error.message}`)
  }

  revalidatePath('/admin/announcements')
  return { success: true as const, data }
}


