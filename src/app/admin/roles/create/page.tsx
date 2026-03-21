import AdminLayout from '@/components/admin/AdminLayout'
import { RoleForm } from '@/components/admin/roles/RoleForm'
import { getPermissions } from '@/lib/sunday-school/roles'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Create Role',
}

export default async function CreateRolePage() {
  const permissions = await getPermissions({ isActive: true })

  return (
    <AdminLayout>
      <PageWithPermissions permission="roles.create">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Role</h1>
            <p className="text-muted-foreground">
              Create a new role and assign permissions
            </p>
          </div>
          <RoleForm permissions={permissions} />
        </div>
      </PageWithPermissions>
    </AdminLayout>
  )
}
