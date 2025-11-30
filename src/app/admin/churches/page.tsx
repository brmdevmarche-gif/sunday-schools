import AdminLayout from '@/components/admin/AdminLayout'
import ChurchesClient from './ChurchesClient'
import { getAllChurchesWithClassCounts, getDiocesesData } from './actions'

export const dynamic = 'force-dynamic'

export default async function ChurchesPage() {
  // Fetch all data server-side in parallel
  const [churches, dioceses] = await Promise.all([
    getAllChurchesWithClassCounts(),
    getDiocesesData(),
  ])

  return (
    <AdminLayout>
      <ChurchesClient initialChurches={churches} dioceses={dioceses} />
    </AdminLayout>
  )
}
