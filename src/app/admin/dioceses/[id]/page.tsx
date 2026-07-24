import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AdminLayout from "@/components/admin/AdminLayout";
import { DioceseDetailsClient } from './DioceseDetailsClient'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'
import type { Diocese } from '@/lib/types/sunday-school'
import type { DioceseAdmin } from '@/lib/types/modules/organizational'

export const metadata: Metadata = {
  title: 'Diocese Details',
}

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
    .select('id, name, created_at, updated_at')
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
  const { data: rawDioceseAdmins } = await supabase
    .from('diocese_admins')
    .select(`
      id, diocese_id, user_id, assigned_at, assigned_by, is_active, notes, created_at, updated_at,
      user:users(id, full_name, email, avatar_url)
    `)
    .eq('diocese_id', id)
    .eq('is_active', true)

  // Normalize: Supabase may return user as array for FK joins, flatten to single object
  const dioceseAdmins = (rawDioceseAdmins || []).map((a) => ({
    ...a,
    user: Array.isArray(a.user) ? a.user[0] : a.user,
  })) as unknown as (DioceseAdmin & { user: { id: string; full_name: string; email: string; avatar_url: string | null } })[]

  // Fetch all teachers and students in this diocese's churches
  const churchIds = churches?.map(c => c.id) || []

  const { data: dioceseUsers } = churchIds.length > 0
    ? await supabase
        .from('users')
        .select('*')
        .in('church_id', churchIds)
        .in('role', ['teacher', 'student'])
        .order('full_name')
    : { data: null }

  const users = dioceseUsers || []

  return (
    <AdminLayout>
      <PageWithPermissions permission="dioceses.view_detail">
        <DioceseDetailsClient
          diocese={diocese as Diocese}
          churches={churches || []}
          dioceseAdmins={dioceseAdmins || []}
          users={users}
          isSuperAdmin={isSuperAdmin}
          isDioceseAdmin={isDioceseAdmin}
        />
      </PageWithPermissions>
    </AdminLayout>
  )
}
