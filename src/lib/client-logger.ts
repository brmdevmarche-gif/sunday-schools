const isDev = process.env.NODE_ENV === 'development'

/**
 * Client-safe structured logger for browser-side code.
 * In development: logs to browser console.
 * In production: suppresses info/debug/warn, only logs errors.
 */
export const clientLogger = {
  error: (message: string, context?: unknown) => {
    console.error(`[ERROR] ${message}`, context !== undefined ? context : '')
  },
  warn: (message: string, context?: unknown) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, context !== undefined ? context : '')
    }
  },
  info: (message: string, context?: unknown) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, context !== undefined ? context : '')
    }
  },
  debug: (message: string, context?: unknown) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, context !== undefined ? context : '')
    }
  },
}
