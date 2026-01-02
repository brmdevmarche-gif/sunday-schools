import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import DashboardActions from './DashboardActions'
import {
  Bus,
  ShoppingBag,
  Activity,
  BookOpen,
  Bell,
  MapPin,
  ChevronRight,
  User,
  Star,
  TrendingUp,
  Clock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const t = await getTranslations()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: initialProfile, error: profileError } = await supabase
    .from('users')
    .select(`
      *,
      churches(name, cover_image_url),
      dioceses(name)
    `)
    .eq('id', user.id)
    .single()

  let profile = initialProfile

  // If profile doesn't exist, create it (for users created before trigger was set up)
  if (!profile || profileError) {
    console.log('Creating profile for user:', user.id, user.email)
    const adminClient = createAdminClient()

    // First try to insert
    const { error: insertError } = await adminClient
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        role: 'student',
      })

    if (insertError && insertError.code !== '23505') { // 23505 = unique violation (already exists)
      console.error('Error inserting profile:', insertError.message, insertError.code)
    }

    // Now fetch the profile
    const { data: newProfile, error: fetchError } = await adminClient
      .from('users')
      .select(`
        *,
        churches(name, cover_image_url),
        dioceses(name)
      `)
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching profile after create:', fetchError.message)
      redirect('/login')
    }

    profile = newProfile
  }

  if (!profile) {
    redirect('/login')
  }

  // Get student's class if student
  let studentClass: { id: string; name: string } | null = null
  if (profile.role === 'student') {
    const { data: classData } = await supabase
      .from('class_students')
      .select(`classes(id, name)`)
      .eq('student_id', profile.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (classData?.classes) {
      studentClass = classData.classes as unknown as { id: string; name: string }
    }
  }

  // Get student's points balance
  let pointsBalance = { available_points: 0, suspended_points: 0, total_earned: 0 }
  const { data: balanceData } = await supabase
    .from('student_points_balance')
    .select('available_points, suspended_points, total_earned')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (balanceData) {
    pointsBalance = balanceData
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const navigationCards = [
    {
      title: t('studentHome.trips'),
      description: t('studentHome.tripsDescription'),
      href: '/trips',
      icon: Bus,
      color: 'bg-blue-500',
      available: true,
    },
    {
      title: t('studentHome.store'),
      description: t('studentHome.storeDescription'),
      href: '/store',
      icon: ShoppingBag,
      color: 'bg-green-500',
      available: true,
    },
    {
      title: t('studentHome.activities'),
      description: t('studentHome.activitiesDescription'),
      href: '/activities',
      icon: Activity,
      color: 'bg-purple-500',
      available: true,
    },
    {
      title: t('studentHome.announcements'),
      description: t('studentHome.announcementsDescription'),
      href: '/announcements',
      icon: Bell,
      color: 'bg-orange-500',
      available: false,
      comingSoon: true,
    },
    {
      title: t('studentHome.lessons'),
      description: t('studentHome.lessonsDescription'),
      href: '/lessons',
      icon: BookOpen,
      color: 'bg-red-500',
      available: false,
      comingSoon: true,
    },
  ]

  const churchData = profile.churches as { name: string; cover_image_url: string | null } | null
  const churchName = churchData?.name
  const churchImage = churchData?.cover_image_url

  // Default church cover image
  const defaultCoverImage = 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&h=400&fit=crop'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section with Church Cover */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-40 sm:h-48 w-full overflow-hidden relative">
          <Image
            src={churchImage || defaultCoverImage}
            alt={churchName || t('studentHome.church')}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Profile Section - overlapping cover */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-4 pb-4">
            {/* Profile Photo */}
            <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>

            {/* Name and Info */}
            <div className="flex-1 text-center sm:text-left pb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {profile.full_name || profile.username || t('studentHome.student')}
              </h1>
              {profile.user_code && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('users.userCode')}: <span className="font-mono font-medium">{profile.user_code}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-muted-foreground">
                {churchName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {churchName}
                  </span>
                )}
                {studentClass && (
                  <Badge variant="secondary" className="font-normal">
                    {studentClass.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/profile">
                  <User className="h-4 w-4 mr-1" />
                  {t('studentHome.viewAccount')}
                </Link>
              </Button>
              <DashboardActions />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Points Card */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">{t('studentHome.yourPoints')}</p>
                  <p className="text-3xl font-bold">{pointsBalance.available_points}</p>
                </div>
              </div>
              <div className="flex gap-6">
                {pointsBalance.suspended_points > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-white/70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('studentHome.suspended')}
                    </p>
                    <p className="text-lg font-semibold">{pointsBalance.suspended_points}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-white/70 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {t('studentHome.totalEarned')}
                  </p>
                  <p className="text-lg font-semibold">{pointsBalance.total_earned}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('studentHome.quickAccess')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationCards.map((card) => (
              <Link
                key={card.title}
                href={card.available ? card.href : '#'}
                className={card.available ? '' : 'cursor-not-allowed'}
              >
                <Card className={`h-full transition-all hover:shadow-md ${
                  card.available ? 'hover:scale-[1.02]' : 'opacity-60'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${card.color}`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                      {card.comingSoon && (
                        <Badge variant="secondary" className="text-xs">
                          {t('studentHome.comingSoon')}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mt-4">{card.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.description}
                    </p>
                    {card.available && (
                      <div className="flex items-center gap-1 text-sm text-primary mt-3">
                        <span>{t('studentHome.viewMore')}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
