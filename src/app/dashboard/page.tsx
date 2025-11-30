import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LoginHistory from '@/components/LoginHistory'
import SecurityAlerts from '@/components/SecurityAlerts'
import DashboardActions from './DashboardActions'

export const dynamic = 'force-dynamic'

async function getUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export default async function DashboardPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <DashboardActions />
        </div>

        <SecurityAlerts />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{profile?.full_name || profile?.username || 'Welcome back!'}</CardTitle>
              <CardDescription>Your profile information</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/profile">Edit Profile</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.avatar_url && (
              <div className="flex items-center space-x-4">
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <span className="font-semibold text-sm text-muted-foreground">Email</span>
                <p>{profile?.email}</p>
              </div>

              {profile?.username && (
                <div>
                  <span className="font-semibold text-sm text-muted-foreground">Username</span>
                  <p>@{profile.username}</p>
                </div>
              )}

              {profile?.full_name && (
                <div>
                  <span className="font-semibold text-sm text-muted-foreground">Full Name</span>
                  <p>{profile.full_name}</p>
                </div>
              )}

              {profile?.bio && (
                <div>
                  <span className="font-semibold text-sm text-muted-foreground">Bio</span>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}

              <div>
                <span className="font-semibold text-sm text-muted-foreground">Account Created</span>
                <p>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div>
                <span className="font-semibold text-sm text-muted-foreground">User ID</span>
                <p className="font-mono text-xs">{profile?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Your app features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>This dashboard demonstrates:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Supabase authentication with custom profiles</li>
              <li>Row Level Security (RLS) policies</li>
              <li>Protected routes with middleware</li>
              <li>Profile management with custom fields</li>
              <li>Login history tracking and monitoring</li>
              <li>UI components from shadcn/ui</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Click &quot;Edit Profile&quot; to update your username, full name, bio, or avatar.
            </p>
          </CardContent>
        </Card>

        <LoginHistory limit={10} />
      </div>
    </div>
  )
}
