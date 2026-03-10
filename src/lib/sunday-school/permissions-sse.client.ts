import type { Permission } from '../types/modules/permissions'
import { getCurrentUserPermissions, getUserPermissionCodes } from './roles.client'

export interface PermissionsStreamPayload {
  permissionCodes: string[]
  permissions: Permission[]
}

export interface PermissionsStreamCallbacks {
  onPermissions: (payload: PermissionsStreamPayload) => void
  onError?: (message: string) => void
}

/**
 * Stream permissions over SSE.
 * The server pushes updates whenever permissions change (polls DB and emits diffs).
 */
export function connectPermissionsStream(
  callbacks: PermissionsStreamCallbacks
): () => void {
  if (typeof window === 'undefined') return () => {}

  let closed = false
  let es: EventSource | null = null
  let fallbackTimer: number | null = null

  const stopFallback = () => {
    if (fallbackTimer !== null) {
      window.clearInterval(fallbackTimer)
      fallbackTimer = null
    }
  }

  const startFallback = () => {
    if (fallbackTimer !== null) return

    const run = async () => {
      try {
        const [codes, perms] = await Promise.all([
          getUserPermissionCodes(),
          getCurrentUserPermissions(),
        ])
        callbacks.onPermissions({ permissionCodes: codes, permissions: perms })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to refresh permissions (fallback)'
        callbacks.onError?.(message)
      }
    }

    void run()
    fallbackTimer = window.setInterval(run, 5000)
  }

  const cleanup = () => {
    if (closed) return
    closed = true
    stopFallback()
    es?.close()
    es = null
  }

  try {
    es = new EventSource('/api/permissions/stream')

    es.onopen = () => {
      // Stream is connected again; stop any fallback polling.
      stopFallback()
    }

    es.addEventListener('permissions', (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as PermissionsStreamPayload
        stopFallback()
        callbacks.onPermissions({
          permissionCodes: Array.isArray(payload.permissionCodes) ? payload.permissionCodes : [],
          permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid permissions event'
        callbacks.onError?.(message)
        startFallback()
      }
    })

    es.addEventListener('error', (evt) => {
      // The server may send { message } or the EventSource may emit a native error event.
      try {
        const data = (evt as MessageEvent).data
        if (typeof data === 'string' && data.length > 0) {
          const parsed = JSON.parse(data) as { message?: string }
          callbacks.onError?.(parsed.message || 'Permissions stream error')
        } else {
          callbacks.onError?.('Permissions stream error')
        }
      } catch {
        callbacks.onError?.('Permissions stream error')
      }
      startFallback()
    })

    // Native EventSource error event (connection dropped / server unavailable).
    es.onerror = () => {
      callbacks.onError?.('Permissions stream disconnected')
      startFallback()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to open permissions stream'
    callbacks.onError?.(message)
    startFallback()
  }

  return cleanup
}
