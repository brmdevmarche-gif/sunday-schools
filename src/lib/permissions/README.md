# Permissions & Roles System

This document explains how to use the permissions and roles system in the Sunday School Admin Panel.

## Overview

The permissions system provides:
- **Dynamic permissions** - Auto-generated for all admin panel features
- **Role management** - Create custom roles with specific permissions
- **Permission-based navigation** - Sidebar automatically filters based on user permissions
- **Access control** - Check permissions in page components

## Database Structure

### Tables
- `permissions` - All available permissions
- `roles` - Custom and system roles
- `role_permissions` - Links roles to permissions (many-to-many)
- `user_roles` - Links users to roles (many-to-many)

### System Roles
- **Super Admin** - All permissions
- **Diocese Admin** - Diocese-level management
- **Church Admin** - Church-level management
- **Teacher** - Class and attendance management

## Usage

### 1. Checking Permissions in Page Components

#### Server Components

```typescript
import { hasPermission, checkPermissionWithRedirect } from '@/lib/permissions/check'
import { redirect } from 'next/navigation'

export default async function DiocesesPage() {
  // Simple check
  const canView = await hasPermission('dioceses.view')
  if (!canView) {
    redirect('/admin')
  }

  // Or use the helper with redirect
  const check = await checkPermissionWithRedirect('dioceses.view', '/admin')
  if (!check.hasPermission) {
    redirect(check.redirectTo!)
  }

  // Your page content...
}
```

#### Client Components

```typescript
'use client'
import { currentUserHasPermission } from '@/lib/sunday-school/roles.client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SomeClientComponent() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      const canAccess = await currentUserHasPermission('dioceses.view')
      if (!canAccess) {
        router.push('/admin')
        return
      }
      setHasAccess(true)
      setLoading(false)
    }
    checkAccess()
  }, [router])

  if (loading) return <div>Loading...</div>
  if (!hasAccess) return null

  return <div>Your content...</div>
}
```

### 2. Checking Multiple Permissions

```typescript
import { hasAnyPermission, hasAllPermissions } from '@/lib/permissions/check'

// User needs ANY of these permissions
const canEdit = await hasAnyPermission([
  'dioceses.update',
  'dioceses.create',
])

// User needs ALL of these permissions
const canManage = await hasAllPermissions([
  'dioceses.view',
  'dioceses.update',
])
```

### 3. Getting User Permissions

```typescript
import { getUserPermissions } from '@/lib/permissions/check'

// Get all permissions for current user
const permissions = await getUserPermissions()

// Get permissions for specific user
const userPermissions = await getUserPermissions(userId)
```

### 4. Permission Codes

Permission codes follow the pattern: `{module}.{action}`

Examples:
- `dashboard.view` - View dashboard
- `dioceses.view` - View dioceses list
- `dioceses.create` - Create diocese
- `dioceses.update` - Update diocese
- `dioceses.delete` - Delete diocese
- `users.view` - View users
- `roles.view` - View roles

### 5. Creating Custom Roles

1. Navigate to `/admin/roles`
2. Click "Create Role"
3. Enter title and description
4. Select permissions (grouped by module)
5. Save

### 6. Assigning Roles to Users

Currently, roles must be assigned via database or API. UI for this will be added in the user management page.

```sql
-- Assign role to user
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
VALUES (
  'user-uuid',
  'role-uuid',
  'current-user-uuid'
);
```

## Migration Guide

### For Existing Code

If you have existing role-based checks, you can gradually migrate:

**Before:**
```typescript
if (user.role === 'super_admin') {
  // Show content
}
```

**After:**
```typescript
if (await hasPermission('dioceses.view')) {
  // Show content
}
```

### Navigation

Navigation is automatically filtered based on permissions. No changes needed to existing navigation code.

## Permission Registry

All permissions are defined in `src/lib/permissions/registry.ts`. To add a new permission:

1. Add it to the registry
2. Run the seed migration to add it to the database
3. Assign it to appropriate roles

## Best Practices

1. **Always check permissions** - Don't rely solely on UI hiding
2. **Use specific permissions** - Check for the exact action needed
3. **Server-side checks** - Always validate permissions server-side
4. **Client-side UX** - Use client-side checks for better UX (but not security)
5. **Error handling** - Handle permission errors gracefully

## Troubleshooting

### Navigation items not showing
- Check if user has the required permission
- Verify role is assigned to user
- Check if permission is active in database

### Permission checks failing
- Verify user has a role assigned
- Check role has the permission
- Ensure permission code matches exactly

### Migration issues
- Run migrations in order: 47, 48, 49
- Check existing users are mapped to roles
- Verify system roles exist

## API Reference

### Server-side Functions

- `hasPermission(code, userId?)` - Check single permission
- `hasAnyPermission(codes[], userId?)` - Check any permission
- `hasAllPermissions(codes[], userId?)` - Check all permissions
- `getUserPermissions(userId?)` - Get all user permissions
- `checkPermissionWithRedirect(code, redirectTo, userId?)` - Check with redirect

### Client-side Functions

- `getUserPermissionCodes()` - Get permission codes array
- `currentUserHasPermission(code)` - Check current user permission
- `getCurrentUserPermissions()` - Get full permission objects
