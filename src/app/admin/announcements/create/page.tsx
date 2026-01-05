import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import type { Class, Church, Diocese, ExtendedUser } from '@/lib/types'
import AnnouncementForm from '../AnnouncementForm'

export const dynamic = 'force-dynamic'

export default async function AdminCreateAnnouncementPage() {
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

  const isSuperAdmin = profile.role === 'super_admin'
  const isDioceseAdmin = profile.role === 'diocese_admin'
  const isChurchAdmin = profile.role === 'church_admin'

  const { data: dioceses } = await supabase
    .from('dioceses')
    .select('*')
    .order('name', { ascending: true })

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create announcement</h1>
          <p className="text-sm text-muted-foreground">Publish an announcement with targeting and scope.</p>
        </div>
        <AnnouncementForm
          mode="create"
          dioceses={(dioceses as Diocese[]) || []}
          churches={(churches as Church[]) || []}
          classes={(classes as Class[]) || []}
          canScope={isSuperAdmin || isDioceseAdmin || isChurchAdmin || profile.role === 'teacher'}
          successRedirectHref="/admin/announcements"
        />
      </div>
    </AdminLayout>
  )
}


