'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export function OfflineDetector() {
  const t = useTranslations('errors')

  useEffect(() => {
    const handleOffline = () => toast.error(t('networkError'))
    const handleOnline = () => toast.success(t('connectionRestored'))

    globalThis.addEventListener('offline', handleOffline)
    globalThis.addEventListener('online', handleOnline)
    return () => {
      globalThis.removeEventListener('offline', handleOffline)
      globalThis.removeEventListener('online', handleOnline)
    }
  }, [t])

  return null
}
