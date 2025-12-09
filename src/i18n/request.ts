import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'

// Supported locales
export const locales = ['en', 'ar'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async () => {
  // Get locale from header set by middleware or default to 'en'
  let locale: Locale = 'en'

  try {
    const headersList = await headers()
    const headerLocale = headersList.get('x-next-intl-locale')

    // Validate that the locale from header is one of our supported locales
    if (headerLocale && locales.includes(headerLocale as Locale)) {
      locale = headerLocale as Locale
    }
  } catch (error) {
    // Headers might not be available in all contexts (e.g., during build)
    // Fall back to default locale 'en'
    // This is expected during build time, so we can safely ignore
  }

  // Always return a valid configuration object
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
