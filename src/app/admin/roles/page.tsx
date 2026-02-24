import AdminLayout from '@/components/admin/AdminLayout'
import RolesClient from './RolesClient'
// import { getRolesWithPermissions } from '@/lib/sunday-school/roles'
import { getRolesSimple } from '@/lib/sunday-school/roles-simple'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  // Temporary: use simple version to test if roles load
  // (Avoid console.error in Server Components; it shows as a runtime error overlay in dev.)
  const roles = await getRolesSimple({ isActive: true })

  return (
    <AdminLayout>
      <PageWithPermissions permission="roles.view">
        <RolesClient initialRoles={roles} />
      </PageWithPermissions>
    </AdminLayout>
  )
}
