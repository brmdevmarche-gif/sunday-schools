'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getPermissionByCode } from '@/lib/permissions/registry'

interface UnauthorizedPageProps {
  permission?: string | string[]
  message?: string
}

export function UnauthorizedPage({ 
  permission, 
  message 
}: UnauthorizedPageProps) {
  const router = useRouter()
  const permissions = permission ? (Array.isArray(permission) ? permission : [permission]) : []
  
  // Get friendly permission names
  const permissionNames = permissions
    .map(perm => {
      const permInfo = getPermissionByCode(perm)
      return permInfo ? permInfo.definition.name : null
    })
    .filter((name): name is string => name !== null)
  
  // Determine the main title based on permissions
  const getTitle = () => {
    if (permissionNames.length === 0) {
      return "Access Denied"
    }
    if (permissionNames.length === 1) {
      return permissionNames[0]
    }
    // For multiple permissions, use a generic title
    return "Access Denied"
  }
  
  const title = getTitle()
  const defaultMessage = permissionNames.length > 0
    ? `You need the following permission${permissionNames.length > 1 ? 's' : ''} to access this page:`
    : "You do not have permission to access this page."
  
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ShieldX className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">{title}</CardTitle>
          </div>
          <CardDescription className="text-base">
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {permissionNames.length > 0 && (
            <div className="space-y-2">
              {permissionNames.map((name, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/admin">
                <Home className="me-2 h-4 w-4" />
                Go to Admin Dashboard
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="me-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
