import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import AnnouncementsWidget from '@/components/announcements/AnnouncementsWidget'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Announcement Inbox',
}

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
  // Permission check will be done by PageWithPermissions

  return (
    <AdminLayout>
      <PageWithPermissions permission="announcements.view_inbox">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t('announcements.inboxTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('announcements.inboxSubtitle')}</p>
          </div>
          <AnnouncementsWidget />
        </div>
      </PageWithPermissions>
    </AdminLayout>
  )
}


