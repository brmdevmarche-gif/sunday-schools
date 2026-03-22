'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { clientLogger } from '@/lib/client-logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    clientLogger.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>{t('somethingWentWrong')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('unexpectedError')}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              {t('errorId', { digest: error.digest })}
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={reset}>{t('tryAgain')}</Button>
            <Button
              variant="outline"
              onClick={() => (globalThis.location.href = '/dashboard')}
            >
              {t('goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
