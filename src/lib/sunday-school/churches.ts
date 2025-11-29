import { createClient } from '../supabase/client'
import type { Church, CreateChurchInput } from '../types/sunday-school'

/**
 * Get all churches
 */
export async function getChurches(dioceseId?: string): Promise<Church[]> {
  const supabase = createClient()

  let query = supabase
    .from('churches')
    .select('*')
    .order('name', { ascending: true })

  if (dioceseId) {
    query = query.eq('diocese_id', dioceseId)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Church[]
}

/**
 * Get a single church by ID
 */
export async function getChurchById(id: string): Promise<Church | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('churches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as Church
}

/**
 * Create a new church
 */
export async function createChurch(input: CreateChurchInput): Promise<Church> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('churches')
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as Church
}

/**
 * Update a church
 */
export async function updateChurch(
  id: string,
  updates: Partial<CreateChurchInput>
): Promise<Church> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('churches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Church
}

/**
 * Delete a church
 */
export async function deleteChurch(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('churches')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get classes count for a church
 */
export async function getChurchClassesCount(churchId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  if (error) throw error
  return count || 0
}

/**
 * Get church with diocese information
 */
export async function getChurchWithDiocese(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('churches')
    .select(`
      *,
      diocese:dioceses(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
