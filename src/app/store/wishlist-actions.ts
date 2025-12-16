'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Add item to wishlist
 */
export async function addToWishlistAction(store_item_id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  // Check if item already in wishlist
  const { data: existing, error: checkError } = await adminClient
    .from('wishlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('store_item_id', store_item_id)
    .single()

  // If table doesn't exist, inform user
  if (checkError && (checkError.message.includes('Could not find the table') || checkError.message.includes('does not exist'))) {
    throw new Error('Wishlist table does not exist. Please run migration 20_create_wishlist.sql in Supabase SQL Editor.')
  }

  if (existing) {
    throw new Error('Item already in wishlist')
  }

  // Add to wishlist
  const { error } = await adminClient
    .from('wishlist')
    .insert({
      user_id: user.id,
      store_item_id,
    })

  if (error) {
    throw new Error(`Failed to add to wishlist: ${error.message}`)
  }

  revalidatePath('/store')
  return { success: true }
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlistAction(store_item_id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('wishlist')
    .delete()
    .eq('user_id', user.id)
    .eq('store_item_id', store_item_id)

  // If table doesn't exist, just return success (nothing to remove)
  if (error) {
    if (error.message.includes('Could not find the table') || error.message.includes('does not exist')) {
      return { success: true }
    }
    throw new Error(`Failed to remove from wishlist: ${error.message}`)
  }

  revalidatePath('/store')
  return { success: true }
}

/**
 * Get user's wishlist
 */
export async function getWishlistAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('wishlist')
    .select('store_item_id')
    .eq('user_id', user.id)

  // If table doesn't exist, return empty array instead of throwing error
  if (error) {
    if (error.message.includes('Could not find the table') || error.message.includes('does not exist')) {
      console.warn('Wishlist table does not exist yet. Please run migration 20_create_wishlist.sql')
      return { success: true, data: [] }
    }
    throw new Error(`Failed to fetch wishlist: ${error.message}`)
  }

  // Return array of store item IDs
  const itemIds = data?.map(w => w.store_item_id) || []
  return { success: true, data: itemIds }
}

