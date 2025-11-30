'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateChurchInput } from '@/lib/types/sunday-school'

export async function getChurchesData(dioceseId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('churches')
    .select('*')
    .order('name', { ascending: true })

  if (dioceseId && dioceseId !== 'all') {
    query = query.eq('diocese_id', dioceseId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching churches:', error)
    return []
  }

  return data
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

  return data
}

export async function getChurchClassesCountData(churchId: string) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  if (error) {
    console.error('Error fetching class count:', error)
    return 0
  }

  return count || 0
}

export async function getAllChurchesWithClassCounts(dioceseId?: string) {
  const churches = await getChurchesData(dioceseId)

  const churchesWithCounts = await Promise.all(
    churches.map(async (church) => ({
      ...church,
      classCount: await getChurchClassesCountData(church.id),
    }))
  )

  return churchesWithCounts
}

export async function createChurchAction(input: CreateChurchInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('churches').insert({
    ...input,
    created_by: user.id,
  })

  if (error) {
    console.error('Error creating church:', error)
    throw new Error('Failed to create church')
  }

  revalidatePath('/admin/churches')
  return { success: true }
}

export async function updateChurchAction(
  id: string,
  updates: Partial<CreateChurchInput>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('churches')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating church:', error)
    throw new Error('Failed to update church')
  }

  revalidatePath('/admin/churches')
  return { success: true }
}

export async function deleteChurchAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('churches').delete().eq('id', id)

  if (error) {
    console.error('Error deleting church:', error)
    throw new Error('Failed to delete church')
  }

  revalidatePath('/admin/churches')
  return { success: true }
}
