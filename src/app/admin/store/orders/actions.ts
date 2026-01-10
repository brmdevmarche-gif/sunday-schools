'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  suspendPointsForOrderAction,
  confirmOrderPointsDeductionAction,
  returnSuspendedPointsAction,
  getStudentPointsBalanceAction,
} from '@/app/admin/points/actions'

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
  /** For parent ordering: the child's user ID */
  for_student_id?: string
}

export interface UpdateOrderStatusInput {
  order_id: string
  status: OrderStatus
  admin_notes?: string
}

function getEffectiveUnitPrice(
  storeItem: any,
  tier: PriceTier,
  now: Date
): number {
  const specialPrice: number | null | undefined = storeItem?.special_price
  const startRaw: string | null | undefined = storeItem?.special_price_start_at
  const endRaw: string | null | undefined = storeItem?.special_price_end_at

  // Special offer is active only when all are present and within window
  if (specialPrice != null && startRaw && endRaw) {
    const start = new Date(startRaw)
    const end = new Date(endRaw)
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (now >= start && now <= end) {
        return specialPrice
      }
    }
  }

  switch (tier) {
    case 'mastor':
      return storeItem.price_mastor
    case 'botl':
      return storeItem.price_botl
    default:
      return storeItem.price_normal
  }
}

/**
 * Create a new order
 * Supports both regular orders and parent ordering for children
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

  // Determine if this is a parent ordering for a child
  let orderForUserId = user.id
  let orderedByParentId: string | null = null

  if (input.for_student_id) {
    // Get current user's profile to check if they're a parent
    const { data: currentUserProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUserProfile?.role !== 'parent') {
      throw new Error('Only parents can order for children')
    }

    // Verify parent has an active relationship with this child
    const { data: relationship } = await adminClient
      .from('user_relationships')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', input.for_student_id)
      .eq('is_active', true)
      .single()

    if (!relationship) {
      throw new Error('You do not have permission to order for this child')
    }

    orderForUserId = input.for_student_id
    orderedByParentId = user.id
  }

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
  const now = new Date()
  const orderItems = input.items.map(item => {
    const storeItem = storeItems.find(si => si.id === item.store_item_id)!

    // Get effective price (special offer overrides tier pricing during its window)
    const unitPrice = getEffectiveUnitPrice(storeItem, item.price_tier, now)

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

  // Check if the user (or child) has enough points
  const balance = await getStudentPointsBalanceAction(orderForUserId)
  if (!balance || balance.available_points < totalPoints) {
    throw new Error(`Insufficient points. Available: ${balance?.available_points || 0}, Required: ${totalPoints}`)
  }

  // Create the order
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      user_id: orderForUserId,
      class_id: input.class_id || null,
      status: 'pending',
      total_points: totalPoints,
      notes: orderedByParentId
        ? `[Ordered by parent] ${input.notes || ''}`
        : (input.notes || null),
      ordered_by_parent_id: orderedByParentId,
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

  // Suspend points for this order (from the child's balance)
  try {
    await suspendPointsForOrderAction(orderForUserId, totalPoints, order.id)
  } catch (pointsError) {
    // Rollback: delete the order and items
    await adminClient.from('orders').delete().eq('id', order.id)
    throw new Error(`Failed to suspend points: ${pointsError instanceof Error ? pointsError.message : 'Unknown error'}`)
  }

  revalidatePath('/store')
  revalidatePath('/admin/store/orders')
  revalidatePath('/dashboard/parents')
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
  from?: string
  to?: string
  page?: number
  pageSize?: number
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
        user_code,
        church_id,
        diocese_id
      ),
      parent:users!ordered_by_parent_id (
        id,
        full_name,
        email
      ),
      order_items (
        *,
        store_items (
          id,
          name,
          image_url
        )
      )
    `, { count: 'exact' })

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

  // Date/time range filter
  if (filters?.from) {
    query = query.gte('created_at', filters.from)
  }
  if (filters?.to) {
    query = query.lte('created_at', filters.to)
  }

  const pageSize = Math.max(1, Math.min(100, filters?.pageSize ?? 25))
  const page = Math.max(1, filters?.page ?? 1)
  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1

  query = query
    .order('created_at', { ascending: false })
    .range(fromIdx, toIdx)

  const { data: orders, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return { success: true, data: orders || [], count: count ?? 0, page, pageSize }
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

  // Handle points based on status change
  const previousStatus = order.status
  const newStatus = input.status

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

  // Handle points based on status transition
  try {
    if (previousStatus === 'pending') {
      if (newStatus === 'approved' || newStatus === 'fulfilled') {
        // Confirm points deduction (move from suspended to used)
        await confirmOrderPointsDeductionAction(order.user_id, order.total_points, order.id)
      } else if (newStatus === 'rejected') {
        // Return suspended points
        await returnSuspendedPointsAction(order.user_id, order.total_points, order.id, 'rejected')
      } else if (newStatus === 'cancelled') {
        // Return suspended points
        await returnSuspendedPointsAction(order.user_id, order.total_points, order.id, 'cancelled')
      }
    }
  } catch (pointsError) {
    console.error('Points operation failed:', pointsError)
    // Don't fail the order update, but log the error
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

  // Return suspended points
  try {
    await returnSuspendedPointsAction(user.id, order.total_points, order_id, 'cancelled')
  } catch (pointsError) {
    console.error('Failed to return points:', pointsError)
    // Don't fail the cancellation, but log the error
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
        phone,
        user_code
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

/**
 * Create order for a student (admin action)
 */
export interface CreateOrderForStudentInput {
  student_id: string
  items: {
    store_item_id: string
    quantity: number
  }[]
  notes?: string
}

export async function createOrderForStudentAction(input: CreateOrderForStudentInput) {
  const supabase = await createClient()

  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: adminProfile } = await supabase
    .from('users')
    .select('role, church_id, diocese_id')
    .eq('id', user.id)
    .single()

  if (!adminProfile || !['super_admin', 'diocese_admin', 'church_admin'].includes(adminProfile.role)) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Use admin client
  const adminClient = createAdminClient()

  // Get the student's profile to determine their price tier
  const { data: studentProfile, error: studentError } = await adminClient
    .from('users')
    .select('id, full_name, email, price_tier, church_id, diocese_id')
    .eq('id', input.student_id)
    .single()

  if (studentError || !studentProfile) {
    throw new Error('Student not found')
  }

  // Verify admin has permission for this student
  if (adminProfile.role === 'church_admin' && studentProfile.church_id !== adminProfile.church_id) {
    throw new Error('Unauthorized: Student is from a different church')
  }
  if (adminProfile.role === 'diocese_admin' && studentProfile.diocese_id !== adminProfile.diocese_id) {
    throw new Error('Unauthorized: Student is from a different diocese')
  }

  // Fetch store items to get prices and validate
  const storeItemIds = input.items.map(item => item.store_item_id)
  const { data: storeItems, error: itemsError } = await adminClient
    .from('store_items')
    .select('*')
    .in('id', storeItemIds)

  if (itemsError || !storeItems || storeItems.length !== input.items.length) {
    throw new Error('Some store items not found')
  }

  // Determine price tier for the student
  const priceTier = studentProfile.price_tier || 'normal'

  // Calculate total and prepare order items
  let totalPoints = 0
  const now = new Date()
  const orderItems = input.items.map(item => {
    const storeItem = storeItems.find(si => si.id === item.store_item_id)!

    // Get effective price (special offer overrides tier pricing during its window)
    const unitPrice = getEffectiveUnitPrice(storeItem, priceTier, now)

    const totalPrice = unitPrice * item.quantity
    totalPoints += totalPrice

    return {
      store_item_id: storeItem.id,
      item_name: storeItem.name,
      item_description: storeItem.description,
      item_image_url: storeItem.image_url,
      quantity: item.quantity,
      price_tier: priceTier,
      unit_price: unitPrice,
      total_price: totalPrice,
    }
  })

  // Check if student has enough points
  const balance = await getStudentPointsBalanceAction(input.student_id)
  if (!balance || balance.available_points < totalPoints) {
    throw new Error(`Insufficient points. Available: ${balance?.available_points || 0}, Required: ${totalPoints}`)
  }

  // Get student's class assignment (if any)
  const { data: classAssignment } = await adminClient
    .from('class_assignments')
    .select('class_id')
    .eq('user_id', input.student_id)
    .eq('assignment_type', 'student')
    .eq('is_active', true)
    .limit(1)
    .single()

  // Create the order
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      user_id: input.student_id,
      class_id: classAssignment?.class_id || null,
      status: 'pending',
      total_points: totalPoints,
      notes: input.notes ? `[Created by admin] ${input.notes}` : '[Created by admin]',
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

  // Suspend points for this order
  try {
    await suspendPointsForOrderAction(input.student_id, totalPoints, order.id)
  } catch (pointsError) {
    // Rollback: delete the order and items
    await adminClient.from('orders').delete().eq('id', order.id)
    throw new Error(`Failed to suspend points: ${pointsError instanceof Error ? pointsError.message : 'Unknown error'}`)
  }

  revalidatePath('/admin/store/orders')
  return { success: true, order_id: order.id, total_points: totalPoints }
}

/**
 * Search students for creating orders
 */
export async function searchStudentsForOrderAction(query: string) {
  const supabase = await createClient()

  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin
  const { data: adminProfile } = await supabase
    .from('users')
    .select('role, church_id, diocese_id')
    .eq('id', user.id)
    .single()

  if (!adminProfile || !['super_admin', 'diocese_admin', 'church_admin'].includes(adminProfile.role)) {
    throw new Error('Unauthorized')
  }

  const adminClient = createAdminClient()

  let studentsQuery = adminClient
    .from('users')
    .select('id, full_name, email, user_code, price_tier, church_id, diocese_id')
    .eq('role', 'student')
    .limit(20)

  // Apply scope restrictions
  if (adminProfile.role === 'church_admin' && adminProfile.church_id) {
    studentsQuery = studentsQuery.eq('church_id', adminProfile.church_id)
  } else if (adminProfile.role === 'diocese_admin' && adminProfile.diocese_id) {
    studentsQuery = studentsQuery.eq('diocese_id', adminProfile.diocese_id)
  }

  // Apply search filter
  if (query) {
    studentsQuery = studentsQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,user_code.ilike.%${query}%`)
  }

  const { data: students, error } = await studentsQuery.order('full_name')

  if (error) {
    throw new Error(`Failed to search students: ${error.message}`)
  }

  return { success: true, data: students || [] }
}
