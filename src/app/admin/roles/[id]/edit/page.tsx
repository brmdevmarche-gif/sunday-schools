import AdminLayout from '@/components/admin/AdminLayout'
import { RoleForm } from '@/components/admin/roles/RoleForm'
import { getRoleById, getPermissions } from '@/lib/sunday-school/roles'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [role, permissions] = await Promise.all([
    getRoleById(id),
    getPermissions({ isActive: true }),
  ])

  if (!role) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
          <p className="text-muted-foreground">
            Update role details and permissions
          </p>
        </div>
        <RoleForm role={role} permissions={permissions} />
      </div>
    </AdminLayout>
  )
}
