'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLocale, useTranslations } from 'next-intl'
import type { AnnouncementTargetRole, Class, Church, CreateAnnouncementInput, Diocese, ExtendedUser, UpdateAnnouncementInput } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createAnnouncementAction, deactivateAnnouncementAction, getAnnouncementTypesAction, republishAnnouncementAction, updateAnnouncementAction } from './actions'

type AnnouncementRow = {
  id: string
  title: string
  description: string | null
  types: string[]
  target_roles: AnnouncementTargetRole[]
  publish_from: string
  publish_to: string | null
  is_deleted: boolean
  deactivated_reason?: string | null
  created_at: string
  updated_at: string
  diocese_ids?: string[]
  church_ids?: string[]
  class_ids?: string[]
}

function isoToDateTimeLocal(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function dateTimeLocalToIso(v: string) {
  if (!v) return new Date().toISOString()
  const d = new Date(v)
  return d.toISOString()
}

function endOfCurrentMonthIso(fromIso: string) {
  const from = new Date(fromIso)
  const end = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999)
  return end.toISOString()
}

function computeStatus(a: AnnouncementRow) {
  if (a.is_deleted) return 'deleted'
  const now = Date.now()
  const from = new Date(a.publish_from).getTime()
  const to = a.publish_to ? new Date(a.publish_to).getTime() : null
  if (now < from) return 'scheduled'
  if (to && now > to) return 'expired'
  return 'active'
}

const ALL_ROLES: { role: AnnouncementTargetRole }[] = [
  { role: 'student' },
  { role: 'parent' },
  { role: 'teacher' },
  { role: 'church_admin' },
  { role: 'diocese_admin' },
  { role: 'super_admin' },
]

export default function AnnouncementsClient(props: {
  initialAnnouncements: AnnouncementRow[]
  dioceses: Diocese[]
  churches: Church[]
  classes: Class[]
  userProfile: ExtendedUser
  canScope: boolean
  schemaMissing: boolean
}) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>(props.initialAnnouncements || [])
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'deleted'>('all')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState<AnnouncementRow | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTarget, setDetailsTarget] = useState<AnnouncementRow | null>(null)

  const [republishOpen, setRepublishOpen] = useState(false)
  const [republishTarget, setRepublishTarget] = useState<AnnouncementRow | null>(null)
  const [republishFrom, setRepublishFrom] = useState<string>(isoToDateTimeLocal(new Date().toISOString()))
  const [republishTo, setRepublishTo] = useState<string>('')
  const [republishing, setRepublishing] = useState(false)

  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [typeInput, setTypeInput] = useState('')
  const [targetRoles, setTargetRoles] = useState<AnnouncementTargetRole[]>(['student', 'parent'])
  const [publishFrom, setPublishFrom] = useState<string>(isoToDateTimeLocal(new Date().toISOString()))
  const [publishTo, setPublishTo] = useState<string>('')
  const [dioceseIds, setDioceseIds] = useState<string[]>([])
  const [churchIds, setChurchIds] = useState<string[]>([])
  const [classIds, setClassIds] = useState<string[]>([])

  useEffect(() => {
    setAnnouncements(props.initialAnnouncements || [])
  }, [props.initialAnnouncements])

  const displayedAnnouncements = useMemo(() => {
    if (statusTab === 'all') return announcements
    return announcements.filter(a => computeStatus(a) === statusTab)
  }, [announcements, statusTab])

  const resetForm = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setTypes([])
    setTypeInput('')
    setTargetRoles(['student', 'parent'])
    setPublishFrom(isoToDateTimeLocal(new Date().toISOString()))
    setPublishTo('')
    setDioceseIds([])
    setChurchIds([])
    setClassIds([])
  }

  useEffect(() => {
    async function loadTypeSuggestions() {
      if (!open) return
      try {
        const res = await getAnnouncementTypesAction()
        setTypeSuggestions(res.data || [])
      } catch {
        setTypeSuggestions([])
      }
    }

    loadTypeSuggestions()
  }, [open])

  const openEdit = (a: AnnouncementRow) => {
    setEditing(a)
    setTitle(a.title || '')
    setDescription(a.description || '')
    setTypes(a.types || [])
    setTypeInput('')
    setTargetRoles((a.target_roles || []) as AnnouncementTargetRole[])
    setPublishFrom(isoToDateTimeLocal(a.publish_from))
    setPublishTo(a.publish_to ? isoToDateTimeLocal(a.publish_to) : '')
    setDioceseIds(a.diocese_ids || [])
    setChurchIds(a.church_ids || [])
    setClassIds(a.class_ids || [])
    setOpen(true)
  }

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id]

  const toggleRole = (role: AnnouncementTargetRole) => {
    setTargetRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]))
  }

  const addType = (raw: string) => {
    const cleaned = raw.trim()
    if (!cleaned) return
    setTypes(prev => (prev.includes(cleaned) ? prev : [...prev, cleaned]))
    setTypeInput('')
  }

  const save = async () => {
    // Creation is handled on /admin/announcements/create
    if (!editing) {
      toast.error('Use the Create page to create a new announcement')
      return
    }
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!targetRoles.length) {
      toast.error('Select at least one role')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const payload: UpdateAnnouncementInput = {
          id: editing.id,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          types,
          target_roles: targetRoles,
          publish_from: dateTimeLocalToIso(publishFrom),
          publish_to: publishTo ? dateTimeLocalToIso(publishTo) : null,
          diocese_ids: dioceseIds,
          church_ids: churchIds,
          class_ids: classIds,
        }
        await updateAnnouncementAction(payload)
        toast.success('Announcement updated')
      } else {
        const payload: CreateAnnouncementInput = {
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          types,
          target_roles: targetRoles,
          publish_from: dateTimeLocalToIso(publishFrom),
          publish_to: publishTo ? dateTimeLocalToIso(publishTo) : null,
          diocese_ids: dioceseIds,
          church_ids: churchIds,
          class_ids: classIds,
        }
        await createAnnouncementAction(payload)
        toast.success('Announcement created')
      }

      // soft refresh (server will revalidate, but client list should reflect quickly)
      // ensure UI updates immediately
      router.refresh()
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const openDeactivate = (a: AnnouncementRow) => {
    setDeactivateTarget(a)
    setDeactivateReason('')
    setDeactivateOpen(true)
  }

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return
    setDeactivating(true)
    try {
      await deactivateAnnouncementAction(deactivateTarget.id, deactivateReason || '')
      toast.success('Deactivated')
      router.refresh()
      setDeactivateOpen(false)
      setDeactivateTarget(null)
      setDeactivateReason('')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to deactivate')
    } finally {
      setDeactivating(false)
    }
  }

  const openRepublish = (a: AnnouncementRow) => {
    setRepublishTarget(a)
    const nowLocal = isoToDateTimeLocal(new Date().toISOString())
    setRepublishFrom(nowLocal)
    setRepublishTo(isoToDateTimeLocal(computeRepublishToIso(nowLocal, 'week')))
    setRepublishOpen(true)
  }

  const computeRepublishToIso = (fromLocal: string, preset: 'week' | 'current_month' | 'one_month'): string => {
    const fromIso = dateTimeLocalToIso(fromLocal)
    const from = new Date(fromIso)
    if (preset === 'week') {
      return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    if (preset === 'one_month') {
      const d = new Date(from)
      d.setMonth(d.getMonth() + 1)
      return d.toISOString()
    }
    // preset === 'current_month'
    return endOfCurrentMonthIso(fromIso)
  }

  const confirmRepublish = async () => {
    if (!republishTarget) return
    setRepublishing(true)
    try {
      const fromIso = dateTimeLocalToIso(republishFrom)
      const toIso = republishTo ? dateTimeLocalToIso(republishTo) : null
      await republishAnnouncementAction(republishTarget.id, { publish_from: fromIso, publish_to: toIso })
      toast.success('Republished')
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to republish')
    } finally {
      setRepublishing(false)
      setRepublishOpen(false)
      setRepublishTarget(null)
    }
  }

  const roleLabel = useMemo(() => {
    return (r: AnnouncementTargetRole) => (t(`roles.${r}` as any) as string) || r
  }, [t])

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(locale)
  }

  const statusLabel = useMemo(() => {
    return (s: ReturnType<typeof computeStatus>) => {
      if (s === 'active') return t('announcements.status.active')
      if (s === 'scheduled') return t('announcements.status.scheduled')
      if (s === 'expired') return t('announcements.status.expired')
      // computeStatus uses "deleted" for deactivated rows
      return t('announcements.status.deactivated')
    }
  }, [t])

  const DateTimePicker = (props: {
    label: string
    value: string
    onChange: (v: string) => void
    allowClear?: boolean
  }) => {
    const display = props.value ? new Date(props.value).toLocaleString(locale) : t('announcements.date.select')
    return (
      <div className="grid gap-2">
        <Label>{props.label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="justify-start">
              {display}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-2" align="start">
            <Input
              type="datetime-local"
              value={props.value}
              onChange={(e) => props.onChange(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              {props.allowClear && (
                <Button type="button" variant="outline" size="sm" onClick={() => props.onChange('')}>
                  {t('common.clear')}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => props.onChange(isoToDateTimeLocal(new Date().toISOString()))}
              >
                {t('common.now')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  const applyQuickRange = (range: 'no_end' | 'week' | 'current_month' | 'one_month') => {
    const fromIso = dateTimeLocalToIso(publishFrom)
    const from = new Date(fromIso)

    if (range === 'no_end') {
      setPublishTo('')
      return
    }

    if (range === 'week') {
      setPublishTo(isoToDateTimeLocal(new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()))
      return
    }

    if (range === 'one_month') {
      const d = new Date(from)
      d.setMonth(d.getMonth() + 1)
      setPublishTo(isoToDateTimeLocal(d.toISOString()))
      return
    }

    // current_month
    setPublishTo(isoToDateTimeLocal(endOfCurrentMonthIso(fromIso)))
  }

  const filteredChurches = useMemo(() => {
    if (!dioceseIds.length) return []
    return props.churches.filter(c => c.diocese_id && dioceseIds.includes(c.diocese_id))
  }, [props.churches, dioceseIds])

  const filteredClasses = useMemo(() => {
    if (!churchIds.length) return []
    return props.classes.filter(c => c.church_id && churchIds.includes(c.church_id))
  }, [props.classes, churchIds])

  const allDioceseIds = useMemo(() => props.dioceses.map(d => d.id), [props.dioceses])
  const allChurchIdsInSelectedDioceses = useMemo(() => filteredChurches.map(c => c.id), [filteredChurches])
  const allClassIdsInSelectedChurches = useMemo(() => filteredClasses.map(c => c.id), [filteredClasses])

  const allDiocesesSelected = useMemo(() => {
    if (allDioceseIds.length === 0) return false
    return allDioceseIds.every(id => dioceseIds.includes(id))
  }, [allDioceseIds, dioceseIds])

  const allChurchesSelected = useMemo(() => {
    if (allChurchIdsInSelectedDioceses.length === 0) return false
    return allChurchIdsInSelectedDioceses.every(id => churchIds.includes(id))
  }, [allChurchIdsInSelectedDioceses, churchIds])

  const allClassesSelected = useMemo(() => {
    if (allClassIdsInSelectedChurches.length === 0) return false
    return allClassIdsInSelectedChurches.every(id => classIds.includes(id))
  }, [allClassIdsInSelectedChurches, classIds])

  // Keep selections consistent when parent scope changes
  useEffect(() => {
    if (!dioceseIds.length) {
      if (churchIds.length) setChurchIds([])
      if (classIds.length) setClassIds([])
      return
    }
    const validChurchIds = new Set(filteredChurches.map(c => c.id))
    setChurchIds(prev => prev.filter(id => validChurchIds.has(id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dioceseIds, filteredChurches])

  useEffect(() => {
    if (!churchIds.length) {
      if (classIds.length) setClassIds([])
      return
    }
    const validClassIds = new Set(filteredClasses.map(c => c.id))
    setClassIds(prev => prev.filter(id => validClassIds.has(id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchIds, filteredClasses])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.announcements')}</h1>
          <p className="text-sm text-muted-foreground">{t('announcements.adminSubtitle')}</p>
          {props.schemaMissing && (
            <p className="mt-2 text-sm text-destructive">
              {t('announcements.schemaMissing')}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/admin/announcements/create">{t('common.create')}</Link>
        </Button>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? t('common.edit') : t('common.create')} {t('nav.announcements')}</DialogTitle>
              <DialogDescription>
                Choose roles + (optional) dioceses/churches/classes to control who can see it.
              </DialogDescription>
            </DialogHeader>

              <div className="grid gap-4">
                {!editing && (
                  <p className="text-sm text-muted-foreground">
                    Creation moved to a new page. Use the Create button above.
                  </p>
                )}
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." />
              </div>

              <div className="grid gap-2">
                <Label>Types (tags)</Label>
                <div className="flex gap-2">
                  <Input
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        addType(typeInput)
                      }
                    }}
                    list="announcement-type-suggestions"
                    placeholder="Type and press Enter"
                  />
                  <datalist id="announcement-type-suggestions">
                    {typeSuggestions.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addType(typeInput)}
                    disabled={!typeInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {types.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-xs opacity-70 hover:opacity-100"
                        onClick={() => setTypes(prev => prev.filter(tg => tg !== tag))}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Who can see it</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map(r => (
                    <label key={r.role} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={targetRoles.includes(r.role)} onCheckedChange={() => toggleRole(r.role)} />
                      <span>{roleLabel(r.role)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DateTimePicker
                  label="Publish from"
                  value={publishFrom}
                  onChange={setPublishFrom}
                />
                <DateTimePicker
                  label="Publish to"
                  value={publishTo}
                  onChange={setPublishTo}
                  allowClear
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('no_end')}>
                  No end
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('week')}>
                  Next 7 days
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('current_month')}>
                  End of month
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('one_month')}>
                  One month
                </Button>
              </div>

              {props.canScope && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Scope (optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Dioceses</Label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={allDiocesesSelected}
                            onCheckedChange={() => setDioceseIds(allDiocesesSelected ? [] : allDioceseIds)}
                          />
                          <span>Select all</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto rounded border p-2">
                        {props.dioceses.map(d => (
                          <label key={d.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={dioceseIds.includes(d.id)} onCheckedChange={() => setDioceseIds(prev => toggleId(prev, d.id))} />
                            <span>{d.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Churches</Label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            disabled={dioceseIds.length === 0}
                            checked={allChurchesSelected}
                            onCheckedChange={() => {
                              if (dioceseIds.length === 0) return
                              setChurchIds(allChurchesSelected ? [] : allChurchIdsInSelectedDioceses)
                            }}
                          />
                          <span>Select all</span>
                        </label>
                      </div>
                      {dioceseIds.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Select diocese first to load churches.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto rounded border p-2">
                          {filteredChurches.map(c => (
                            <label key={c.id} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={churchIds.includes(c.id)} onCheckedChange={() => setChurchIds(prev => toggleId(prev, c.id))} />
                              <span>{c.name}</span>
                            </label>
                          ))}
                          {filteredChurches.length === 0 && (
                            <p className="col-span-2 text-xs text-muted-foreground">{t('common.noResults')}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Classes</Label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            disabled={churchIds.length === 0}
                            checked={allClassesSelected}
                            onCheckedChange={() => {
                              if (churchIds.length === 0) return
                              setClassIds(allClassesSelected ? [] : allClassIdsInSelectedChurches)
                            }}
                          />
                          <span>Select all</span>
                        </label>
                      </div>
                      {churchIds.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Select church first to load classes.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto rounded border p-2">
                          {filteredClasses.map(c => (
                            <label key={c.id} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={classIds.includes(c.id)} onCheckedChange={() => setClassIds(prev => toggleId(prev, c.id))} />
                              <span>{c.name}</span>
                            </label>
                          ))}
                          {filteredClasses.length === 0 && (
                            <p className="col-span-2 text-xs text-muted-foreground">{t('common.noResults')}</p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        If you select classes, it becomes the strongest filter (only those classes).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.management')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
              <TabsTrigger value="active">{t('announcements.status.active')}</TabsTrigger>
              <TabsTrigger value="scheduled">{t('announcements.status.scheduled')}</TabsTrigger>
              <TabsTrigger value="expired">{t('announcements.status.expired')}</TabsTrigger>
              <TabsTrigger value="deleted">{t('announcements.status.deactivated')}</TabsTrigger>
            </TabsList>
            <TabsContent value={statusTab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('announcements.table.title')}</TableHead>
                    <TableHead>{t('announcements.table.types')}</TableHead>
                    <TableHead>{t('announcements.table.roles')}</TableHead>
                    <TableHead>{t('announcements.table.publishFrom')}</TableHead>
                    <TableHead>{t('announcements.table.publishTo')}</TableHead>
                    <TableHead>{t('announcements.table.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(displayedAnnouncements || []).map(a => {
                    const status = computeStatus(a)
                    return (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer"
                        onClick={() => { setDetailsTarget(a); setDetailsOpen(true) }}
                      >
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(a.types || []).slice(0, 4).map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                            {(a.types || []).length > 4 && <Badge variant="outline">+{(a.types || []).length - 4}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(a.target_roles || []).map(r => (
                              <Badge key={r} variant="outline">{roleLabel(r)}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(a.publish_from)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(a.publish_to)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status === 'active' ? 'default' : status === 'deleted' ? 'destructive' : 'secondary'}>
                            {statusLabel(status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/announcements/${a.id}/edit`}>{t('common.edit')}</Link>
                          </Button>
                          {status !== 'active' && (
                            <Button variant="outline" size="sm" onClick={() => openRepublish(a)}>
                              {t('announcements.actions.republish')}
                            </Button>
                          )}
                          {status === 'active' && (
                            <Button variant="destructive" size="sm" onClick={() => openDeactivate(a)}>
                              {t('announcements.actions.deactivate')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {(!displayedAnnouncements || displayedAnnouncements.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        {t('common.noResults')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={deactivateOpen} onOpenChange={(v) => { setDeactivateOpen(v); if (!v) { setDeactivateTarget(null); setDeactivateReason('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('announcements.deactivateDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('announcements.deactivateDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>{t('announcements.deactivateDialog.reasonLabel')}</Label>
            <Textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder={t('announcements.deactivateDialog.reasonPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={deactivating}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate} disabled={deactivating}>
              {deactivating ? t('common.saving') : t('announcements.actions.deactivate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={republishOpen} onOpenChange={(v) => { setRepublishOpen(v); if (!v) { setRepublishTarget(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('announcements.republishDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('announcements.republishDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded border p-3 space-y-2">
              <div className="text-sm font-medium">{t('announcements.republishDialog.pickDates')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DateTimePicker
                  label={t('announcements.republishDialog.from')}
                  value={republishFrom}
                  onChange={(v) => {
                    setRepublishFrom(v)
                    // keep "to" synced to the same default range when from changes (7 days)
                    if (!republishTo) return
                  }}
                />
                <DateTimePicker
                  label={t('announcements.republishDialog.to')}
                  value={republishTo}
                  onChange={setRepublishTo}
                  allowClear
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRepublishTo(isoToDateTimeLocal(computeRepublishToIso(republishFrom, 'week')))}>
                  {t('announcements.ranges.next7Days')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setRepublishTo(isoToDateTimeLocal(computeRepublishToIso(republishFrom, 'current_month')))}>
                  {t('announcements.ranges.endOfMonth')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setRepublishTo(isoToDateTimeLocal(computeRepublishToIso(republishFrom, 'one_month')))}>
                  {t('announcements.ranges.oneMonth')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setRepublishTo('')}>
                  {t('announcements.ranges.noEnd')}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepublishOpen(false)} disabled={republishing}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmRepublish} disabled={republishing}>
              {republishing ? t('common.saving') : t('announcements.actions.republish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={(v) => { setDetailsOpen(v); if (!v) setDetailsTarget(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsTarget?.title || 'Announcement'}</DialogTitle>
            <DialogDescription>
              {detailsTarget ? `${t('announcements.table.status')}: ${statusLabel(computeStatus(detailsTarget))}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detailsTarget && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Publish</div>
                <div className="text-sm">{formatDateTime(detailsTarget.publish_from)} → {formatDateTime(detailsTarget.publish_to)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Roles</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(detailsTarget.target_roles || []).map(r => <Badge key={r} variant="outline">{roleLabel(r)}</Badge>)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Types</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(detailsTarget.types || []).length ? (detailsTarget.types || []).map(x => <Badge key={x} variant="secondary">{x}</Badge>) : <span className="text-sm">—</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="text-sm whitespace-pre-wrap">{detailsTarget.description || '—'}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


