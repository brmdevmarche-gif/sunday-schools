'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

type Announcement = {
  id: string
  title: string
  description: string | null
  types: string[]
  publish_from: string
  publish_to: string | null
}

export default function AnnouncementsWidget() {
  const t = useTranslations()
  const supabase = createClient()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([])
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [schemaMissing, setSchemaMissing] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const allTypes = useMemo(() => {
    const s = new Set<string>()
    for (const a of allAnnouncements) for (const ty of a.types || []) s.add(ty)
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [allAnnouncements])

  const filteredByTypes = useMemo(() => {
    // If there are no types at all (or user didn't pick any), show everything.
    if (allTypes.length === 0 || selectedTypes.length === 0) return allAnnouncements
    return allAnnouncements.filter(a => (a.types || []).some(ty => selectedTypes.includes(ty)))
  }, [allAnnouncements, selectedTypes, allTypes.length])

  const announcementsToShow = useMemo(() => {
    if (!unreadOnly) return filteredByTypes
    return filteredByTypes.filter(a => !viewedIds.has(a.id))
  }, [filteredByTypes, unreadOnly, viewedIds])

  const unreadCount = useMemo(() => {
    return allAnnouncements.filter(a => !viewedIds.has(a.id)).length
  }, [allAnnouncements, viewedIds])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setAllAnnouncements([])
          return
        }

        // Fetch current role for better empty-state guidance
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        setUserRole((profile as any)?.role || null)

        // Fetch active announcements (RLS restricts to what this user is allowed to see)
        const { data: visible, error: aErr } = await supabase
          .from('announcements')
          .select('id,title,description,types,publish_from,publish_to')
          .order('publish_from', { ascending: false })

        if (aErr) {
          const msg = aErr.message || ''
          if (msg.includes("Could not find the table 'public.announcements'") || msg.includes('schema cache')) {
            setSchemaMissing(true)
            setAllAnnouncements([])
            return
          }
          throw aErr
        }

        const visibleList = (visible || []) as Announcement[]

        // Fetch views and filter to unviewed
        const { data: views, error: vErr } = await supabase
          .from('announcement_views')
          .select('announcement_id')
          .eq('user_id', user.id)

        if (vErr) {
          const msg = vErr.message || ''
          if (msg.includes("Could not find the table 'public.announcement_views'") || msg.includes('schema cache')) {
            setSchemaMissing(true)
            setAllAnnouncements([])
            return
          }
          throw vErr
        }

        const viewed = new Set((views || []).map((v: any) => v.announcement_id))
        setViewedIds(viewed)
        setAllAnnouncements(visibleList)
        // default: select all current types; if there are none, show all announcements
        const typesSet = new Set<string>()
        visibleList.forEach(a => (a.types || []).forEach(ty => typesSet.add(ty)))
        setSelectedTypes(Array.from(typesSet))

        // If we're on the announcements page, mark ALL visible announcements as read immediately.
        if (pathname === '/announcements') {
          const unviewedIds = visibleList.map(a => a.id).filter(id => !viewed.has(id))
          if (unviewedIds.length > 0) {
            const upsertRows = unviewedIds.map(id => ({ announcement_id: id, user_id: user.id }))
            const { error: upsertErr } = await supabase
              .from('announcement_views')
              .upsert(upsertRows, { onConflict: 'announcement_id,user_id', ignoreDuplicates: true })

            if (!upsertErr) {
              setViewedIds(prev => {
                const next = new Set(prev)
                unviewedIds.forEach(id => next.add(id))
                return next
              })
            }
          }
        }
      } catch (e: any) {
        console.error(e)
        toast.error(e?.message || 'Failed to load announcements')
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleType = (ty: string) => {
    setSelectedTypes(prev => (prev.includes(ty) ? prev.filter(x => x !== ty) : [...prev, ty]))
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markViewed = async (a: Announcement) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('announcement_views')
        // Important: ignore duplicates so PostgREST doesn't try UPDATE (we only have INSERT policy)
        .upsert({ announcement_id: a.id, user_id: user.id }, { onConflict: 'announcement_id,user_id', ignoreDuplicates: true })
      if (error) throw error
      setViewedIds(prev => {
        const next = new Set(prev)
        next.add(a.id)
        return next
      })
    } catch (e: any) {
      const msg =
        e?.message ||
        (typeof e === 'string' ? e : '') ||
        (e ? JSON.stringify(e) : '')
      console.error('markViewed failed:', msg, e)
      toast.error(msg || 'Failed to mark as viewed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{t('studentHome.announcements')}</span>
          {unreadCount > 0 && <Badge>{t('announcements.newCount', { count: unreadCount })}</Badge>}
        </CardTitle>
        <CardDescription>{t('studentHome.announcementsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : schemaMissing ? (
          <p className="text-sm text-destructive">
            {t('announcements.schemaMissing')}
          </p>
        ) : allAnnouncements.length === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('announcements.noUnviewed')}</p>
            <p className="text-xs text-muted-foreground">
              {userRole
                ? t('announcements.tipTargetingWithRole', { role: (t(`roles.${userRole}` as any) as string) || userRole })
                : t('announcements.tipTargeting')}
            </p>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={unreadOnly} onCheckedChange={() => setUnreadOnly(v => !v)} />
              <span>{t('announcements.unreadOnly')}</span>
            </label>
            {allTypes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{t('announcements.filterByType')}</div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (selectedTypes.length > 0) setSelectedTypes([])
                        else setSelectedTypes(allTypes)
                      }}
                      disabled={allTypes.length === 0}
                    >
                      {selectedTypes.length > 0 ? t('announcements.clearTypes') : t('announcements.selectAllTypes')}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {allTypes.map(ty => (
                    <label key={ty} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedTypes.includes(ty)} onCheckedChange={() => toggleType(ty)} />
                      <span>{ty}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {announcementsToShow.map(a => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{a.title}</span>
                        {!viewedIds.has(a.id) && (
                          <Badge variant="secondary">{t('announcements.new')}</Badge>
                        )}
                      </div>
                      {a.types?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {a.types.slice(0, 6).map(ty => (
                            <Badge key={ty} variant="secondary">{ty}</Badge>
                          ))}
                        </div>
                      ) : null}
                      {expandedIds.has(a.id) && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap pt-2">
                          {a.description || t('announcements.noDescription')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await markViewed(a)
                          toggleExpanded(a.id)
                        }}
                      >
                        {expandedIds.has(a.id) ? t('common.close') : t('announcements.open')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


