import AdminLayout from '@/components/admin/AdminLayout'
import ClassesClient from './ClassesClient'
import {
  getAllClassesWithCounts,
  getChurchesData,
  getDiocesesData,
  getCurrentUserProfile,
} from './actions'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Classes',
}

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
      <PageWithPermissions permission="classes.view">
        <ClassesClient
          initialClasses={classes}
          churches={churches}
          dioceses={dioceses}
          userProfile={userProfile}
        />
      </PageWithPermissions>
    </AdminLayout>
  )
}
