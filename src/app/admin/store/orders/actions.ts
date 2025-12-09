'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type OrderStatus = 'pending' | 'approved' | 'fulfilled' | 'cancelled' | 'rejected'
export type PriceTier = 'normal' | 'mastor' | 'botl'

export interface CreateOrderInput {
  items: {
    store_item_id: string
    quantity: number
    price_tier: PriceTier
  }[]
  notes?: string
  class_id?: string
}

export interface UpdateOrderStatusInput {
  order_id: string
  status: OrderStatus
  admin_notes?: string
}

/**
 * Create a new order
 */
export async function createOrderAction(input: CreateOrderInput) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client to bypass RLS for complex operations
  const adminClient = createAdminClient()

  // Fetch store items to get prices and validate
  const storeItemIds = input.items.map(item => item.store_item_id)
  const { data: storeItems, error: itemsError } = await adminClient
    .from('store_items')
    .select('*')
    .in('id', storeItemIds)

  if (itemsError || !storeItems || storeItems.length !== input.items.length) {
    throw new Error('Some store items not found')
  }

  // Calculate total and prepare order items
  let totalPoints = 0
  const orderItems = input.items.map(item => {
    const storeItem = storeItems.find(si => si.id === item.store_item_id)!

    // Get price based on tier
    let unitPrice: number
    switch (item.price_tier) {
      case 'mastor':
        unitPrice = storeItem.price_mastor
        break
      case 'botl':
        unitPrice = storeItem.price_botl
        break
      default:
        unitPrice = storeItem.price_normal
    }

    const totalPrice = unitPrice * item.quantity
    totalPoints += totalPrice

    return {
      store_item_id: storeItem.id,
      item_name: storeItem.name,
      item_description: storeItem.description,
      item_image_url: storeItem.image_url,
      quantity: item.quantity,
      price_tier: item.price_tier,
      unit_price: unitPrice,
      total_price: totalPrice,
    }
  })

  // Create the order
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      user_id: user.id,
      class_id: input.class_id || null,
      status: 'pending',
      total_points: totalPoints,
      notes: input.notes || null,
    })
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`)
  }

  // Add order items
  const orderItemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id,
  }))

  const { error: itemsInsertError } = await adminClient
    .from('order_items')
    .insert(orderItemsWithOrderId)

  if (itemsInsertError) {
    // Rollback: delete the order
    await adminClient.from('orders').delete().eq('id', order.id)
    throw new Error(`Failed to create order items: ${itemsInsertError.message}`)
  }

  revalidatePath('/store')
  revalidatePath('/admin/store/orders')
  return { success: true, order_id: order.id }
}

/**
 * Get orders for current user
 */
export async function getMyOrdersAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client to ensure we get all data
  const adminClient = createAdminClient()

  const { data: orders, error } = await adminClient
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        store_items (
          id,
          name,
          image_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return { success: true, data: orders || [] }
}

/**
 * Get all orders (admin)
 */
export async function getAllOrdersAction(filters?: {
  status?: OrderStatus
  user_id?: string
  church_id?: string
  diocese_id?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role, church_id, diocese_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  // Use admin client for complex queries
  const adminClient = createAdminClient()

  let query = adminClient
    .from('orders')
    .select(`
      *,
      users!user_id (
        id,
        full_name,
        email,
        church_id,
        diocese_id
      ),
      order_items (
        *,
        store_items (
          id,
          name,
          image_url
        )
      )
    `)

  // Apply filters based on user role
  if (profile.role === 'church_admin' && profile.church_id) {
    // Church admin can only see orders from their church
    const { data: churchUsers } = await adminClient
      .from('users')
      .select('id')
      .eq('church_id', profile.church_id)

    const userIds = churchUsers?.map(u => u.id) || []
    if (userIds.length === 0) {
      // No users in this church, return empty result
      return {
        success: true,
        data: []
      }
    }
    query = query.in('user_id', userIds)
  } else if (profile.role === 'diocese_admin' && profile.diocese_id) {
    // Diocese admin can only see orders from their diocese
    const { data: dioceseUsers } = await adminClient
      .from('users')
      .select('id')
      .eq('diocese_id', profile.diocese_id)

    const userIds = dioceseUsers?.map(u => u.id) || []
    if (userIds.length === 0) {
      // No users in this diocese, return empty result
      return {
        success: true,
        data: []
      }
    }
    query = query.in('user_id', userIds)
  }

  // Apply additional filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  query = query.order('created_at', { ascending: false })

  const { data: orders, error } = await query

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return { success: true, data: orders || [] }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatusAction(input: UpdateOrderStatusInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role, church_id, diocese_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  // Use admin client
  const adminClient = createAdminClient()

  // Get the order to verify permissions
  const { data: order } = await adminClient
    .from('orders')
    .select('*, users!user_id(church_id, diocese_id)')
    .eq('id', input.order_id)
    .single()

  if (!order) {
    throw new Error('Order not found')
  }

  // Verify admin has permission to update this order
  const orderUser = Array.isArray(order.users) ? order.users[0] : order.users;
  if (profile.role === 'church_admin' && orderUser?.church_id !== profile.church_id) {
    throw new Error('Unauthorized: Order is from a different church')
  }

  if (profile.role === 'diocese_admin' && orderUser?.diocese_id !== profile.diocese_id) {
    throw new Error('Unauthorized: Order is from a different diocese')
  }

  // Update the order
  const { error } = await adminClient
    .from('orders')
    .update({
      status: input.status,
      admin_notes: input.admin_notes || null,
      processed_by: user.id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', input.order_id)

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`)
  }

  revalidatePath('/admin/store/orders')
  return { success: true }
}

/**
 * Bulk update order status (admin only)
 */
export async function bulkUpdateOrderStatusAction(
  order_ids: string[],
  status: OrderStatus,
  admin_notes?: string
) {
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

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  // Update all orders
  const results = await Promise.allSettled(
    order_ids.map(order_id =>
      updateOrderStatusAction({ order_id, status, admin_notes })
    )
  )

  const successCount = results.filter(r => r.status === 'fulfilled').length
  const failedCount = results.filter(r => r.status === 'rejected').length

  revalidatePath('/admin/store/orders')
  return { success: true, successCount, failedCount }
}

/**
 * Cancel order (user can cancel their own pending orders)
 */
export async function cancelOrderAction(order_id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Use admin client
  const adminClient = createAdminClient()

  // Get the order to verify ownership and status
  const { data: order } = await adminClient
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single()

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.user_id !== user.id) {
    throw new Error('Unauthorized: Not your order')
  }

  if (order.status !== 'pending') {
    throw new Error('Can only cancel pending orders')
  }

  // Update to cancelled
  const { error } = await adminClient
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', order_id)

  if (error) {
    throw new Error(`Failed to cancel order: ${error.message}`)
  }

  revalidatePath('/store')
  return { success: true }
}

/**
 * Get order details
 */
export async function getOrderDetailsAction(order_id: string) {
  const adminClient = createAdminClient()

  const { data: order, error } = await adminClient
    .from('orders')
    .select(`
      *,
      users!user_id (
        id,
        full_name,
        email,
        phone
      ),
      order_items (
        *,
        store_items (
          id,
          name,
          description,
          image_url
        )
      )
    `)
    .eq('id', order_id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch order details: ${error.message}`)
  }

  return { success: true, data: order }
}
