'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { signOut } from '@/lib/auth'

export default function DashboardActions() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch {
      toast.error('Failed to log out')
    }
  }

  return (
    <Button onClick={handleSignOut} variant="outline">
      Log out
    </Button>
  )
}
