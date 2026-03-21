'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { getAccessReviewReport, getStaleAccounts } from '@/lib/access-review'
import type { UserAccessSummary } from '@/lib/access-review'

export async function getAccessReviewAction(options?: {
  dioceseId?: string
  churchId?: string
  includeInactive?: boolean
  limit?: number
  offset?: number
}): Promise<{ success: true; data: UserAccessSummary[]; count: number | null } | { success: false; error: string }> {
  const { role } = await requireAdmin()

  // Only super_admin can run full access reviews
  if (role !== 'super_admin') {
    return { success: false, error: 'Only super admins can run access reviews' }
  }

  const result = await getAccessReviewReport(options)
  return { success: true, ...result }
}

export async function getStaleAccountsAction(
  inactiveDays: number = 90
): Promise<{ success: true; data: Awaited<ReturnType<typeof getStaleAccounts>> } | { success: false; error: string }> {
  const { role } = await requireAdmin()

  if (role !== 'super_admin') {
    return { success: false, error: 'Only super admins can view stale accounts' }
  }

  const data = await getStaleAccounts(inactiveDays)
  return { success: true, data }
}
