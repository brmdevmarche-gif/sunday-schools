import { createClient } from '@/lib/supabase/server'
import type { Permission } from '@/lib/types/modules/permissions'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type PermissionsPayload = {
  permissionCodes: string[]
  permissions: Permission[]
}

async function fetchPermissionsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<PermissionsPayload> {
  const { data: codes, error: codesError } = await supabase.rpc(
    'get_user_permission_codes',
    { user_id_param: userId }
  )

  if (codesError) {
    throw new Error(codesError.message || 'Failed to fetch permission codes')
  }

  const permissionCodes = (codes || []) as string[]
  if (permissionCodes.length === 0) {
    return { permissionCodes: [], permissions: [] }
  }

  const { data: perms, error: permsError } = await supabase
    .from('permissions')
    .select('*')
    .in('code', permissionCodes)
    .eq('is_active', true)

  if (permsError) {
    throw new Error(permsError.message || 'Failed to fetch permissions')
  }

  return { permissionCodes, permissions: (perms || []) as Permission[] }
}

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: Request) {
  const encoder = new TextEncoder()

  let closed = false
  const close = () => {
    closed = true
  }
  request.signal.addEventListener('abort', close)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk))

      // Tell the browser how long to wait before retrying.
      send('retry: 3000\n\n')

      // Authenticate once using the user's cookies.
      // After that, use an admin client for polling/realtime so the stream can
      // keep running without relying on Next.js request cookie context.
      let supabaseAuth: SupabaseClient
      try {
        supabaseAuth = await createClient()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize Supabase'
        send(sseEvent('error', { message }))
        controller.close()
        return
      }

      const {
        data: { user },
      } = await supabaseAuth.auth.getUser()

      if (!user?.id) {
        send(sseEvent('permissions', { permissionCodes: [], permissions: [] }))
        controller.close()
        return
      }

      let admin: SupabaseClient
      try {
        admin = createAdminClient()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Missing SUPABASE_SERVICE_ROLE_KEY for SSE updates'
        send(sseEvent('error', { message }))
        controller.close()
        return
      }

      // Send initial payload immediately.
      let lastJson = ''
      try {
        const payload = await fetchPermissionsForUser(admin, user.id)
        lastJson = JSON.stringify(payload)
        send(sseEvent('permissions', payload))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load permissions'
        send(sseEvent('error', { message }))
      }

      // Subscribe to DB changes (push updates immediately).
      const emitLatest = async () => {
        try {
          const payload = await fetchPermissionsForUser(admin, user.id)
          const json = JSON.stringify(payload)
          if (json !== lastJson) {
            lastJson = json
            send(sseEvent('permissions', payload))
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to refresh permissions'
          send(sseEvent('error', { message }))
        }
      }

      const channel = admin
        .channel(`permissions:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${user.id}` },
          () => void emitLatest()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'role_permissions' },
          () => void emitLatest()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'permissions' },
          () => void emitLatest()
        )
        .subscribe()

      // Poll fallback (covers cases where Realtime isn't enabled for a table).
      let tick = 0

      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval)
          try {
            await channel.unsubscribe()
          } catch {
            // ignore
          }
          try {
            controller.close()
          } catch {
            // ignore
          }
          return
        }

        // Heartbeat to keep the connection alive through proxies.
        tick += 1
        if (tick % 5 === 0) {
          send(`: ping ${Date.now()}\n\n`)
        }

        // Fallback check every ~10s.
        if (tick % 2 === 0) {
          await emitLatest()
        }
      }, 5000)
    },
    cancel() {
      close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

