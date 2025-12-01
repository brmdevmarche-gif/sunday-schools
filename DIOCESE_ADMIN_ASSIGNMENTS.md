# Diocese Admin Assignment System

## Overview

This feature allows multiple users to be assigned as administrators of dioceses. Instead of relying solely on a `role` field in the users table, we use a junction table (`diocese_admins`) for more flexible and granular permission management.

## Database Schema

### Table: `diocese_admins`

```sql
CREATE TABLE public.diocese_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diocese_id UUID NOT NULL REFERENCES public.dioceses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(diocese_id, user_id)
);
```

## Features

- ✅ **Multiple admins per diocese** - A diocese can have many administrators
- ✅ **Multiple dioceses per admin** - A user can be admin of multiple dioceses
- ✅ **Soft delete** - Revoke access without losing history using `is_active` flag
- ✅ **Audit trail** - Track who assigned each admin and when
- ✅ **Row Level Security** - Proper RLS policies for data protection
- ✅ **Helper functions** - Database functions for permission checks

## Installation

Run the migration file:

```bash
supabase db push
```

Or apply manually:

```bash
psql -f supabase/migrations/12_add_diocese_admin_assignments.sql
```

## Usage

### 1. Assign a User as Diocese Admin

```typescript
import { assignDioceseAdmin } from "@/lib/sunday-school/diocese-admins";

const result = await assignDioceseAdmin({
  diocese_id: "diocese-uuid",
  user_id: "user-uuid",
  notes: "Primary administrator for Cairo diocese"
});

if (result.error) {
  console.error("Error:", result.error);
} else {
  console.log("Admin assigned:", result.data);
}
```

### 2. Get All Admins for a Diocese

```typescript
import { getDioceseAdmins } from "@/lib/sunday-school/diocese-admins";

const { data, error } = await getDioceseAdmins("diocese-uuid");

if (data) {
  console.log("Diocese admins:", data);
}
```

### 3. Check if User is Diocese Admin

```typescript
import { isDioceseAdmin } from "@/lib/sunday-school/diocese-admins";

const isAdmin = await isDioceseAdmin("user-uuid", "diocese-uuid");

if (isAdmin) {
  // User has admin access
}
```

### 4. Get All Dioceses Where User is Admin

```typescript
import { getUserDioceseAdminRoles } from "@/lib/sunday-school/diocese-admins";

const { data, error } = await getUserDioceseAdminRoles("user-uuid");

if (data) {
  console.log("User is admin of these dioceses:", data);
}
```

### 5. Revoke Admin Access (Soft Delete)

```typescript
import { revokeDioceseAdmin } from "@/lib/sunday-school/diocese-admins";

const result = await revokeDioceseAdmin("diocese-uuid", "user-uuid");

if (result.success) {
  console.log("Admin access revoked");
}
```

### 6. Reactivate Admin Access

```typescript
import { reactivateDioceseAdmin } from "@/lib/sunday-school/diocese-admins";

const result = await reactivateDioceseAdmin("diocese-uuid", "user-uuid");

if (result.success) {
  console.log("Admin access reactivated");
}
```

### 7. Get Admins with User Details

```typescript
import { getDioceseAdminsWithUsers } from "@/lib/sunday-school/diocese-admins";

const { data, error } = await getDioceseAdminsWithUsers("diocese-uuid");

if (data) {
  data.forEach(admin => {
    console.log(`${admin.user.full_name} (${admin.user.email})`);
  });
}
```

## SQL Examples

### Assign Diocese Admin

```sql
INSERT INTO diocese_admins (diocese_id, user_id, notes)
VALUES (
  'diocese-uuid',
  'user-uuid',
  'Assigned as primary administrator'
);
```

### List All Admins for a Diocese

```sql
SELECT 
  da.*,
  u.email,
  u.full_name
FROM diocese_admins da
JOIN users u ON u.id = da.user_id
WHERE da.diocese_id = 'diocese-uuid'
  AND da.is_active = true
ORDER BY da.assigned_at DESC;
```

### Check if User is Admin

```sql
SELECT EXISTS (
  SELECT 1
  FROM diocese_admins
  WHERE diocese_id = 'diocese-uuid'
    AND user_id = 'user-uuid'
    AND is_active = true
) AS is_admin;
```

### Revoke Admin Access

```sql
UPDATE diocese_admins
SET is_active = false
WHERE diocese_id = 'diocese-uuid'
  AND user_id = 'user-uuid';
```

## Helper Functions

The migration includes several PostgreSQL helper functions:

### `is_diocese_admin(diocese_uuid UUID)`

Check if the current authenticated user is an admin of a specific diocese.

```sql
SELECT is_diocese_admin('diocese-uuid');
```

### `is_any_diocese_admin()`

Check if the current authenticated user is an admin of any diocese.

```sql
SELECT is_any_diocese_admin();
```

### `get_user_diocese_ids()`

Get all diocese IDs where the current authenticated user is an admin.

```sql
SELECT * FROM get_user_diocese_ids();
```

## Row Level Security (RLS)

The migration sets up comprehensive RLS policies:

1. **Super admins** can manage all diocese admin assignments
2. **Diocese admins** can view other admins in their dioceses
3. **Users** can view their own assignments
4. **Diocese policies** are updated to check the `diocese_admins` table
5. **Church policies** allow diocese admins to manage churches in their dioceses

## Migration from Old System

If you have existing users with `role = 'diocese_admin'` and a `diocese_id` set, you can migrate them by uncommenting this section in the migration file:

```sql
INSERT INTO public.diocese_admins (diocese_id, user_id, assigned_by, notes)
SELECT 
  diocese_id,
  id as user_id,
  NULL as assigned_by,
  'Migrated from existing diocese_admin role' as notes
FROM public.users
WHERE role = 'diocese_admin'
  AND diocese_id IS NOT NULL
  AND is_active = true
ON CONFLICT (diocese_id, user_id) DO NOTHING;
```

## Best Practices

1. **Always set `assigned_by`** - Track who granted admin access
2. **Use soft delete** - Revoke access with `is_active = false` instead of deleting
3. **Add notes** - Document why admin access was granted
4. **Review regularly** - Audit who has admin access periodically
5. **Principle of least privilege** - Only grant admin access when necessary

## API Routes (To be implemented)

Create API routes for managing diocese admins:

- `POST /api/admin/dioceses/[id]/admins` - Assign admin
- `GET /api/admin/dioceses/[id]/admins` - List admins
- `DELETE /api/admin/dioceses/[id]/admins/[userId]` - Revoke admin
- `PATCH /api/admin/dioceses/[id]/admins/[userId]` - Update admin

## UI Components (To be implemented)

Suggested components:

- `DioceseAdminList.tsx` - Display list of admins for a diocese
- `AssignDioceseAdminDialog.tsx` - Modal to assign new admin
- `DioceseAdminBadge.tsx` - Badge showing admin status

## Security Considerations

- ✅ RLS policies prevent unauthorized access
- ✅ Cascade deletes maintain referential integrity
- ✅ Unique constraint prevents duplicate assignments
- ✅ Soft delete preserves audit trail
- ✅ Helper functions use SECURITY DEFINER for consistent permissions

## Related Files

- Migration: `supabase/migrations/12_add_diocese_admin_assignments.sql`
- TypeScript types: `src/lib/types/sunday-school.ts`
- Helper functions: `src/lib/sunday-school/diocese-admins.ts`
- Documentation: `DIOCESE_ADMIN_ASSIGNMENTS.md` (this file)
