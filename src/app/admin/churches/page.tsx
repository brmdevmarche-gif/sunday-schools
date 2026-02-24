import AdminLayout from '@/components/admin/AdminLayout'
import ChurchesClient from './ChurchesClient'
import { getAllChurchesWithClassCounts, getDiocesesData } from './actions'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'

export const dynamic = 'force-dynamic'

export default async function ChurchesPage() {
  // Fetch all data server-side in parallel
  const [churches, dioceses] = await Promise.all([
    getAllChurchesWithClassCounts(),
    getDiocesesData(),
  ])

  return (
    <AdminLayout>
      <PageWithPermissions permission="churches.view">
        <ChurchesClient initialChurches={churches} dioceses={dioceses} />
      </PageWithPermissions>
    </AdminLayout>
  )
}
