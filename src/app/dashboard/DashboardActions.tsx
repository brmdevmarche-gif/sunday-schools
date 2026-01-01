'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { signOut } from '@/lib/auth'
import { LogOut } from 'lucide-react'

export default function DashboardActions() {
  const router = useRouter()
  const t = useTranslations()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success(t('studentHome.logoutSuccess'))
      router.push('/login')
    } catch {
      toast.error(t('studentHome.logoutFailed'))
    }
  }

  return (
    <Button onClick={handleSignOut} variant="outline" size="sm">
      <LogOut className="h-4 w-4 mr-1" />
      {t('studentHome.logout')}
    </Button>
  )
}
