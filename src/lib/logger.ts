const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  error: (message: string, context?: unknown) => {
    // Always log errors — in production, replace with external service
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
