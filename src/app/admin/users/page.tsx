import AdminLayout from '@/components/admin/AdminLayout'
import UsersClient from './UsersClient'
import { getUsersData, getChurchesData, getDiocesesData } from './actions'
import { getRolesSimple } from '@/lib/sunday-school/roles-simple'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  // Fetch all data server-side in parallel
  const [users, churches, dioceses, roles] = await Promise.all([
    getUsersData(),
    getChurchesData(),
    getDiocesesData(),
    getRolesSimple({ isActive: true }).catch(() => []), // Fetch roles, fallback to empty array on error
  ])

  return (
    <AdminLayout>
      <PageWithPermissions permission="users.view">
        <UsersClient
          initialUsers={users}
          churches={churches}
          dioceses={dioceses}
          roles={roles}
        />
      </PageWithPermissions>
    </AdminLayout>
  )
}
