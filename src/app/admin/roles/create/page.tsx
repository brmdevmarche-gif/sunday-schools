import AdminLayout from '@/components/admin/AdminLayout'
import { RoleForm } from '@/components/admin/roles/RoleForm'
import { getPermissions } from '@/lib/sunday-school/roles'

export const dynamic = 'force-dynamic'

export default async function CreateRolePage() {
  const permissions = await getPermissions({ isActive: true })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Role</h1>
          <p className="text-muted-foreground">
            Create a new role and assign permissions
          </p>
        </div>
        <RoleForm permissions={permissions} />
      </div>
    </AdminLayout>
  )
}
