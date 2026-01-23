'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { PermissionSelector } from './PermissionSelector'
import type {
  RoleWithPermissions,
  Permission,
  CreateRoleInput,
  UpdateRoleInput,
} from '@/lib/types/modules/permissions'
import {
  createRoleAction,
  updateRoleAction,
} from '@/app/admin/roles/actions'

interface RoleFormProps {
  role?: RoleWithPermissions
  permissions: Permission[]
}

export function RoleForm({ role, permissions }: RoleFormProps) {
  const router = useRouter()
  const isEditing = !!role
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: role?.title || '',
    description: role?.description || '',
  })
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    role?.permissions.map((p) => p.id) || []
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    if (selectedPermissionIds.length === 0) {
      newErrors.permissions = 'At least one permission must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    startTransition(async () => {
      if (isEditing && role) {
        const input: UpdateRoleInput = {
          title: formData.title,
          description: formData.description || undefined,
          permission_ids: selectedPermissionIds,
        }

        const result = await updateRoleAction(role.id, input)
        if (result.success) {
          toast.success('Role updated successfully')
          router.push('/admin/roles')
        } else {
          toast.error(result.error || 'Failed to update role')
        }
      } else {
        const input: CreateRoleInput = {
          title: formData.title,
          description: formData.description || undefined,
          permission_ids: selectedPermissionIds,
        }

        const result = await createRoleAction(input)
        if (result.success) {
          toast.success('Role created successfully')
          router.push('/admin/roles')
        } else {
          toast.error(result.error || 'Failed to create role')
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Content Manager"
              disabled={isPending || (role?.is_system_role && isEditing)}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what this role can do..."
              rows={4}
              disabled={isPending}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.description.length} / 500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      <div className={errors.permissions ? 'space-y-2' : ''}>
        <PermissionSelector
          permissions={permissions}
          selectedPermissionIds={selectedPermissionIds}
          onSelectionChange={setSelectedPermissionIds}
        />
        {errors.permissions && (
          <p className="text-sm text-destructive">{errors.permissions}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
              ? 'Update Role'
              : 'Create Role'}
        </Button>
      </div>
    </form>
  )
}
