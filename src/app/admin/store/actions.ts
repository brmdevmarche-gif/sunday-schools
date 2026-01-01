'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { CreateStoreItemInput, UpdateStoreItemInput } from '@/lib/types/sunday-school'

export async function createStoreItemAction(input: CreateStoreItemInput) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client to bypass RLS for insert
  const adminClient = createAdminClient()

  // Create the store item
  const { data: storeItem, error: itemError } = await adminClient
    .from('store_items')
    .insert({
      name: input.name,
      description: input.description || null,
      image_url: input.image_url || null,
      stock_type: input.stock_type,
      stock_quantity: input.stock_quantity,
      price_normal: input.price_normal,
      price_mastor: input.price_mastor,
      price_botl: input.price_botl,
      is_available_to_all_classes: input.is_available_to_all_classes ?? true,
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (itemError) {
    throw new Error(`Failed to create store item: ${itemError.message}`)
  }

  // Create church associations if provided
  if (input.church_ids && input.church_ids.length > 0) {
    const churchAssociations = input.church_ids.map(churchId => ({
      store_item_id: storeItem.id,
      church_id: churchId,
    }))

    const { error: churchError } = await adminClient
      .from('store_item_churches')
      .insert(churchAssociations)

    if (churchError) {
      console.error('Failed to create church associations:', churchError)
      // Don't throw, item is already created
    }
  }

  // Create diocese associations if provided
  if (input.diocese_ids && input.diocese_ids.length > 0) {
    const dioceseAssociations = input.diocese_ids.map(dioceseId => ({
      store_item_id: storeItem.id,
      diocese_id: dioceseId,
    }))

    const { error: dioceseError } = await adminClient
      .from('store_item_dioceses')
      .insert(dioceseAssociations)

    if (dioceseError) {
      console.error('Failed to create diocese associations:', dioceseError)
      // Don't throw, item is already created
    }
  }

  // Create class associations if specific classes are provided
  if (!input.is_available_to_all_classes && input.class_ids && input.class_ids.length > 0) {
    const classAssociations = input.class_ids.map(classId => ({
      store_item_id: storeItem.id,
      class_id: classId,
    }))

    const { error: classError } = await adminClient
      .from('store_item_classes')
      .insert(classAssociations)

    if (classError) {
      console.error('Failed to create class associations:', classError)
      // Don't throw, item is already created
    }
  }

  revalidatePath('/admin/store')
  return { success: true, data: storeItem }
}

export async function updateStoreItemAction(itemId: string, input: UpdateStoreItemInput) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client to bypass RLS for update
  const adminClient = createAdminClient()

  // Extract junction table data from input
  const { church_ids, diocese_ids, class_ids, ...itemData } = input

  // Update the store item
  const updateData: any = {
    ...itemData,
    updated_by: user.id,
  }

  const { error: itemError } = await adminClient
    .from('store_items')
    .update(updateData)
    .eq('id', itemId)

  if (itemError) {
    throw new Error(`Failed to update store item: ${itemError.message}`)
  }

  // Update church associations if provided
  if (church_ids !== undefined) {
    // Delete existing associations
    await adminClient
      .from('store_item_churches')
      .delete()
      .eq('store_item_id', itemId)

    // Create new associations
    if (church_ids.length > 0) {
      const churchAssociations = church_ids.map(churchId => ({
        store_item_id: itemId,
        church_id: churchId,
      }))

      const { error: churchError } = await adminClient
        .from('store_item_churches')
        .insert(churchAssociations)

      if (churchError) {
        console.error('Failed to update church associations:', churchError)
      }
    }
  }

  // Update diocese associations if provided
  if (diocese_ids !== undefined) {
    // Delete existing associations
    await adminClient
      .from('store_item_dioceses')
      .delete()
      .eq('store_item_id', itemId)

    // Create new associations
    if (diocese_ids.length > 0) {
      const dioceseAssociations = diocese_ids.map(dioceseId => ({
        store_item_id: itemId,
        diocese_id: dioceseId,
      }))

      const { error: dioceseError } = await adminClient
        .from('store_item_dioceses')
        .insert(dioceseAssociations)

      if (dioceseError) {
        console.error('Failed to update diocese associations:', dioceseError)
      }
    }
  }

  // Update class associations if provided
  if (class_ids !== undefined) {
    // Delete existing associations
    await adminClient
      .from('store_item_classes')
      .delete()
      .eq('store_item_id', itemId)

    // Create new associations
    if (class_ids.length > 0) {
      const classAssociations = class_ids.map(classId => ({
        store_item_id: itemId,
        class_id: classId,
      }))

      const { error: classError } = await adminClient
        .from('store_item_classes')
        .insert(classAssociations)

      if (classError) {
        console.error('Failed to update class associations:', classError)
      }
    }
  }

  revalidatePath('/admin/store')
  return { success: true }
}

export async function deleteStoreItemAction(itemId: string) {
  // Use admin client to bypass RLS for delete
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('store_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    throw new Error(`Failed to delete store item: ${error.message}`)
  }

  revalidatePath('/admin/store')
  return { success: true }
}

export async function toggleStoreItemStatusAction(itemId: string, isActive: boolean) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client to bypass RLS for update
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('store_items')
    .update({
      is_active: isActive,
      updated_by: user.id,
    })
    .eq('id', itemId)

  if (error) {
    throw new Error(`Failed to toggle store item status: ${error.message}`)
  }

  revalidatePath('/admin/store')
  return { success: true }
}

export interface ItemDemandStats {
  item_id: string
  item_name: string
  item_image_url: string | null
  stock_quantity: number
  stock_type: 'quantity' | 'on_demand'
  total_requested: number
  pending_requests: number
  approved_requests: number
  fulfilled_requests: number
}

/**
 * Get item demand statistics - shows total requests per item
 */
export async function getItemDemandStatsAction(): Promise<ItemDemandStats[]> {
  const adminClient = createAdminClient()

  // Get all store items
  const { data: storeItems, error: itemsError } = await adminClient
    .from('store_items')
    .select('id, name, image_url, stock_quantity, stock_type')
    .order('name')

  if (itemsError) {
    throw new Error(`Failed to fetch store items: ${itemsError.message}`)
  }

  // Get all order items with their order status
  const { data: orderItems, error: ordersError } = await adminClient
    .from('order_items')
    .select(`
      store_item_id,
      quantity,
      orders!inner(status)
    `)

  if (ordersError) {
    throw new Error(`Failed to fetch order items: ${ordersError.message}`)
  }

  // Aggregate the data
  const demandMap = new Map<string, {
    total: number
    pending: number
    approved: number
    fulfilled: number
  }>()

  // Initialize all items with zero counts
  for (const item of storeItems || []) {
    demandMap.set(item.id, { total: 0, pending: 0, approved: 0, fulfilled: 0 })
  }

  // Aggregate order items
  for (const orderItem of orderItems || []) {
    const stats = demandMap.get(orderItem.store_item_id)
    if (stats) {
      const order = orderItem.orders as unknown as { status: string }
      const qty = orderItem.quantity

      // Count all requests (not cancelled or rejected)
      if (order.status !== 'cancelled' && order.status !== 'rejected') {
        stats.total += qty
      }

      // Count by status
      switch (order.status) {
        case 'pending':
          stats.pending += qty
          break
        case 'approved':
          stats.approved += qty
          break
        case 'fulfilled':
          stats.fulfilled += qty
          break
      }
    }
  }

  // Build the result
  const result: ItemDemandStats[] = (storeItems || []).map(item => {
    const stats = demandMap.get(item.id) || { total: 0, pending: 0, approved: 0, fulfilled: 0 }
    return {
      item_id: item.id,
      item_name: item.name,
      item_image_url: item.image_url,
      stock_quantity: item.stock_quantity,
      stock_type: item.stock_type,
      total_requested: stats.total,
      pending_requests: stats.pending,
      approved_requests: stats.approved,
      fulfilled_requests: stats.fulfilled,
    }
  })

  // Sort by total requested (highest first)
  result.sort((a, b) => b.total_requested - a.total_requested)

  return result
}
