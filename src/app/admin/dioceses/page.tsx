import AdminLayout from '@/components/admin/AdminLayout'
import DiocesesClient from './DiocesesClient'
import { getAllDiocesesWithChurchCounts } from './actions'
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dioceses',
}

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
