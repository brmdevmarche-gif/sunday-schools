import AdminLayout from '@/components/admin/AdminLayout'
import UsersClient from './UsersClient'
import { getUsersData, getChurchesData, getDiocesesData } from './actions'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  // Fetch all data server-side in parallel
  const [users, churches, dioceses] = await Promise.all([
    getUsersData(),
    getChurchesData(),
    getDiocesesData(),
  ])

  return (
    <AdminLayout>
      <UsersClient
        initialUsers={users}
        churches={churches}
        dioceses={dioceses}
      />
    </AdminLayout>
  )
}
