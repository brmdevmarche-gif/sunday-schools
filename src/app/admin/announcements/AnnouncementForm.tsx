'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale, useTranslations } from 'next-intl'
import type { AnnouncementTargetRole, Class, Church, CreateAnnouncementInput, Diocese, UpdateAnnouncementInput } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { createAnnouncementAction, getAnnouncementTypesAction, updateAnnouncementAction } from './actions'

type Mode = 'create' | 'edit'

type AnnouncementFormValues = {
  id?: string
  title: string
  description: string
  types: string[]
  target_roles: AnnouncementTargetRole[]
  publish_from: string // datetime-local string
  publish_to: string // datetime-local string or ''
  diocese_ids: string[]
  church_ids: string[]
  class_ids: string[]
}

const ALL_ROLES: { role: AnnouncementTargetRole }[] = [
  { role: 'student' },
  { role: 'parent' },
  { role: 'teacher' },
  { role: 'church_admin' },
  { role: 'diocese_admin' },
  { role: 'super_admin' },
]

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

function formatLocalOrDash(v: string, locale: string, selectLabel: string) {
  if (!v) return selectLabel
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return selectLabel
  return d.toLocaleString(locale)
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter(x => x !== id) : [...list, id]
}

export default function AnnouncementForm(props: {
  mode: Mode
  initial?: Partial<AnnouncementFormValues>
  dioceses: Diocese[]
  churches: Church[]
  classes: Class[]
  canScope: boolean
  /** Optional client-side redirect after save (useful for create page). */
  successRedirectHref?: string
}) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const nowLocal = useMemo(() => isoToDateTimeLocal(new Date().toISOString()), [])

  const [saving, setSaving] = useState(false)
  const [typeSuggestions, setTypeSuggestions] = useState<string[]>([])

  const [title, setTitle] = useState(props.initial?.title || '')
  const [description, setDescription] = useState(props.initial?.description || '')
  const [types, setTypes] = useState<string[]>(props.initial?.types || [])
  const [typeInput, setTypeInput] = useState('')
  const [targetRoles, setTargetRoles] = useState<AnnouncementTargetRole[]>(props.initial?.target_roles || ['student', 'parent'])
  const [publishFrom, setPublishFrom] = useState<string>(props.initial?.publish_from || nowLocal)
  const [publishTo, setPublishTo] = useState<string>(props.initial?.publish_to || '')
  const [dioceseIds, setDioceseIds] = useState<string[]>(props.initial?.diocese_ids || [])
  const [churchIds, setChurchIds] = useState<string[]>(props.initial?.church_ids || [])
  const [classIds, setClassIds] = useState<string[]>(props.initial?.class_ids || [])

  useEffect(() => {
    async function loadTypeSuggestions() {
      try {
        const res = await getAnnouncementTypesAction()
        setTypeSuggestions(res.data || [])
      } catch {
        setTypeSuggestions([])
      }
    }
    loadTypeSuggestions()
  }, [])

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

  // keep dependent selections consistent
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

  const DateTimePicker = (p: { label: string; value: string; onChange: (v: string) => void; allowClear?: boolean }) => {
    return (
      <div className="grid gap-2">
        <Label>{p.label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="justify-start">
              {formatLocalOrDash(p.value, locale, t('announcements.date.select'))}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-2" align="start">
            <Input type="datetime-local" value={p.value} onChange={(e) => p.onChange(e.target.value)} />
            <div className="flex gap-2 justify-end">
              {p.allowClear && (
                <Button type="button" variant="outline" size="sm" onClick={() => p.onChange('')}>
                  {t('common.clear')}
                </Button>
              )}
              <Button type="button" size="sm" onClick={() => p.onChange(nowLocal)}>
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
    setPublishTo(isoToDateTimeLocal(endOfCurrentMonthIso(fromIso)))
  }

  const addType = (raw: string) => {
    const cleaned = raw.trim()
    if (!cleaned) return
    setTypes(prev => (prev.includes(cleaned) ? prev : [...prev, cleaned]))
    setTypeInput('')
  }

  const toggleRole = (role: AnnouncementTargetRole) => {
    setTargetRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]))
  }

  const onSubmit = async () => {
    if (!title.trim()) return toast.error('Title is required')
    if (!targetRoles.length) return toast.error('Select at least one role')

    setSaving(true)
    try {
      const payloadBase = {
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

      if (props.mode === 'edit' && props.initial?.id) {
        const payload: UpdateAnnouncementInput = { id: props.initial.id, ...payloadBase }
        await updateAnnouncementAction(payload)
        toast.success('Announcement updated')
      } else {
        const payload: CreateAnnouncementInput = payloadBase
        await createAnnouncementAction(payload)
        toast.success('Announcement created')
      }

      router.refresh()
      if (props.successRedirectHref) {
        router.push(props.successRedirectHref)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>{t('announcements.form.title')}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('announcements.form.titlePlaceholder')} />
        </div>

        <div className="grid gap-2">
          <Label>{t('announcements.form.description')}</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('announcements.form.descriptionPlaceholder')} />
        </div>

        <div className="grid gap-2">
          <Label>{t('announcements.form.types')}</Label>
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
              placeholder={t('announcements.form.typesPlaceholder')}
            />
            <datalist id="announcement-type-suggestions">
              {typeSuggestions.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <Button type="button" variant="outline" onClick={() => addType(typeInput)} disabled={!typeInput.trim()}>
              {t('announcements.form.addType')}
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
          <Label>{t('announcements.form.whoCanSee')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_ROLES.map(r => (
              <label key={r.role} className="flex items-center gap-2 text-sm">
                <Checkbox checked={targetRoles.includes(r.role)} onCheckedChange={() => toggleRole(r.role)} />
                <span>{(t(`roles.${r.role}` as any) as string) || r.role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateTimePicker label={t('announcements.form.publishFrom')} value={publishFrom} onChange={setPublishFrom} />
          <DateTimePicker label={t('announcements.form.publishTo')} value={publishTo} onChange={setPublishTo} allowClear />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('no_end')}>
            {t('announcements.ranges.noEnd')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('week')}>
            {t('announcements.ranges.next7Days')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('current_month')}>
            {t('announcements.ranges.endOfMonth')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => applyQuickRange('one_month')}>
            {t('announcements.ranges.oneMonth')}
          </Button>
        </div>

        {props.canScope && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('announcements.scope.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t('announcements.scope.dioceses')}</Label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={allDiocesesSelected}
                      onCheckedChange={() => setDioceseIds(allDiocesesSelected ? [] : allDioceseIds)}
                    />
                    <span>{t('announcements.scope.selectAll')}</span>
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
                  <Label>{t('announcements.scope.churches')}</Label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      disabled={dioceseIds.length === 0}
                      checked={allChurchesSelected}
                      onCheckedChange={() => {
                        if (dioceseIds.length === 0) return
                        setChurchIds(allChurchesSelected ? [] : allChurchIdsInSelectedDioceses)
                      }}
                    />
                    <span>{t('announcements.scope.selectAll')}</span>
                  </label>
                </div>
                {dioceseIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('announcements.scope.selectDioceseFirst')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto rounded border p-2">
                    {filteredChurches.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={churchIds.includes(c.id)} onCheckedChange={() => setChurchIds(prev => toggleId(prev, c.id))} />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t('announcements.scope.classes')}</Label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      disabled={churchIds.length === 0}
                      checked={allClassesSelected}
                      onCheckedChange={() => {
                        if (churchIds.length === 0) return
                        setClassIds(allClassesSelected ? [] : allClassIdsInSelectedChurches)
                      }}
                    />
                    <span>{t('announcements.scope.selectAll')}</span>
                  </label>
                </div>
                {churchIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('announcements.scope.selectChurchFirst')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto rounded border p-2">
                    {filteredClasses.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={classIds.includes(c.id)} onCheckedChange={() => setClassIds(prev => toggleId(prev, c.id))} />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('announcements.scope.strongestHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          {t('common.back')}
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  )
}


