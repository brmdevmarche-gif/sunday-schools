import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import type { Class, Church, Diocese, ExtendedUser } from '@/lib/types'
import { getAnnouncementsAdminAction } from './actions'
import AnnouncementsClient from './AnnouncementsClient'

export const dynamic = 'force-dynamic'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch announcements (admin action uses admin client)
  const { data: announcements, schemaMissing } = await getAnnouncementsAdminAction()

  const isSuperAdmin = profile.role === 'super_admin'
  const isDioceseAdmin = profile.role === 'diocese_admin'
  const isChurchAdmin = profile.role === 'church_admin'

  // Dioceses
  const { data: dioceses } = await supabase
    .from('dioceses')
    .select('*')
    .order('name', { ascending: true })

  // Churches (scoped)
  let churchesQuery = supabase
    .from('churches')
    .select('*')
    .order('name', { ascending: true })

  if (isDioceseAdmin && profile.diocese_id) {
    churchesQuery = churchesQuery.eq('diocese_id', profile.diocese_id)
  } else if (isChurchAdmin && profile.church_id) {
    churchesQuery = churchesQuery.eq('id', profile.church_id)
  }

  const { data: churches } = await churchesQuery

  // Classes (scoped)
  let classesQuery = supabase
    .from('classes')
    .select('*')
    .order('name', { ascending: true })

  if (isChurchAdmin && profile.church_id) {
    classesQuery = classesQuery.eq('church_id', profile.church_id)
  }

  const { data: classes } = await classesQuery

  return (
    <AdminLayout>
      <AnnouncementsClient
        initialAnnouncements={announcements as any}
        dioceses={(dioceses as Diocese[]) || []}
        churches={(churches as Church[]) || []}
        classes={(classes as Class[]) || []}
        userProfile={profile as ExtendedUser}
        canScope={isSuperAdmin || isDioceseAdmin || isChurchAdmin || profile.role === 'teacher'}
        schemaMissing={!!schemaMissing}
      />
    </AdminLayout>
  )
}


