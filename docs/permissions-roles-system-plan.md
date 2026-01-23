# Permissions & Roles System - Project Plan

**Created by:** Mary (Business Analyst)  
**Date:** 2024  
**Status:** Planning Phase

---

## 📋 Executive Summary

This document outlines the comprehensive plan for implementing a dynamic permissions and roles management system for the Sunday School Admin Panel. The system will replace the current hardcoded role-based access control with a flexible, database-driven permission system that auto-generates permissions for all admin panel features.

---

## 🎯 Objectives

1. **Auto-generate permissions** for every feature, functionality, view, and sidebar item in the admin panel
2. **Create a Role Management Module** with full CRUD operations
3. **Build a user-friendly UI** for role creation and management
4. **Maintain backward compatibility** with existing role system during transition
5. **Exclude student/parent views** from permissions (admin panel only)

---

## 📊 Current State Analysis

### Existing System

**Current Role Structure:**
- Hardcoded roles: `super_admin`, `diocese_admin`, `church_admin`, `teacher`, `parent`, `student`
- Role checks are scattered across:
  - `src/lib/sunday-school/permissions.ts` (server-side)
  - `src/components/admin/AdminLayout.tsx` (client-side navigation)
  - Individual page components

**Admin Panel Pages Identified (38 pages):**
1. Dashboard (`/admin`)
2. Dioceses (`/admin/dioceses`, `/admin/dioceses/[id]`)
3. Churches (`/admin/churches`, `/admin/churches/[id]`)
4. Classes (`/admin/classes`, `/admin/classes/[id]`, `/admin/classes/[id]/birthdays`, `/admin/classes/trips/[id]`)
5. Users (`/admin/users`, `/admin/users/[id]`)
6. Students (`/admin/students`, `/admin/students/[id]`)
7. Attendance (`/admin/attendance`, `/admin/attendance/stats`, `/admin/attendance/history`)
8. Activities (`/admin/activities`, `/admin/activities/create`, `/admin/activities/[id]`, `/admin/activities/competitions`, `/admin/activities/readings`, `/admin/activities/spiritual-notes`)
9. Trips (`/admin/trips`, `/admin/trips/create`, `/admin/trips/[id]`, `/admin/trips/[id]/edit`)
10. Store (`/admin/store`, `/admin/store/create`, `/admin/store/[id]`, `/admin/store/[id]/edit`, `/admin/store/orders`, `/admin/store/orders/create`)
11. Announcements (`/admin/announcements`, `/admin/announcements/create`, `/admin/announcements/[id]/edit`, `/admin/announcements/inbox`)
12. Settings (`/admin/settings`)

**Current Navigation Items (from AdminLayout.tsx):**
- Dashboard
- Quick Attendance
- Dioceses
- Churches
- Classes
- Attendance
- Students
- Users
- Store
- Activities
- Trips
- Announcements

---

## 🏗️ System Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Permission System                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐            │
│  │  Permissions │◄────────►│     Roles    │            │
│  │   (Auto-gen) │         │   (CRUD UI)  │            │
│  └──────┬───────┘         └──────┬───────┘            │
│         │                        │                      │
│         │                        │                      │
│         └──────────┬─────────────┘                      │
│                    │                                    │
│                    ▼                                    │
│            ┌──────────────┐                             │
│            │ User-Role    │                             │
│            │ Assignment   │                             │
│            └──────────────┘                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Permission Structure

**Permission Format:** `{module}.{resource}.{action}`

**Examples:**
- `dioceses.view` - View dioceses list
- `dioceses.create` - Create new diocese
- `dioceses.update` - Edit diocese
- `dioceses.delete` - Delete diocese
- `churches.view` - View churches list
- `churches.create` - Create new church
- `classes.view` - View classes
- `classes.assign_teachers` - Assign teachers to classes
- `users.view` - View users list
- `users.create` - Create new user
- `attendance.mark` - Mark attendance
- `store.orders.view` - View store orders

### Permission Categories (Modules)

1. **Dashboard** - `dashboard.*`
2. **Dioceses** - `dioceses.*`
3. **Churches** - `churches.*`
4. **Classes** - `classes.*`
5. **Users** - `users.*`
6. **Students** - `students.*`
7. **Attendance** - `attendance.*`
8. **Activities** - `activities.*`
9. **Trips** - `trips.*`
10. **Store** - `store.*`
11. **Announcements** - `announcements.*`
12. **Settings** - `settings.*`
13. **Roles** - `roles.*` (for managing roles themselves)

---

## 🗄️ Database Schema

### New Tables

#### 1. `permissions` Table

```sql
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- e.g., "dioceses.view"
  name TEXT NOT NULL, -- e.g., "View Dioceses"
  description TEXT,
  module TEXT NOT NULL, -- e.g., "dioceses"
  resource TEXT NOT NULL, -- e.g., "dioceses"
  action TEXT NOT NULL, -- e.g., "view", "create", "update", "delete"
  category TEXT, -- e.g., "navigation", "action", "view"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_module ON public.permissions(module);
CREATE INDEX idx_permissions_code ON public.permissions(code);
CREATE INDEX idx_permissions_category ON public.permissions(category);
```

#### 2. `roles` Table

```sql
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- For built-in roles like super_admin
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roles_title ON public.roles(title);
CREATE INDEX idx_roles_is_active ON public.roles(is_active);
```

#### 3. `role_permissions` Table (Junction)

```sql
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);
```

#### 4. `user_roles` Table (Junction)

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);
```

### Migration Strategy

**Option 1: Keep existing `users.role` column**
- Maintain backward compatibility
- Map existing roles to new role records
- Gradually migrate users to new system

**Option 2: Replace `users.role` with `user_roles`**
- More flexible (users can have multiple roles)
- Requires migration script for existing users

**Recommended: Option 1** (backward compatible)

---

## 📝 Permission Auto-Generation Strategy

### Permission Registry

Create a centralized permission registry that defines all permissions:

**File:** `src/lib/permissions/registry.ts`

```typescript
export const PERMISSION_REGISTRY = {
  dashboard: {
    view: {
      name: "View Dashboard",
      description: "Access to the admin dashboard",
      category: "navigation"
    }
  },
  dioceses: {
    view: {
      name: "View Dioceses",
      description: "View dioceses list",
      category: "navigation"
    },
    create: {
      name: "Create Diocese",
      description: "Create new diocese",
      category: "action"
    },
    update: {
      name: "Update Diocese",
      description: "Edit existing diocese",
      category: "action"
    },
    delete: {
      name: "Delete Diocese",
      description: "Delete diocese",
      category: "action"
    },
    view_detail: {
      name: "View Diocese Details",
      description: "View individual diocese details",
      category: "view"
    }
  },
  // ... continue for all modules
}
```

### Auto-Generation Process

1. **Initial Seed Migration**
   - Read permission registry
   - Insert all permissions into database
   - Create system roles (super_admin, etc.) with appropriate permissions

2. **Runtime Permission Check**
   - Check user's roles
   - Get all permissions for those roles
   - Verify permission exists before allowing action

3. **Navigation Generation**
   - Filter navigation items based on user's permissions
   - Only show items user has `view` permission for

---

## 🎨 UI/UX Specifications

### 1. Roles List Page (`/admin/roles`)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Roles Management                    [+ Create Role] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Search: [____________]  Filter: [All ▼]    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Title        │ Description    │ Permissions │   │
│  ├──────────────┼────────────────┼─────────────┤   │
│  │ Super Admin  │ Full access... │ 45          │   │
│  │ Diocese Admin│ Manage...      │ 32          │   │
│  │ Church Admin │ Manage...      │ 28          │   │
│  │ Teacher      │ Manage...      │ 15          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Table Columns:**
- Title
- Description (truncated)
- Number of Permissions
- Status (Active/Inactive)
- Actions (Edit, Delete, View Details)

**Features:**
- Search by title/description
- Filter by status
- Sort by title, created date
- Pagination

### 2. Create/Edit Role Page (`/admin/roles/create` or `/admin/roles/[id]/edit`)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Create New Role                          [Cancel]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Basic Information                             │   │
│  ├──────────────────────────────────────────────┤   │
│  │ Title *          [________________]           │   │
│  │ Description     [________________]            │   │
│  │                 [________________]            │   │
│  │                 [________________]            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Permissions                                    │   │
│  ├──────────────────────────────────────────────┤   │
│  │                                               │   │
│  │  ▼ Dashboard                                  │   │
│  │    ☑ View Dashboard                           │   │
│  │                                               │   │
│  │  ▼ Dioceses                                   │   │
│  │    ☑ View Dioceses                            │   │
│  │    ☑ Create Diocese                           │   │
│  │    ☑ Update Diocese                           │   │
│  │    ☑ Delete Diocese                           │   │
│  │    ☐ View Diocese Details                     │   │
│  │                                               │   │
│  │  ▼ Churches                                   │   │
│  │    ☑ View Churches                            │   │
│  │    ☑ Create Church                            │   │
│  │    ...                                        │   │
│  │                                               │   │
│  │  [Select All] [Deselect All]                  │   │
│  │  Selected: 12 permissions                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Cancel]                    [Create Role]    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Form Fields:**
1. **Title** (required, unique, max 100 chars)
2. **Description** (optional, textarea, max 500 chars)
3. **Permissions** (required, at least 1)
   - Grouped by module
   - Expandable/collapsible sections
   - Checkbox for each permission
   - Search/filter within permissions
   - Select All / Deselect All per module
   - Show count of selected permissions

**Validation:**
- Title: Required, unique, 3-100 characters
- Description: Optional, max 500 characters
- Permissions: At least 1 permission must be selected
- Show validation errors inline

**Actions:**
- Cancel: Navigate back to roles list (with unsaved changes warning)
- Create/Update: Submit form, show success message, redirect to roles list

---

## 🔧 Implementation Plan

### Phase 1: Database Setup

**Tasks:**
1. Create migration file: `XX_create_permissions_system.sql`
   - Create `permissions` table
   - Create `roles` table
   - Create `role_permissions` junction table
   - Create `user_roles` junction table
   - Add indexes
   - Enable RLS policies

2. Create permission seed migration: `XX_seed_permissions.sql`
   - Insert all permissions from registry
   - Create system roles
   - Assign permissions to system roles

**Files:**
- `supabase/migrations/XX_create_permissions_system.sql`
- `supabase/migrations/XX_seed_permissions.sql`

### Phase 2: Backend Foundation

**Tasks:**
1. Create permission registry
2. Create TypeScript types
3. Create database helper functions
4. Create permission checking utilities

**Files:**
- `src/lib/permissions/registry.ts` - Permission definitions
- `src/lib/types/permissions.ts` - TypeScript types
- `src/lib/sunday-school/permissions.ts` - Updated permission checks
- `src/lib/sunday-school/roles.ts` - Role CRUD operations
- `src/lib/sunday-school/role-permissions.ts` - Role-permission management

### Phase 3: UI Components

**Tasks:**
1. Create roles list page
2. Create role form component
3. Create permission selector component
4. Update navigation to use permissions

**Files:**
- `src/app/admin/roles/page.tsx` - Roles list
- `src/app/admin/roles/create/page.tsx` - Create role
- `src/app/admin/roles/[id]/edit/page.tsx` - Edit role
- `src/components/admin/roles/RolesTable.tsx` - Roles table component
- `src/components/admin/roles/RoleForm.tsx` - Role form component
- `src/components/admin/roles/PermissionSelector.tsx` - Permission checkbox groups
- `src/app/admin/roles/actions.ts` - Server actions

### Phase 4: Integration

**Tasks:**
1. Update AdminLayout to use permissions for navigation
2. Update page components to check permissions
3. Add permission checks to actions
4. Update RLS policies to use new system

**Files:**
- `src/components/admin/AdminLayout.tsx` - Updated navigation
- Individual page components - Add permission checks
- `src/lib/sunday-school/permissions.ts` - Permission checking functions

### Phase 5: Migration & Testing

**Tasks:**
1. Create migration script for existing users
2. Test permission system
3. Test role creation/editing
4. Test navigation filtering
5. Test access control

---

## 📋 Detailed Permission List

### Dashboard Module
- `dashboard.view` - View Dashboard

### Dioceses Module
- `dioceses.view` - View Dioceses List
- `dioceses.create` - Create Diocese
- `dioceses.update` - Update Diocese
- `dioceses.delete` - Delete Diocese
- `dioceses.view_detail` - View Diocese Details

### Churches Module
- `churches.view` - View Churches List
- `churches.create` - Create Church
- `churches.update` - Update Church
- `churches.delete` - Delete Church
- `churches.view_detail` - View Church Details

### Classes Module
- `classes.view` - View Classes List
- `classes.create` - Create Class
- `classes.update` - Update Class
- `classes.delete` - Delete Class
- `classes.view_detail` - View Class Details
- `classes.assign_teachers` - Assign Teachers to Class
- `classes.assign_students` - Assign Students to Class
- `classes.view_birthdays` - View Class Birthdays
- `classes.view_trips` - View Class Trips

### Users Module
- `users.view` - View Users List
- `users.create` - Create User
- `users.update` - Update User
- `users.delete` - Delete User
- `users.view_detail` - View User Details
- `users.assign_roles` - Assign Roles to User

### Students Module
- `students.view` - View Students List
- `students.create` - Create Student
- `students.update` - Update Student
- `students.delete` - Delete Student
- `students.view_detail` - View Student Details

### Attendance Module
- `attendance.view` - View Attendance
- `attendance.mark` - Mark Attendance
- `attendance.view_stats` - View Attendance Statistics
- `attendance.view_history` - View Attendance History
- `attendance.update` - Update Attendance Record

### Activities Module
- `activities.view` - View Activities List
- `activities.create` - Create Activity
- `activities.update` - Update Activity
- `activities.delete` - Delete Activity
- `activities.view_detail` - View Activity Details
- `activities.view_competitions` - View Competitions
- `activities.view_readings` - View Readings
- `activities.view_spiritual_notes` - View Spiritual Notes
- `activities.manage_participants` - Manage Activity Participants

### Trips Module
- `trips.view` - View Trips List
- `trips.create` - Create Trip
- `trips.update` - Update Trip
- `trips.delete` - Delete Trip
- `trips.view_detail` - View Trip Details
- `trips.manage_participants` - Manage Trip Participants
- `trips.approve_registrations` - Approve Trip Registrations

### Store Module
- `store.view` - View Store Items
- `store.create` - Create Store Item
- `store.update` - Update Store Item
- `store.delete` - Delete Store Item
- `store.view_detail` - View Store Item Details
- `store.orders.view` - View Store Orders
- `store.orders.create` - Create Store Order
- `store.orders.update` - Update Store Order
- `store.manage_inventory` - Manage Inventory

### Announcements Module
- `announcements.view` - View Announcements
- `announcements.create` - Create Announcement
- `announcements.update` - Update Announcement
- `announcements.delete` - Delete Announcement
- `announcements.view_inbox` - View Announcements Inbox

### Settings Module
- `settings.view` - View Settings
- `settings.update` - Update Settings

### Roles Module (Meta)
- `roles.view` - View Roles List
- `roles.create` - Create Role
- `roles.update` - Update Role
- `roles.delete` - Delete Role
- `roles.view_detail` - View Role Details

---

## 🔐 Security Considerations

1. **RLS Policies**
   - Only super_admin can create/edit/delete roles
   - Users can only view roles they have permission to see
   - Permission checks at database level

2. **Permission Inheritance**
   - Consider if roles should inherit from other roles
   - For now: flat structure (roles have direct permissions)

3. **System Roles Protection**
   - System roles (super_admin, etc.) cannot be deleted
   - System roles cannot have permissions removed (or with warning)

4. **Audit Trail**
   - Track who created/modified roles
   - Track permission changes

---

## ✅ Success Criteria

1. ✅ All admin panel features have corresponding permissions
2. ✅ Permissions are auto-generated from registry
3. ✅ Roles can be created/edited/deleted via UI
4. ✅ Permission selection UI is intuitive and grouped by module
5. ✅ Navigation items filter based on user permissions
6. ✅ Page access is controlled by permissions
7. ✅ Backward compatibility maintained during transition
8. ✅ System roles are preserved and functional

---

## 📅 Estimated Timeline

- **Phase 1 (Database):** 2-3 hours
- **Phase 2 (Backend):** 4-6 hours
- **Phase 3 (UI):** 6-8 hours
- **Phase 4 (Integration):** 4-6 hours
- **Phase 5 (Testing):** 2-3 hours

**Total:** 18-26 hours

---

## 🚀 Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database Setup)
3. Create permission registry with all identified permissions
4. Build UI components
5. Integrate with existing system
6. Test thoroughly
7. Deploy

---

## 📝 Notes

- Student and parent views are explicitly excluded from permissions
- Only admin panel features need permissions
- Consider adding permission descriptions for better UX
- May want to add "permission groups" for easier bulk selection in future
- Consider adding role templates/presets for common role types

---

**End of Document**
