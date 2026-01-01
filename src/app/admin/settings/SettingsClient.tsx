'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Globe,
  Palette,
  Calendar,
  Clock,
  Bell,
  Database,
  Download,
  AlertCircle,
  CheckCircle2,
  Coins
} from 'lucide-react'
import { updateUserSettings, createBackupLog, type UserSettings, type BackupLog } from './actions'
import ChurchPointsConfig from '@/components/ChurchPointsConfig'

interface SettingsClientProps {
  initialSettings: UserSettings | null
  backupLogs: BackupLog[]
  databaseStats: {
    users: number
    dioceses: number
    churches: number
    classes: number
    lastBackup: string | null
  } | null
  isSuperAdmin: boolean
  isChurchAdmin: boolean
  churchId?: string
  churchName?: string
}

export default function SettingsClient({
  initialSettings,
  backupLogs,
  databaseStats,
  isSuperAdmin,
  isChurchAdmin,
  churchId,
  churchName,
}: SettingsClientProps) {
  const router = useRouter()
  const t = useTranslations()
  const [, startTransition] = useTransition()
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const { theme, setTheme } = useTheme()

  const [settings, setSettings] = useState<Partial<UserSettings>>(
    initialSettings || {
      language: 'en',
      theme: 'system',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      timezone: 'UTC',
      notifications_enabled: true,
      email_notifications: true,
    }
  )

  // Sync theme from database settings to next-themes on mount
  useEffect(() => {
    if (initialSettings?.theme && theme !== initialSettings.theme) {
      setTheme(initialSettings.theme)
    }
  }, [initialSettings?.theme, theme, setTheme])

  async function handleSaveSettings() {
    try {
      await updateUserSettings(settings)
      toast.success(t('settings.settingsSaved'))
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(t('settings.saveFailed'))
    }
  }

  async function handleLanguageChange(newLocale: string) {
    // Update settings state
    const updatedSettings = { ...settings, language: newLocale as UserSettings['language'] }
    setSettings(updatedSettings)

    // Save to database immediately
    try {
      await updateUserSettings({ language: newLocale as UserSettings['language'] })
    } catch (error) {
      console.error('Error saving language setting:', error)
    }
  }

  async function handleThemeChange(newTheme: UserSettings['theme']) {
    // Update settings state
    setSettings({ ...settings, theme: newTheme })

    // Apply theme immediately
    setTheme(newTheme)

    // Save to database immediately
    try {
      await updateUserSettings({ theme: newTheme })
      toast.success(t('settings.settingsSaved'))
    } catch (error) {
      console.error('Error saving theme setting:', error)
      toast.error(t('settings.saveFailed'))
    }
  }

  async function handleCreateBackup() {
    setIsCreatingBackup(true)
    try {
      await createBackupLog('manual')
      toast.success(t('settings.backupCreated'))
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error(t('settings.backupFailed'))
    } finally {
      setIsCreatingBackup(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString()
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language & Localization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>{t('settings.preferences')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('settings.language')}</Label>
              <LanguageSwitcher showLabel={false} onLanguageChange={handleLanguageChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t('settings.timezone')}</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings({ ...settings, timezone: value })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>{t('settings.theme')}</CardTitle>
          </div>
          <CardDescription>{t('settings.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme">{t('settings.theme')}</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => handleThemeChange(value as UserSettings['theme'])}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('settings.light')}</SelectItem>
                <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                <SelectItem value="system">{t('settings.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Format */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>{t('settings.dateFormat')}</CardTitle>
          </div>
          <CardDescription>{t('settings.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_format">{t('settings.dateFormat')}</Label>
              <Select
                value={settings.date_format}
                onValueChange={(value) =>
                  setSettings({ ...settings, date_format: value as UserSettings['date_format'] })
                }
              >
                <SelectTrigger id="date_format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (European)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_format">{t('settings.timeFormat')}</Label>
              <Select
                value={settings.time_format}
                onValueChange={(value) =>
                  setSettings({ ...settings, time_format: value as UserSettings['time_format'] })
                }
              >
                <SelectTrigger id="time_format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">{t('settings.12hour')}</SelectItem>
                  <SelectItem value="24h">{t('settings.24hour')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>{t('settings.notifications')}</CardTitle>
          </div>
          <CardDescription>{t('settings.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.enableNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.enableNotifications')}
              </p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifications_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.emailNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.enableEmailNotifications')}
              </p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_notifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          {t('common.save')}
        </Button>
      </div>

      {/* Church Points Configuration (Church Admins Only) */}
      {(isChurchAdmin || isSuperAdmin) && churchId && (
        <ChurchPointsConfig churchId={churchId} churchName={churchName} />
      )}

      {/* Data Backup Section (Super Admin Only) */}
      {isSuperAdmin && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>{t('settings.databaseBackup')}</CardTitle>
              </div>
              <CardDescription>{t('settings.backupSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {databaseStats && (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('settings.totalUsers')}</p>
                    <p className="text-2xl font-bold">{databaseStats.users}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('settings.totalDioceses')}</p>
                    <p className="text-2xl font-bold">{databaseStats.dioceses}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('settings.totalChurches')}</p>
                    <p className="text-2xl font-bold">{databaseStats.churches}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('settings.totalClasses')}</p>
                    <p className="text-2xl font-bold">{databaseStats.classes}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
                  <Download className="mr-2 h-4 w-4" />
                  {isCreatingBackup ? t('common.loading') : t('settings.createBackup')}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {t('settings.backupSubtitle')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.backupHistory')}</CardTitle>
              <CardDescription>{t('settings.backupSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {backupLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('settings.noBackups')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('settings.backupType')}</TableHead>
                      <TableHead>{t('settings.backupStatus')}</TableHead>
                      <TableHead>{t('settings.createdAt')}</TableHead>
                      <TableHead>{t('settings.fileSize')}</TableHead>
                      <TableHead>{t('settings.createdBy')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.backup_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.backup_status === 'completed' ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('settings.completed')}
                            </Badge>
                          ) : log.backup_status === 'failed' ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {t('settings.failed')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t('settings.processing')}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(log.created_at)}</TableCell>
                        <TableCell>{formatFileSize(log.file_size_bytes)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.file_path || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
