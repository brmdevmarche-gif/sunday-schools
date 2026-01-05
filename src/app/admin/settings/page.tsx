import AdminLayout from '@/components/admin/AdminLayout'
import SettingsClient from './SettingsClient'
import {
  getCurrentUserSettings,
  getBackupLogs,
  getDatabaseStats,
} from './actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile to check if super admin and get church info
  const { data: profile } = await supabase
    .from('users')
    .select('role, church_id, churches(name)')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'
  const isChurchAdmin = profile?.role === 'admin' && profile?.church_id
  const churchId = profile?.church_id
  const churchData = profile?.churches as unknown as { name: string } | null
  const churchName = churchData?.name

  // Fetch all data in parallel
  const [settings, backupLogs, databaseStats] = await Promise.all([
    getCurrentUserSettings(),
    isSuperAdmin ? getBackupLogs() : Promise.resolve([]),
    isSuperAdmin ? getDatabaseStats() : Promise.resolve(null),
  ])

  return (
    <AdminLayout>
      <SettingsClient
        initialSettings={settings}
        backupLogs={backupLogs}
        databaseStats={databaseStats}
        isSuperAdmin={isSuperAdmin}
        isChurchAdmin={!!isChurchAdmin}
        churchId={churchId || undefined}
        churchName={churchName || undefined}
      />
    </AdminLayout>
  )
}
