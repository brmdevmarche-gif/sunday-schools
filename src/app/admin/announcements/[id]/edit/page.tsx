import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import type { Class, Church, Diocese } from '@/lib/types'
import { getAnnouncementByIdAdminAction } from '../../actions'
import AnnouncementForm from '../../AnnouncementForm'

export const dynamic = 'force-dynamic'

function isoToDateTimeLocal(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export default async function AdminEditAnnouncementPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
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

  // Load announcement + scopes
  const { data: announcement } = await getAnnouncementByIdAdminAction(id)

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Edit announcement</h1>
          <p className="text-sm text-muted-foreground">Update announcement details, targeting and scope.</p>
        </div>
        <AnnouncementForm
          mode="edit"
          initial={{
            id: announcement.id,
            title: announcement.title || '',
            description: announcement.description || '',
            types: announcement.types || [],
            target_roles: announcement.target_roles || [],
            publish_from: isoToDateTimeLocal(announcement.publish_from),
            publish_to: announcement.publish_to ? isoToDateTimeLocal(announcement.publish_to) : '',
            diocese_ids: announcement.diocese_ids || [],
            church_ids: announcement.church_ids || [],
            class_ids: announcement.class_ids || [],
          }}
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



