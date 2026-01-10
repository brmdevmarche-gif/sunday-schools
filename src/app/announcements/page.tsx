import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import AnnouncementsWidget from '@/components/announcements/AnnouncementsWidget'

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const t = await getTranslations()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('studentHome.announcements')}</h1>
        </div>
        <AnnouncementsWidget />
      </div>
    </div>
  )
}



