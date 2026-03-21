import 'server-only'

import { createClient } from './supabase/server'
import { logger } from '@/lib/logger'

export interface AuditLogEntry {
  id: string
  user_id: string | null
  user_role: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

/**
 * Query audit logs with optional filters.
 * Only accessible by super_admin and diocese_admin (enforced by RLS).
 */
export async function getAuditLogs(options?: {
  tableName?: string
  userId?: string
  action?: string
  limit?: number
  offset?: number
}): Promise<{ data: AuditLogEntry[]; count: number | null }> {
  const supabase = await createClient()

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options?.tableName) {
    query = query.eq('table_name', options.tableName)
  }
  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }
  if (options?.action) {
    query = query.eq('action', options.action)
  }

  query = query
    .range(
      options?.offset ?? 0,
      (options?.offset ?? 0) + (options?.limit ?? 50) - 1
    )

  const { data, error, count } = await query

  if (error) {
    logger.error('Error fetching audit logs', error)
    return { data: [], count: 0 }
  }

  return { data: (data || []) as AuditLogEntry[], count }
}
