# Knasty Portal - AI Coding Agent Instructions

## Project Overview

**Knasty Portal** is a Sunday School Management System for Coptic Orthodox churches with multi-tenant architecture (Diocese → Church → Class), built with Next.js 16, Supabase, and TypeScript.

## Critical Architecture Patterns

### Server-First Architecture

This project uses **Next.js 16 App Router with strict Server Components by default**:

- **Server Components** (default): Pages in `src/app/*/page.tsx` fetch data directly using `await`
- **Client Components**: Only when interactivity is needed (use `'use client'` directive)
- **Server Actions**: All mutations go in `actions.ts` files with `'use server'` directive

**Pattern Example** (`src/app/admin/churches/`):

```typescript
// page.tsx - Server Component (no 'use client')
export default async function ChurchesPage() {
  const [churches, dioceses] = await Promise.all([
    getAllChurchesWithClassCounts(),
    getDiocesesData(),
  ]);
  return <ChurchesClient initialChurches={churches} dioceses={dioceses} />;
}

// actions.ts - Server Actions
("use server");
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createChurchAction(input: CreateChurchInput) {
  const supabase = await createClient();
  // ... mutation logic
  revalidatePath("/admin/churches");
}

// ChurchesClient.tsx - Client Component
("use client");
export default function ChurchesClient({ initialChurches, dioceses }) {
  // Interactive UI, forms, dialogs
  const [isPending, startTransition] = useTransition();
  // Call server actions via startTransition
}
```

### Supabase Client Creation

**CRITICAL**: Always use the correct Supabase client:

- **Server Components/Actions**: `import { createClient } from '@/lib/supabase/server'` then `await createClient()`
- **Client Components**: `import { createClient } from '@/lib/supabase/client'` (singleton)
- **Middleware**: `import { updateSession } from '@/lib/supabase/middleware'`

Server client uses `next/headers` cookies - MUST be awaited: `const supabase = await createClient()`

### Internationalization (i18n)

Bilingual support (English/Arabic) with next-intl:

- Middleware detects locale from cookie (`NEXT_LOCALE`) and sets header (`x-next-intl-locale`)
- Use `useTranslations()` in client components: `const t = useTranslations(); t('admin.churches.title')`
- Use `await getTranslations()` in server components
- Translation keys in `messages/en.json` and `messages/ar.json`
- RTL support for Arabic via `dir` attribute

### Authentication & Authorization

Role-based access with Supabase Auth + RLS:

- Roles: `super_admin`, `diocese_admin`, `church_admin`, `teacher`, `student`, `parent`
- Get current user in server actions: `const { data: { user } } = await supabase.auth.getUser()`
- Middleware handles session refresh and route protection (see `src/middleware.ts`)
- RLS policies enforce data access at database level

## Database & Migrations

### Multi-Tenant Hierarchy

```
Diocese (id, name, theme_primary_color, theme_secondary_color, logo_image_url)
  ↓
Church (id, name, diocese_id, logo_image_url, cover_image_url)
  ↓
Class (id, name, church_id, teacher_id)
  ↓
Students (assigned via class_assignments)
```

### Migration Management

- **33 migrations** in `supabase/migrations/` (numbered sequentially)
- **Master setup**: `00_FRESH_DATABASE_SETUP.sql` creates complete schema
- Apply migrations via Supabase Dashboard SQL Editor
- After schema changes: run `revalidatePath()` in server actions to refresh caches

### Key Tables

- `users` - Central user table (replaces profiles)
- `dioceses`, `churches`, `classes` - Organizational hierarchy
- `class_assignments` - Links students/teachers to classes with role
- `activities`, `trips`, `store_items`, `store_orders` - Feature modules
- `announcements` - Targeted communications with audience/role filtering
- `user_settings` - Per-user preferences (theme, locale, timezone)

## Type System

### Modular Type Organization

Types moved from monolithic to modular structure:

- **Old** (deprecated): `import type { Trip } from '@/lib/types/sunday-school'`
- **New**: `import type { Trip } from '@/lib/types'` or `'@/lib/types/modules/trips'`
- Location: `src/lib/types/modules/` (base.ts, users.ts, trips.ts, activities.ts, etc.)

### Common Patterns

```typescript
// Enums as string literal unions
export type UserRole =
  | "super_admin"
  | "diocese_admin"
  | "church_admin"
  | "teacher"
  | "student"
  | "parent";
export type AttendanceStatus = "present" | "absent" | "excused" | "late";

// Database entities with snake_case fields (match Postgres)
export interface Church {
  id: string;
  diocese_id: string | null;
  name: string;
  created_by: string;
  created_at: string;
  logo_image_url: string | null;
}

// Input types for mutations (omit generated fields)
export type CreateChurchInput = Omit<
  Church,
  "id" | "created_at" | "created_by"
>;
```

## Development Workflows

### Adding a New Admin Feature

1. Create directory in `src/app/admin/[feature]/`
2. Add `actions.ts` with `'use server'` directive for data fetching and mutations
3. Add `page.tsx` (Server Component) for layout and data fetching
4. Add `[Feature]Client.tsx` with `'use client'` for interactive UI
5. Use `useTransition()` and `startTransition()` to call server actions
6. Call `revalidatePath()` after mutations to refresh data

### Running the App

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run db:push          # Push schema changes to Supabase
npm run db:seed          # Run seed scripts
```

### Initial Setup (Fresh Environment)

See `QUICK_START.md`:

1. Create Supabase project
2. Update `.env.local` with project credentials
3. Run `00_FRESH_DATABASE_SETUP.sql` via SQL Editor
4. Create admin user (see `create-admin-user-fresh-db.sql`)

## UI Components

### shadcn/ui + Radix

All UI components in `src/components/ui/` (Button, Card, Dialog, Table, etc.)

- Based on Radix UI primitives
- Styled with Tailwind CSS using class-variance-authority
- Add new components: `npx shadcn@latest add [component-name]`

### Custom Components

- `ImageUpload.tsx` - Supabase Storage integration for images
- `ColorPicker.tsx` - Diocese/Church theme color selection
- `LanguageSwitcher.tsx` - Locale toggle (en/ar)
- Admin layouts in `src/components/admin/`

## Points System

Gamified rewards system with church-level configuration:

### Points Sources

- **Attendance**: Configurable per status (present: 10, late: 5, excused: 0, absent: 0)
- **Trip Participation**: Default 20 points per trip
- **Activity Completion**: Points assigned per activity (requires approval)
- **Teacher Adjustments**: Manual add/deduct (max 50 points default)
- **Store Orders**: Points suspended when order pending, deducted when approved

### Key Tables

- `church_points_config` - Per-church points rules (attendance, trips, limits)
- `student_points_balance` - Tracks available/suspended/used points per student
- `points_transactions` - Audit trail with types: `attendance`, `trip_participation`, `activity_completion`, `teacher_adjustment`, `store_order_*`

### Points Flow

1. **Earning**: Transaction created → `available_points` increased → `total_earned` incremented
2. **Suspending** (pending order): `available_points` decreased → `suspended_points` increased
3. **Spending** (order approved): `suspended_points` decreased → `used_points` increased
4. **Refund** (order cancelled/rejected): `suspended_points` decreased → `available_points` increased

See `supabase/migrations/24_create_points_system.sql` for complete schema.

## Common Gotchas

1. **"Cannot read cookies() outside of async context"**: Forgot `await` before `createClient()` in server code
2. **"Invariant: headers() expects the next() argument"**: Used wrong Supabase client (use `@/lib/supabase/server` for Server Components)
3. **RLS policy errors**: Check user has correct role and data filtering in RLS policies
4. **Translation keys missing**: Add to both `messages/en.json` and `messages/ar.json`
5. **Server Actions not working**: Missing `'use server'` directive or forgot `revalidatePath()`
6. **Stale data after mutation**: Call `revalidatePath()` or `router.refresh()` after server actions
7. **Points not updating**: Check `church_points_config` exists for church - required before awarding points

## Deployment & Production

### Pre-Deployment

- **Migrations**: Must be applied sequentially (00-39) via Supabase SQL Editor
- **Environment Variables**: Update `.env.local` with production credentials (3 required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- **Storage Bucket**: Create `images` bucket in Supabase Storage (public) for logo/cover uploads
- **Verify RLS**: All tables have RLS enabled - test with non-admin users before going live

See `DEPLOYMENT_CHECKLIST.md` for step-by-step verification of all 33 migrations.

## Key Documentation Files

- `DEVELOPER_GUIDE.md` - Server-side architecture patterns with complete examples
- `docs/architecture.md` - Full system architecture (1259 lines, multi-tenant design)
- `QUICK_START.md` - 5-minute setup guide for fresh environments
- `SETTINGS_AND_FEATURES_GUIDE.md` - Feature implementation details (i18n, themes, images)
- `I18N_IMPLEMENTATION_GUIDE.md` - Localization patterns and next-intl configuration
- `DEPLOYMENT_CHECKLIST.md` - Production deployment verification (515 lines)

## Testing & Debugging

- **Supabase Logs**: Project Dashboard → Logs → Query Performance (check RLS policy violations)
- **RLS Debugging**: Run queries as specific user via `auth.uid()` filtering in SQL Editor
- **Next.js Debugging**: Server/Client boundary violations show in browser console
- **TypeScript Errors**: Run `npm run build` to catch type errors before runtime
- **No Tests**: Project currently has no automated tests - manual testing required
