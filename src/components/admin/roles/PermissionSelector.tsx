'use client'

import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import type { Permission } from '@/lib/types/modules/permissions'

interface PermissionSelectorProps {
  permissions: Permission[]
  selectedPermissionIds: string[]
  onSelectionChange: React.Dispatch<React.SetStateAction<string[]>>
}

function normalizeQuery(q: string) {
  return q.trim().toLowerCase()
}

function matchesPermission(p: Permission, q: string) {
  if (!q) return true
  const qq = normalizeQuery(q)
  if (!qq) return true
  return (
    p.module.toLowerCase().includes(qq) ||
    p.name.toLowerCase().includes(qq) ||
    p.code.toLowerCase().includes(qq) ||
    (p.description ?? '').toLowerCase().includes(qq)
  )
}

export function PermissionSelector({
  permissions,
  selectedPermissionIds,
  onSelectionChange,
}: PermissionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    () => {
      // Expand all modules by default (one-time init; avoids effect-driven setState).
      const expanded: Record<string, boolean> = {}
      const modules = new Set(permissions.map((p) => p.module))
      modules.forEach((m) => {
        expanded[m] = true
      })
      return expanded
    }
  )

  const selectedSet = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds])
  const allPermissionIdsSet = useMemo(
    () => new Set(permissions.map((p) => p.id)),
    [permissions]
  )
  const selectedExistingCount = useMemo(() => {
    let c = 0
    for (const id of selectedPermissionIds) {
      if (allPermissionIdsSet.has(id)) c++
    }
    return c
  }, [allPermissionIdsSet, selectedPermissionIds])

  const permissionsByModule = useMemo(() => {
    const grouped = new Map<string, Permission[]>()
    for (const p of permissions) {
      const arr = grouped.get(p.module) ?? []
      arr.push(p)
      grouped.set(p.module, arr)
    }
    // Sort permissions for stable UX
    for (const [m, arr] of grouped.entries()) {
      grouped.set(
        m,
        arr.slice().sort((a, b) => a.name.localeCompare(b.name))
      )
    }
    return grouped
  }, [permissions])

  const visibleByModule = useMemo(() => {
    const q = normalizeQuery(searchQuery)
    const entries = Array.from(permissionsByModule.entries())
      .map(([module, perms]) => {
        if (!q) return [module, perms] as const
        const filtered = perms.filter((p) => matchesPermission(p, q) || module.toLowerCase().includes(q))
        // If module name matches, keep module but still filter permissions by query relevance
        return [module, filtered] as const
      })
      .filter(([, perms]) => perms.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
    return entries
  }, [permissionsByModule, searchQuery])

  const visiblePermissionIds = useMemo(() => {
    const ids: string[] = []
    for (const [, perms] of visibleByModule) {
      for (const p of perms) ids.push(p.id)
    }
    return ids
  }, [visibleByModule])

  const selectedVisibleCount = useMemo(() => {
    let c = 0
    for (const id of visiblePermissionIds) if (selectedSet.has(id)) c++
    return c
  }, [visiblePermissionIds, selectedSet])

  const totalCount = permissions.length
  const selectedCount = selectedExistingCount
  const visibleCount = visiblePermissionIds.length

  const overallChecked: boolean | 'indeterminate' = useMemo(() => {
    if (visibleCount === 0) return false
    if (selectedVisibleCount === 0) return false
    if (selectedVisibleCount === visibleCount) return true
    return 'indeterminate'
  }, [selectedVisibleCount, visibleCount])

  const toggleExpand = useCallback((module: string) => {
    setExpandedModules((prev) => ({ ...prev, [module]: !prev[module] }))
  }, [])

  const setPermissionSelected = useCallback(
    (permissionId: string, selected: boolean) => {
      onSelectionChange((prev) => {
        const has = prev.includes(permissionId)
        if (selected) return has ? prev : [...prev, permissionId]
        return has ? prev.filter((id) => id !== permissionId) : prev
      })
    },
    [onSelectionChange]
  )

  const setManySelected = useCallback(
    (permissionIds: string[], selected: boolean) => {
      onSelectionChange((prev) => {
        const set = new Set(prev)
        if (selected) {
          for (const id of permissionIds) set.add(id)
        } else {
          for (const id of permissionIds) set.delete(id)
        }
        return Array.from(set)
      })
    },
    [onSelectionChange]
  )

  const toggleAllVisible = useCallback(() => {
    if (visiblePermissionIds.length === 0) return
    const shouldSelect = selectedVisibleCount !== visiblePermissionIds.length
    setManySelected(visiblePermissionIds, shouldSelect)
  }, [selectedVisibleCount, setManySelected, visiblePermissionIds])

  const clearSearch = useCallback(() => setSearchQuery(''), [])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Selected: {selectedCount} of {totalCount}
            {searchQuery ? ` • Showing ${visibleCount}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions (name, code, module)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="permissions-select-all"
            checked={overallChecked}
            onCheckedChange={() => toggleAllVisible()}
            disabled={visibleCount === 0}
          />
          <Label htmlFor="permissions-select-all" className="text-sm font-medium">
            Select all {searchQuery ? '(visible)' : ''}
          </Label>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto pr-1">
        {visibleByModule.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            No permissions match your search.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleByModule.map(([module, modulePermissions]) => {
              const isExpanded = expandedModules[module] ?? true
              const moduleIds = modulePermissions.map((p) => p.id)
              const selectedInModule = moduleIds.filter((id) => selectedSet.has(id)).length
              const moduleChecked: boolean | 'indeterminate' =
                selectedInModule === 0
                  ? false
                  : selectedInModule === moduleIds.length
                    ? true
                    : 'indeterminate'

              return (
                <Card key={module}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => toggleExpand(module)}
                          aria-label={isExpanded ? `Collapse ${module}` : `Expand ${module}`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>

                        <Checkbox
                          id={`module-${module}`}
                          checked={moduleChecked}
                          onCheckedChange={(checked) =>
                            setManySelected(moduleIds, checked === true)
                          }
                        />

                        <Label
                          htmlFor={`module-${module}`}
                          className="font-semibold capitalize truncate"
                        >
                          {module}
                        </Label>

                        <span className="text-xs text-muted-foreground shrink-0">
                          ({selectedInModule}/{moduleIds.length})
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          setManySelected(moduleIds, selectedInModule !== moduleIds.length)
                        }
                      >
                        {selectedInModule === moduleIds.length ? 'Deselect' : 'Select'}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {modulePermissions.map((permission) => {
                          const isSelected = selectedSet.has(permission.id)
                          return (
                            <div
                              key={permission.id}
                              className={cn(
                                'rounded-lg border px-3 py-2 transition-colors',
                                'hover:bg-muted/50',
                                isSelected && 'border-primary/60 bg-primary/5'
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id={permission.id}
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    setPermissionSelected(permission.id, checked === true)
                                  }
                                />
                                <div className="min-w-0 flex-1">
                                  <Label
                                    htmlFor={permission.id}
                                    className="text-sm font-medium leading-tight cursor-pointer"
                                  >
                                    {permission.name}
                                  </Label>
                                  <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                                    {permission.code}
                                  </div>
                                  {permission.description ? (
                                    <div className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                                      {permission.description}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
