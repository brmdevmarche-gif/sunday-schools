# Permission Components - Usage Examples

This document shows how to use the permission components and hooks in your application.

## React Hook: `usePermissions`

Use this hook in client components to check permissions.

```tsx
'use client'

import { usePermissions } from '@/hooks/usePermissions'

export default function MyComponent() {
  const { hasPermission, isLoading, permissionCodes } = usePermissions()

  if (isLoading) {
    return <div>Loading permissions...</div>
  }

  if (!hasPermission('dioceses.view')) {
    return <div>You don't have access</div>
  }

  return <div>Your content here</div>
}
```

### Check Single Permission

```tsx
import { useHasPermission } from '@/hooks/usePermissions'

export default function MyComponent() {
  const canView = useHasPermission('dioceses.view')
  
  if (!canView) return null
  
  return <div>Content</div>
}
```

## Component: `PermissionGuard`

Wrap content that requires specific permissions.

```tsx
'use client'

import { PermissionGuard } from '@/components/admin/PermissionGuard'

export default function DiocesesPage() {
  return (
    <PermissionGuard permission="dioceses.view" redirectTo="/admin">
      <DiocesesList />
    </PermissionGuard>
  )
}
```

### Multiple Permissions (ANY)

```tsx
<PermissionGuard 
  permission={['dioceses.view', 'churches.view']}
  requireAll={false}
>
  <Content />
</PermissionGuard>
```

### Multiple Permissions (ALL)

```tsx
<PermissionGuard 
  permission={['dioceses.view', 'dioceses.create']}
  requireAll={true}
>
  <Content />
</PermissionGuard>
```

### Custom Fallback

```tsx
<PermissionGuard 
  permission="dioceses.view"
  fallback={<div>Custom access denied message</div>}
>
  <Content />
</PermissionGuard>
```

## Component: `PageWithPermissions`

Use in server components to check permissions before rendering.

```tsx
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'
import DiocesesClient from './DiocesesClient'

export default async function DiocesesPage() {
  return (
    <PageWithPermissions permission="dioceses.view">
      <DiocesesClient />
    </PageWithPermissions>
  )
}
```

### Multiple Permissions

```tsx
<PageWithPermissions 
  permission={['dioceses.view', 'dioceses.create']}
  requireAll={false}
  redirectTo="/admin"
>
  <Content />
</PageWithPermissions>
```

## Component: `PermissionButton`

Button that only shows if user has permission.

```tsx
'use client'

import { PermissionButton } from '@/components/admin/PermissionButton'

export default function DiocesesList() {
  return (
    <div>
      <PermissionButton
        permission="dioceses.create"
        onClick={handleCreate}
        tooltip="You need permission to create dioceses"
      >
        Create Diocese
      </PermissionButton>
    </div>
  )
}
```

## Server-Side Permission Checks

For server components and actions:

```tsx
import { hasPermission } from '@/lib/permissions/check'
import { redirect } from 'next/navigation'

export default async function DiocesesPage() {
  const canView = await hasPermission('dioceses.view')
  
  if (!canView) {
    redirect('/admin')
  }
  
  return <div>Content</div>
}
```

### In Server Actions

```tsx
'use server'

import { hasPermission } from '@/lib/permissions/check'

export async function createDioceseAction(input: CreateDioceseInput) {
  const canCreate = await hasPermission('dioceses.create')
  
  if (!canCreate) {
    return { 
      success: false, 
      error: 'You do not have permission to create dioceses' 
    }
  }
  
  // Proceed with creation...
}
```

## Conditional Rendering

```tsx
'use client'

import { usePermissions } from '@/hooks/usePermissions'

export default function DiocesesList() {
  const { hasPermission, hasAnyPermission } = usePermissions()
  
  return (
    <div>
      {hasPermission('dioceses.view') && (
        <DiocesesList />
      )}
      
      {hasPermission('dioceses.create') && (
        <Button onClick={handleCreate}>Create</Button>
      )}
      
      {hasAnyPermission(['dioceses.update', 'dioceses.delete']) && (
        <ActionsMenu />
      )}
    </div>
  )
}
```

## Best Practices

1. **Always check server-side** - Client-side checks are for UX only
2. **Use guards for pages** - `PageWithPermissions` or `PermissionGuard`
3. **Use hooks for conditional rendering** - `usePermissions` in client components
4. **Use buttons for actions** - `PermissionButton` for action buttons
5. **Provide fallbacks** - Show helpful messages when access is denied

## Complete Example

```tsx
// app/admin/dioceses/page.tsx (Server Component)
import { PageWithPermissions } from '@/components/admin/PageWithPermissions'
import DiocesesClient from './DiocesesClient'
import { getAllDioceses } from './actions'

export default async function DiocesesPage() {
  const dioceses = await getAllDioceses()
  
  return (
    <PageWithPermissions permission="dioceses.view">
      <DiocesesClient initialDioceses={dioceses} />
    </PageWithPermissions>
  )
}
```

```tsx
// app/admin/dioceses/DiocesesClient.tsx (Client Component)
'use client'

import { PermissionButton } from '@/components/admin/PermissionButton'
import { usePermissions } from '@/hooks/usePermissions'

export default function DiocesesClient({ initialDioceses }) {
  const { hasPermission } = usePermissions()
  
  return (
    <div>
      <div className="flex justify-between">
        <h1>Dioceses</h1>
        <PermissionButton
          permission="dioceses.create"
          onClick={handleCreate}
        >
          Create Diocese
        </PermissionButton>
      </div>
      
      {hasPermission('dioceses.view') && (
        <DiocesesTable dioceses={initialDioceses} />
      )}
    </div>
  )
}
```
