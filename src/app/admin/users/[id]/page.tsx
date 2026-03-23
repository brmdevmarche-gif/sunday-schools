import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AdminLayout from "@/components/admin/AdminLayout";
import UserDetailsClient from './UserDetailsClient'
import { getChurchesData, getDiocesesData } from '../actions'
import { getRolesSimple } from '@/lib/sunday-school/roles-simple'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'

export const metadata: Metadata = {
  title: 'User Details',
}

async function getUserDetails(userId: string) {
  const supabase = await createClient()

  // Get user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      *,
      diocese:dioceses(id, name),
      church:churches(id, name)
    `)
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return null
  }

  // Get class assignments
  const { data: classAssignments } = await supabase
    .from('class_assignments')
    .select(`
      id,
      user_id,
      class_id,
      assignment_type,
      is_active,
      assigned_by,
      assigned_at,
      class:classes(
        id,
        name,
        grade_level,
        church:churches(name)
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)

  // Get attendance records (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: attendanceRecords } = await supabase
    .from('attendance')
    .select(`
      id,
      user_id,
      class_id,
      attendance_date,
      attendance_status,
      class:classes(name)
    `)
    .eq('user_id', userId)
    .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('attendance_date', { ascending: false })

  // Get parent-student relationships
  const { data: parentRelationships } = await supabase
    .from('user_relationships')
    .select(`
      id,
      parent_id,
      student_id,
      relationship_type,
      created_at,
      parent:users!user_relationships_parent_id_fkey(id, full_name, email),
      student:users!user_relationships_student_id_fkey(id, full_name, email)
    `)
    .or(`parent_id.eq.${userId},student_id.eq.${userId}`)

  // Get login history (last 10 logins)
  const { data: loginHistory } = await supabase
    .from('login_history')
    .select('id, user_id, success, ip_address, user_agent, device_info, location, failure_reason, created_at')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(10)

  // Get user's custom roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId)
    .limit(1) // Get the first custom role (users typically have one)

  return {
    user: {
      ...user,
      custom_role_id: userRoles?.[0]?.role_id || null,
    },
    classAssignments: classAssignments || [],
    attendanceRecords: attendanceRecords || [],
    relationships: parentRelationships || [],
    loginHistory: loginHistory || [],
  }
}

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Check if user has admin permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUser.id)
    .single()

  // Permission check will be done by PageWithPermissions

  const userDetails = await getUserDetails(id)

  if (!userDetails) {
    notFound()
  }

  // Get churches, dioceses, and roles for editing
  const [churches, dioceses, roles] = await Promise.all([
    getChurchesData(),
    getDiocesesData(),
    getRolesSimple({ isActive: true }).catch(() => []), // Fetch roles, fallback to empty array on error
  ])

  return (
    <AdminLayout>
      <PageWithPermissions permission="users.view_detail">
        <UserDetailsClient
          {...(userDetails as any)}
          currentUserRole={profile?.role ?? 'guest'}
          churches={churches}
          dioceses={dioceses}
          roles={roles}
        />
      </PageWithPermissions>
    </AdminLayout>
  )
}
