'use client'

import { useEffect, useState } from 'react'
import { detectSuspiciousActivity, getLastSuccessfulLogin, type LoginHistoryEntry } from '@/lib/login-history'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SecurityAlerts() {
  const [hasSuspiciousActivity, setHasSuspiciousActivity] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [lastLogin, setLastLogin] = useState<LoginHistoryEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkSecurity() {
      try {
        const { hasSuspiciousActivity: suspicious, reasons: alertReasons } = await detectSuspiciousActivity()
        setHasSuspiciousActivity(suspicious)
        setReasons(alertReasons)

        const previousLogin = await getLastSuccessfulLogin()
        setLastLogin(previousLogin)
      } catch (error) {
        console.error('Error checking security:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSecurity()
  }, [])

  if (isLoading) {
    return null
  }

  // If there are security alerts, show warning
  if (hasSuspiciousActivity) {
    return (
      <Card className="border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950">
        <CardHeader>
          <CardTitle className="text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
            <span>⚠️</span> Security Alert
          </CardTitle>
          <CardDescription className="text-yellow-800 dark:text-yellow-200">
            We detected some unusual activity on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-yellow-900 dark:text-yellow-100">
            {reasons.map((reason, index) => (
              <li key={index} className="text-sm">
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-yellow-800 dark:text-yellow-200">
            If this was not you, please change your password immediately and review your login history below.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show last login info if available
  if (lastLogin) {
    return (
      <Card className="border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
            <span>✓</span> Welcome Back!
          </CardTitle>
          <CardDescription className="text-green-800 dark:text-green-200">
            Your last login was:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-green-900 dark:text-green-100">
            {lastLogin.device_info && (
              <p>
                <span className="font-semibold">Device:</span> {lastLogin.device_info}
              </p>
            )}
            {lastLogin.ip_address && (
              <p>
                <span className="font-semibold">IP Address:</span> {lastLogin.ip_address}
              </p>
            )}
            <p>
              <span className="font-semibold">Time:</span>{' '}
              {new Date(lastLogin.created_at).toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-green-800 dark:text-green-200 mt-2">
            If you don&apos;t recognize this activity, please review your login history below.
          </p>
        </CardContent>
      </Card>
    )
  }

  // No alerts and no previous login (first time login)
  return (
    <Card className="border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <span>👋</span> Welcome to Your Account!
        </CardTitle>
        <CardDescription className="text-blue-800 dark:text-blue-200">
          This is your first login. Your account is secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-900 dark:text-blue-100">
          We&apos;ll track your login activity to help keep your account secure. You can review
          your login history anytime from this dashboard.
        </p>
      </CardContent>
    </Card>
  )
}
