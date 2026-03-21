'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background: #0a0a0a; color: #ededed; }
            .ge-btn { background: #1a1a1a; border-color: #333; color: #ededed; }
            .ge-sub { color: #999; }
            .ge-digest { color: #666; }
          }
        `}</style>
      </head>
      <body>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            padding: '1rem',
          }}
        >
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p className="ge-sub" style={{ color: '#666', marginBottom: '1.5rem' }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="ge-digest" style={{ color: '#999', fontSize: '0.75rem', marginBottom: '1rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              className="ge-btn"
              onClick={reset}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #ccc',
                background: '#fff',
                color: '#0a0a0a',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
