import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DioceseDetailsClient } from './DioceseDetailsClient'
import type { Diocese } from '@/lib/types/sunday-school'

export default async function DioceseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = userData?.role === 'super_admin'
  const isDioceseAdmin = userData?.role === 'diocese_admin'

  // Fetch diocese details
  const { data: diocese, error } = await supabase
    .from('dioceses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !diocese) {
    redirect('/admin/dioceses')
  }

  // Fetch churches in this diocese
  const { data: churches } = await supabase
    .from('churches')
    .select('*')
    .eq('diocese_id', id)
    .order('name')

  // Fetch diocese admins
  const { data: dioceseAdmins } = await supabase
    .from('diocese_admin_assignments')
    .select(`
      *,
      user:users(id, full_name, email, avatar_url)
    `)
    .eq('diocese_id', id)
    .eq('is_active', true)

  // Fetch all teachers and students in this diocese's churches
  const churchIds = churches?.map(c => c.id) || []

  let users = []
  if (churchIds.length > 0) {
    const { data: dioceseUsers } = await supabase
      .from('users')
      .select('*')
      .in('church_id', churchIds)
      .in('role', ['teacher', 'student'])
      .order('full_name')

    users = dioceseUsers || []
  }

  return (
    <DioceseDetailsClient
      diocese={diocese as Diocese}
      churches={churches || []}
      dioceseAdmins={dioceseAdmins || []}
      users={users}
      isSuperAdmin={isSuperAdmin}
      isDioceseAdmin={isDioceseAdmin}
    />
  )
}
