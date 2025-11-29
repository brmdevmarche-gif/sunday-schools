'use client'

import { useEffect, useState } from 'react'
import { getLoginHistory, type LoginHistoryEntry } from '@/lib/login-history'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginHistoryProps {
  limit?: number
}

export default function LoginHistory({ limit = 10 }: LoginHistoryProps) {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getLoginHistory(limit)
        setHistory(data)
      } catch (error) {
        console.error('Error loading login history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [limit])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent login attempts to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent login attempts to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No login history available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login History</CardTitle>
        <CardDescription>Recent login attempts to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-lg border ${
                entry.success
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        entry.success
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                      }`}
                    >
                      {entry.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    {entry.device_info && (
                      <p className="text-sm">
                        <span className="font-semibold">Device:</span> {entry.device_info}
                      </p>
                    )}

                    {entry.ip_address && (
                      <p className="text-sm">
                        <span className="font-semibold">IP Address:</span> {entry.ip_address}
                      </p>
                    )}

                    {entry.location && (
                      <p className="text-sm">
                        <span className="font-semibold">Location:</span> {entry.location}
                      </p>
                    )}

                    {!entry.success && entry.failure_reason && (
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <span className="font-semibold">Reason:</span> {entry.failure_reason}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {history.length >= limit && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Showing {limit} most recent login attempts
          </p>
        )}
      </CardContent>
    </Card>
  )
}
