'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Shield } from 'lucide-react'
import type { RoleWithPermissions } from '@/lib/types/modules/permissions'
import {
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
} from './actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface RolesClientProps {
  initialRoles: RoleWithPermissions[]
}

export default function RolesClient({ initialRoles }: RolesClientProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<RoleWithPermissions[]>(initialRoles)
  const [isPending, startTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<RoleWithPermissions | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreate = () => {
    router.push('/admin/roles/create')
  }

  const handleEdit = (roleId: string) => {
    router.push(`/admin/roles/${roleId}/edit`)
  }

  const handleDeleteClick = (role: RoleWithPermissions) => {
    if (role.is_system_role) {
      toast.error('Cannot delete system role')
      return
    }
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return

    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteRoleAction(roleToDelete.id)
      if (result.success) {
        toast.success('Role deleted successfully')
        setRoles(roles.filter((r) => r.id !== roleToDelete.id))
        setDeleteDialogOpen(false)
        setRoleToDelete(null)
      } else {
        toast.error(result.error || 'Failed to delete role')
      }
      setIsDeleting(false)
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
            <p className="text-muted-foreground">
              Manage roles and their permissions
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Roles</CardTitle>
            <CardDescription>
              View and manage all roles in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No roles found. Create your first role to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {role.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          {role.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {role.permission_count} permissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role.is_system_role ? (
                          <Badge variant="default">System</Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {role.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(role.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!role.is_system_role && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(role)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        description={`Are you sure you want to delete "${roleToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}
