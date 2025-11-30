import AdminLayout from '@/components/admin/AdminLayout'
import DiocesesClient from './DiocesesClient'
import { getAllDiocesesWithChurchCounts } from './actions'

export const dynamic = 'force-dynamic'

export default async function DiocesesPage() {
  const dioceses = await getAllDiocesesWithChurchCounts()

  return (
    <AdminLayout>
      <DiocesesClient initialDioceses={dioceses} />
    </AdminLayout>
  )
}
