import { createClient } from '../supabase/client'
import type { Diocese, CreateDioceseInput } from '../types/sunday-school'

/**
 * Get all dioceses
 */
export async function getDioceses(): Promise<Diocese[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dioceses')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Diocese[]
}

/**
 * Get a single diocese by ID
 */
export async function getDioceseById(id: string): Promise<Diocese | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dioceses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as Diocese
}

/**
 * Create a new diocese
 */
export async function createDiocese(input: CreateDioceseInput): Promise<Diocese> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('dioceses')
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data as Diocese
}

/**
 * Update a diocese
 */
export async function updateDiocese(
  id: string,
  updates: Partial<CreateDioceseInput>
): Promise<Diocese> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dioceses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Diocese
}

/**
 * Delete a diocese
 */
export async function deleteDiocese(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('dioceses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get churches count for a diocese
 */
export async function getDioceseChurchesCount(dioceseId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .eq('diocese_id', dioceseId)

  if (error) throw error
  return count || 0
}
