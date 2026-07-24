import type { Metadata } from 'next'
import { getAuthUser } from '@/lib/auth-guard'
import DocsClient from './DocsClient'

export const metadata: Metadata = {
  title: 'Documentation',
}

export default async function DocsPage() {
  // Try to get the current user's role, but don't redirect if not authenticated
  let userRole = null
  let isAuthenticated = false

  try {
    const authUser = await getAuthUser()
    if (authUser) {
      userRole = authUser.role
      isAuthenticated = true
    }
  } catch {
    // User not authenticated, continue as public user
  }

  return (
    <DocsClient
      userRole={userRole}
      isAuthenticated={isAuthenticated}
    />
  )
}
