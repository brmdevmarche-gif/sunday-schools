'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateDioceseInput } from '@/lib/types/sunday-school'

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

export async function getDioceseChurchesCountData(dioceseId: string) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .eq('diocese_id', dioceseId)

  if (error) {
    console.error('Error fetching church count:', error)
    return 0
  }

  return count || 0
}

export async function getAllDiocesesWithChurchCounts() {
  const dioceses = await getDiocesesData()

  const diocesesWithCounts = await Promise.all(
    dioceses.map(async (diocese) => ({
      ...diocese,
      churchCount: await getDioceseChurchesCountData(diocese.id),
    }))
  )

  return diocesesWithCounts
}

export async function createDioceseAction(input: CreateDioceseInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('dioceses').insert({
    ...input,
    created_by: user.id,
  })

  if (error) {
    console.error('Error creating diocese:', error)
    throw new Error('Failed to create diocese')
  }

  revalidatePath('/admin/dioceses')
  return { success: true }
}

export async function updateDioceseAction(
  id: string,
  updates: Partial<CreateDioceseInput>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('dioceses')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating diocese:', error)
    throw new Error('Failed to update diocese')
  }

  revalidatePath('/admin/dioceses')
  return { success: true }
}

export async function deleteDioceseAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('dioceses').delete().eq('id', id)

  if (error) {
    console.error('Error deleting diocese:', error)
    throw new Error('Failed to delete diocese')
  }

  revalidatePath('/admin/dioceses')
  return { success: true }
}
