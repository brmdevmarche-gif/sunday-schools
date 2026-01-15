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

  // Extract special offers from input
  const { special_offers, ...itemInput } = input

  // Create the store item
  const { data: storeItem, error: itemError } = await adminClient
    .from('store_items')
    .insert({
      name: itemInput.name,
      description: itemInput.description || null,
      image_url: itemInput.image_url || null,
      stock_type: itemInput.stock_type,
      stock_quantity: itemInput.stock_quantity,
      price_normal: itemInput.price_normal,
      price_mastor: itemInput.price_mastor,
      price_botl: itemInput.price_botl,
      is_available_to_all_classes: itemInput.is_available_to_all_classes ?? true,
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (itemError) {
    throw new Error(`Failed to create store item: ${itemError.message}`)
  }

  // Create special offers if provided
  if (special_offers && special_offers.length > 0) {
    const offersToInsert = special_offers.map(offer => ({
      store_item_id: storeItem.id,
      special_price_normal: offer.special_price_normal ?? null,
      special_price_mastor: offer.special_price_mastor ?? null,
      special_price_botl: offer.special_price_botl ?? null,
      start_at: offer.start_at,
      end_at: offer.end_at,
    }))

    const { error: offersError } = await adminClient
      .from('store_item_special_offers')
      .insert(offersToInsert)

    if (offersError) {
      console.error('Failed to create special offers:', offersError)
      // Don't throw, item is already created - user can add offers later
    }
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

  // Extract junction table data and special offers from input
  const { church_ids, diocese_ids, class_ids, special_offers, ...itemData } = input

  // Update the store item (excluding special offers which are handled separately)
  const updateData: Omit<UpdateStoreItemInput, 'church_ids' | 'diocese_ids' | 'class_ids' | 'special_offers'> & { updated_by: string } = {
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

  // Update special offers (full replacement strategy)
  if (special_offers !== undefined) {
    // Delete all existing special offers for this item
    await adminClient
      .from('store_item_special_offers')
      .delete()
      .eq('store_item_id', itemId)

    // Insert new special offers if any
    if (special_offers.length > 0) {
      const offersToInsert = special_offers
        .filter(offer => offer.start_at && offer.end_at) // Only insert valid offers
        .map(offer => ({
          store_item_id: itemId,
          special_price_normal: offer.special_price_normal ?? null,
          special_price_mastor: offer.special_price_mastor ?? null,
          special_price_botl: offer.special_price_botl ?? null,
          start_at: offer.start_at!,
          end_at: offer.end_at!,
        }))

      if (offersToInsert.length > 0) {
        const { error: offersError } = await adminClient
          .from('store_item_special_offers')
          .insert(offersToInsert)

        if (offersError) {
          console.error('Failed to update special offers:', offersError)
          throw new Error(`Failed to update special offers: ${offersError.message}`)
        }
      }
    }
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

export interface MonthlyItemDemandStats {
  month_key: string // YYYY-MM (UTC)
  month_label: string
  stats: ItemDemandStats[]
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

/**
 * Get item demand statistics grouped by month (UTC), optionally filtered by orders.created_at range.
 * This is used by the admin "Item demand" view to match the same date filters + month grouping used elsewhere.
 */
export async function getItemDemandStatsByMonthAction(filters?: {
  from?: string
  to?: string
}): Promise<MonthlyItemDemandStats[]> {
  const adminClient = createAdminClient()

  // Get all store items (for item metadata)
  const { data: storeItems, error: itemsError } = await adminClient
    .from('store_items')
    .select('id, name, image_url, stock_quantity, stock_type')
    .order('name')

  if (itemsError) {
    throw new Error(`Failed to fetch store items: ${itemsError.message}`)
  }

  // Get order items with order status + created_at (for month grouping)
  let oiQuery = adminClient
    .from('order_items')
    .select(`
      store_item_id,
      quantity,
      orders!inner(status, created_at)
    `)

  // Attempt server-side filtering (PostgREST supports dotted filters on embedded relations)
  if (filters?.from) oiQuery = oiQuery.gte('orders.created_at', filters.from)
  if (filters?.to) oiQuery = oiQuery.lte('orders.created_at', filters.to)

  const { data: orderItems, error: ordersError } = await oiQuery

  if (ordersError) {
    throw new Error(`Failed to fetch order items: ${ordersError.message}`)
  }

  const storeItemById = new Map<string, {
    id: string
    name: string
    image_url: string | null
    stock_quantity: number
    stock_type: 'quantity' | 'on_demand'
  }>()

  for (const item of storeItems || []) {
    storeItemById.set(item.id, {
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      stock_quantity: item.stock_quantity,
      stock_type: item.stock_type,
    })
  }

  const fromDt = filters?.from ? new Date(filters.from) : null
  const toDt = filters?.to ? new Date(filters.to) : null

  const monthMap = new Map<string, Map<string, { total: number; pending: number; approved: number; fulfilled: number }>>()

  for (const oi of orderItems || []) {
    const order = oi.orders as unknown as { status: string; created_at: string }
    if (!order?.created_at) continue

    const createdAt = new Date(order.created_at)
    if (Number.isNaN(createdAt.getTime())) continue

    // Safety filter (in case dotted filters aren't applied by the API)
    if (fromDt && createdAt < fromDt) continue
    if (toDt && createdAt > toDt) continue

    // Only count requests that aren't cancelled/rejected
    if (order.status === 'cancelled' || order.status === 'rejected') continue

    const monthKey = createdAt.toISOString().slice(0, 7) // YYYY-MM in UTC
    const itemId = oi.store_item_id as string
    const qty = oi.quantity as number

    let byItem = monthMap.get(monthKey)
    if (!byItem) {
      byItem = new Map()
      monthMap.set(monthKey, byItem)
    }

    let stats = byItem.get(itemId)
    if (!stats) {
      stats = { total: 0, pending: 0, approved: 0, fulfilled: 0 }
      byItem.set(itemId, stats)
    }

    stats.total += qty
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

  const result: MonthlyItemDemandStats[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, byItem]) => {
      const monthLabel = new Date(`${monthKey}-01T00:00:00Z`).toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
      })

      const stats: ItemDemandStats[] = Array.from(byItem.entries())
        .map(([itemId, s]) => {
          const item = storeItemById.get(itemId)
          return {
            item_id: itemId,
            item_name: item?.name || itemId,
            item_image_url: item?.image_url ?? null,
            stock_quantity: item?.stock_quantity ?? 0,
            stock_type: item?.stock_type ?? 'quantity',
            total_requested: s.total,
            pending_requests: s.pending,
            approved_requests: s.approved,
            fulfilled_requests: s.fulfilled,
          }
        })
        .sort((a, b) => b.total_requested - a.total_requested)

      return { month_key: monthKey, month_label: monthLabel, stats }
    })

  return result
}
