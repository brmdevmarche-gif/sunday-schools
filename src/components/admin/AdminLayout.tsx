'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import AdminSidebar from './AdminSidebar'
import { getCurrentUserProfile } from '@/lib/sunday-school/users'
import { getNavigationItems, canAccessAdminPanel } from '@/lib/sunday-school/permissions'
import { signOut } from '@/lib/auth'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: string
}

interface UserProfile {
  role: string
  full_name?: string | null
  email: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const t = useTranslations()
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      try {
        // Check if user can access admin panel
        const hasAccess = await canAccessAdminPanel()
        if (!hasAccess) {
          toast.error(t('errors.notAuthorized'))
          router.push('/dashboard')
          return
        }

        // Load user profile and navigation items
        const [profile, items] = await Promise.all([
          getCurrentUserProfile(),
          getNavigationItems()
        ])

        setUserProfile(profile)
        setNavItems(items)
      } catch (error) {
        console.error('Error loading admin layout:', error)
        toast.error(t('errors.serverError'))
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success(t('nav.logout'))
      router.push('/login')
    } catch {
      toast.error(t('errors.serverError'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <AdminSidebar
          items={navItems}
          userRole={userProfile?.role}
          userName={userProfile?.full_name || userProfile?.email}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <VisuallyHidden>
            <SheetTitle>{t('nav.dashboard')}</SheetTitle>
          </VisuallyHidden>
          <AdminSidebar
            items={navItems}
            userRole={userProfile?.role}
            userName={userProfile?.full_name || userProfile?.email}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
