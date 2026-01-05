import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import AnnouncementsWidget from '@/components/announcements/AnnouncementsWidget'

export const dynamic = 'force-dynamic'

export default async function AdminAnnouncementsInboxPage() {
  const supabase = await createClient()
  const t = await getTranslations()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('announcements.inboxTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('announcements.inboxSubtitle')}</p>
        </div>
        <AnnouncementsWidget />
      </div>
    </AdminLayout>
  )
}


