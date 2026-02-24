import AdminLayout from '@/components/admin/AdminLayout'
import DiocesesClient from './DiocesesClient'
import { getAllDiocesesWithChurchCounts } from './actions'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'

export const dynamic = 'force-dynamic'

export default async function DiocesesPage() {
  const dioceses = await getAllDiocesesWithChurchCounts()

  return (
    <AdminLayout>
      <PageWithPermissions permission="dioceses.view">
        <DiocesesClient initialDioceses={dioceses} />
      </PageWithPermissions>
    </AdminLayout>
  )
}
