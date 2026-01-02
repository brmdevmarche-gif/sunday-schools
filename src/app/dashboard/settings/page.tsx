'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Globe,
  Palette,
  Bell,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  function handleThemeChange(newTheme: string) {
    setTheme(newTheme)
    toast.success(t('settings.settingsSaved'))
  }

  const themeOptions = [
    { value: 'light', label: t('settings.light'), icon: Sun },
    { value: 'dark', label: t('settings.dark'), icon: Moon },
    { value: 'system', label: t('settings.system'), icon: Monitor },
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Language & Localization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>{t('settings.language')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.languageDescription') || 'Choose your preferred language'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher showLabel={false} />
          </CardContent>
        </Card>

        {/* Theme / Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>{t('settings.theme')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.themeDescription') || 'Customize how the app looks'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <option.icon className={`h-6 w-6 ${
                    theme === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className={`text-sm font-medium ${
                    theme === option.value ? 'text-primary' : ''
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>{t('settings.notifications')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.notificationsDescription') || 'Manage your notification preferences'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.enableNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.enableNotificationsDescription') || 'Receive notifications about trips, activities, and more'}
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  setNotificationsEnabled(checked)
                  toast.success(t('settings.settingsSaved'))
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('studentHome.account')}</CardTitle>
            <CardDescription>
              {t('settings.accountDescription') || 'Manage your account settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/profile">
                {t('nav.profile')}
              </Link>
            </Button>
            <Separator />
            <p className="text-xs text-muted-foreground">
              {t('settings.needHelp') || 'Need help?'}{' '}
              <Link href="/support" className="text-primary hover:underline">
                {t('settings.contactSupport') || 'Contact support'}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
