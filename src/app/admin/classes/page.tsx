import AdminLayout from '@/components/admin/AdminLayout'
import ClassesClient from './ClassesClient'
import {
  getAllClassesWithCounts,
  getChurchesData,
  getDiocesesData,
  getCurrentUserProfile,
} from './actions'

export const dynamic = 'force-dynamic'

export default async function ClassesPage() {
  // Fetch all data server-side in parallel
  const [classes, churches, dioceses, userProfile] = await Promise.all([
    getAllClassesWithCounts(),
    getChurchesData(),
    getDiocesesData(),
    getCurrentUserProfile(),
  ])

  return (
    <AdminLayout>
      <ClassesClient
        initialClasses={classes}
        churches={churches}
        dioceses={dioceses}
        userProfile={userProfile}
      />
    </AdminLayout>
  )
}
