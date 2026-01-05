import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import AnnouncementsWidget from '@/components/announcements/AnnouncementsWidget'

export const dynamic = 'force-dynamic'

export default async function AdminAnnouncementsInboxPage() {
  const supabase = await createClient()

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
          <h1 className="text-2xl font-bold">Announcements Inbox</h1>
          <p className="text-sm text-muted-foreground">Unread announcements for your account.</p>
        </div>
        <AnnouncementsWidget />
      </div>
    </AdminLayout>
  )
}


