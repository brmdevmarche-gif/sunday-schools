/**
 * EXAMPLE: How to add permission checks to a page component
 * 
 * This is an example showing how to integrate permission checks
 * into existing page components. Copy this pattern to other pages.
 */

import AdminLayout from '@/components/admin/AdminLayout'
import { hasPermission } from '@/lib/permissions/check'
import { redirect } from 'next/navigation'
import DiocesesClient from './DiocesesClient'
import { getAllDiocesesWithChurchCounts } from './actions'

export const dynamic = 'force-dynamic'

export default async function DiocesesPage() {
  // Check if user has permission to view dioceses
  const canView = await hasPermission('dioceses.view')
  
  if (!canView) {
    // Redirect unauthorized users
    redirect('/admin')
  }

  // Fetch data (only if user has permission)
  const dioceses = await getAllDiocesesWithChurchCounts()

  return (
    <AdminLayout>
      <DiocesesClient initialDioceses={dioceses} />
    </AdminLayout>
  )
}

/**
 * EXAMPLE: Checking permissions for actions
 * 
 * In your actions file (actions.ts), you can also check permissions:
 */

/*
import { hasPermission } from '@/lib/permissions/check'

export async function createDioceseAction(input: CreateDioceseInput) {
  // Check permission before allowing action
  const canCreate = await hasPermission('dioceses.create')
  
  if (!canCreate) {
    return { 
      success: false, 
      error: 'You do not have permission to create dioceses' 
    }
  }

  // Proceed with creation...
  try {
    const diocese = await createDiocese(input)
    revalidatePath('/admin/dioceses')
    return { success: true, data: diocese }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
*/
