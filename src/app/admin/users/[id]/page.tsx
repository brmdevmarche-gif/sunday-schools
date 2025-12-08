import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import UserDetailsClient from './UserDetailsClient'
import { getTranslations } from 'next-intl/server'
import { getChurchesData, getDiocesesData } from '../actions'

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
      *,
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
      *,
      class:classes(name)
    `)
    .eq('user_id', userId)
    .gte('attendance_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('attendance_date', { ascending: false })

  // Get parent-student relationships
  const { data: parentRelationships } = await supabase
    .from('user_relationships')
    .select(`
      *,
      parent:users!user_relationships_parent_id_fkey(id, full_name, email),
      student:users!user_relationships_student_id_fkey(id, full_name, email)
    `)
    .or(`parent_id.eq.${userId},student_id.eq.${userId}`)

  // Get login history (last 10 logins)
  const { data: loginHistory } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(10)

  return {
    user,
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
  const t = await getTranslations()
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

  if (!profile || !['super_admin', 'diocese_admin', 'church_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const userDetails = await getUserDetails(id)

  if (!userDetails) {
    notFound()
  }

  // Get churches and dioceses for editing
  const [churches, dioceses] = await Promise.all([
    getChurchesData(),
    getDiocesesData(),
  ])

  return (
    <UserDetailsClient
      {...userDetails}
      currentUserRole={profile.role}
      churches={churches}
      dioceses={dioceses}
    />
  )
}
