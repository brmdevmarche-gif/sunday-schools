# Knasty Portal - Development Guide for Claude

## Project Overview

Sunday School Management System built with **Next.js 16** (App Router, Turbopack) + **Supabase** (Auth, Database, Storage, RLS). Supports English and Arabic (RTL) via `next-intl`.

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — Type check (exclude `.next/` errors — those are stale cache)
- `npm run db:push` — Push migrations to Supabase
- `npm run db:seed` — Seed database

## Architecture

### Directory Structure

```
src/
  app/                    # Next.js App Router pages & API routes
    admin/                # Admin panel (super_admin, diocese_admin, church_admin)
    dashboard/
      teacher/            # Teacher dashboard
      parents/            # Parent dashboard
    activities/           # Student-facing activities
    trips/                # Student-facing trips
    store/                # Student-facing store
    gamification/         # Badges, streaks, leaderboard
    api/                  # API route handlers (route.ts)
    login/                # Auth pages
  components/
    ui/                   # shadcn/ui base components
    admin/                # Admin-specific components
    teacher/              # Teacher-specific components
    parents/              # Parent-specific components
  lib/
    supabase/             # Supabase clients (server.ts, client.ts, admin.ts, middleware.ts)
    api/                  # API helpers (auth.ts, response.ts, csrf.ts)
    constants/            # Shared constants (roles.ts)
    permissions/          # Permission check utilities
    types/modules/        # TypeScript type definitions per domain
    auth-guard.ts         # DAL auth guards (requireAuth, requireAdmin, etc.)
    sanitize.ts           # HTML sanitization
    logger.ts             # Server-side structured logger
    client-logger.ts      # Client-side structured logger
    rate-limit.ts         # PG-backed rate limiter
    audit.ts              # Audit log queries
    access-review.ts      # SOC 2 access review
  contexts/               # React contexts (PermissionsContext)
  hooks/                  # Custom hooks
  i18n/                   # next-intl config
  proxy.ts                # Next.js 16 proxy (replaces middleware.ts)
messages/
  en.json                 # English translations
  ar.json                 # Arabic translations
supabase/
  migrations/             # SQL migrations (numbered 00-54)
  config.toml             # Supabase local config
```

### Key Conventions

**File naming**: Next.js conventions — `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `route.ts` for API. Client components use `*Client.tsx` suffix.

**Proxy, NOT middleware**: This project uses `src/proxy.ts` (Next.js 16). Do NOT create `middleware.ts` — both cannot coexist.

## Security Rules (CRITICAL)

### Authorization — EVERY server action and API route MUST have an auth guard

| Context | Guard | File |
|---------|-------|------|
| Admin server actions | `await requireAdmin()` | `src/lib/auth-guard.ts` |
| Teacher server actions | `await requireStaff()` | `src/lib/auth-guard.ts` |
| Parent server actions | `await requireParent()` | `src/lib/auth-guard.ts` |
| User-facing server actions | `await requireAuth()` | `src/lib/auth-guard.ts` |
| Admin API routes (route.ts) | `requireAdminApiUser()` + `isAuthError()` | `src/lib/api/auth.ts` |
| Teacher API routes (route.ts) | `requireStaffApiUser()` + `isAuthError()` | `src/lib/api/auth.ts` |
| Mutating API routes (POST/PUT/DELETE) | `validateCsrf(request)` | `src/lib/api/csrf.ts` |

**Pattern for server actions:**
```typescript
'use server'
import { requireAdmin } from '@/lib/auth-guard'

export async function myAdminAction() {
  await requireAdmin()  // FIRST LINE — before any other code
  // ... rest of function
}
```

**Pattern for API routes:**
```typescript
import { requireAdminApiUser, isAuthError } from '@/lib/api/auth'
import { validateCsrf } from '@/lib/api/csrf'

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)  // For mutating endpoints
  if (csrfError) return csrfError

  const auth = await requireAdminApiUser()
  if (isAuthError(auth)) return auth.error
  const { supabase, user, profile } = auth
  // ...
}
```

### Role Hierarchy

Defined in `src/lib/constants/roles.ts`. When creating users, enforce hierarchy — admins can only create users BELOW their level. See `ROLE_HIERARCHY` in `src/app/api/admin/create-user/route.ts`.

### XSS Prevention

- **Write-time**: Sanitize HTML with `sanitizeContentForStorage()` from `src/lib/sanitize.ts` before DB insert/update
- **Read-time**: Sanitize with `sanitizeContentForDisplay()` when using `dangerouslySetInnerHTML`
- NEVER use `dangerouslySetInnerHTML` without sanitization

### Input Validation

- Use **Zod** schemas for all API route inputs. Schemas use `USER_ROLES` from `src/lib/constants/roles.ts`.
- Escape PostgREST filter strings when interpolating user input into `.or()` filters.

### Rate Limiting

Applied via `rateLimit()` from `src/lib/rate-limit.ts` (PG-backed). Currently on login (5/min) and create-user (10/min). Add to any new sensitive endpoint.

### Supabase Security

- **RLS is enabled on ALL tables** — maintain this for any new table
- `createAdminClient()` bypasses RLS — use ONLY for operations that require it (user creation, health checks, audit logs)
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed client-side
- All server-side auth modules import `'server-only'`

## Coding Patterns

### Logging

- **Server-side**: `import { logger } from '@/lib/logger'` — `logger.error()`, `logger.info()`, `logger.warn()`, `logger.debug()`
- **Client-side**: `import { clientLogger } from '@/lib/client-logger'` — same API
- NEVER use raw `console.log/error/warn` — use the structured loggers

### API Response Envelope

Use helpers from `src/lib/api/response.ts`:
```typescript
import { apiSuccess, apiError } from '@/lib/api/response'

return apiSuccess(data)           // { success: true, data }
return apiError('Message', 400)   // { success: false, error: 'Message' }
```

### Error Boundaries

- Root: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`
- Segments: `src/app/admin/error.tsx`, `src/app/dashboard/error.tsx`
- All error pages use `useTranslations('errors')` for i18n
- When adding new route segments, consider adding `error.tsx` and `loading.tsx`

### Internationalization (i18n)

- **Framework**: `next-intl` with `en` and `ar` locales
- **Translations**: `messages/en.json` and `messages/ar.json`
- **Server components**: `const t = await getTranslations('namespace')`
- **Client components**: `const t = useTranslations('namespace')`
- **RTL**: Arabic uses `dir="rtl"` — use `ps-*`/`pe-*` (logical) instead of `pl-*`/`pr-*`
- When adding user-facing strings, add to BOTH `en.json` and `ar.json`

### Destructive Actions

Use `ConfirmDialog` from `src/components/ui/confirm-dialog.tsx` — NEVER use `window.confirm()`:
```tsx
<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Delete Item"
  description="Are you sure? This cannot be undone."
  confirmText="Delete"
  variant="destructive"
  onConfirm={handleConfirm}
/>
```

### Types

- All domain types in `src/lib/types/modules/*.ts`
- Re-exported from `src/lib/types/index.ts`
- `UserRole` type and `USER_ROLES` const must stay in sync (both in `base.ts` and `constants/roles.ts`)

## Database

### Migrations

- Located at `supabase/migrations/XX_description.sql`
- Current: 00 through 54
- Always include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for new tables
- Always add appropriate RLS policies (deny by default, explicit allow)

### Audit Log

Sensitive tables have audit triggers (migration 53). When adding sensitive tables, attach the trigger:
```sql
CREATE TRIGGER audit_my_table
  AFTER INSERT OR UPDATE OR DELETE ON public.my_table
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
```

### Data Retention

Cleanup function in migration 54. When adding tables with ephemeral data, add cleanup logic to `cleanup_expired_data()`.

## CSP & Security Headers

- Security headers configured in `next.config.ts` (`headers()` function)
- CSP with nonce generated per-request in `src/proxy.ts`
- If CSP blocks something, temporarily switch to `Content-Security-Policy-Report-Only` in proxy.ts

## Testing Checklist for New Features

1. Auth guard added to all server actions and API routes?
2. Zod validation on API route inputs?
3. CSRF check on mutating API routes?
4. RLS enabled on new tables with appropriate policies?
5. Translations added to both `en.json` and `ar.json`?
6. Error boundary (`error.tsx`) and loading state (`loading.tsx`) for new routes?
7. `ConfirmDialog` for destructive actions (no `window.confirm`)?
8. Using structured logger (not `console.log`)?
9. HTML content sanitized before storage and display?
10. Explicit column selection in Supabase queries (no `SELECT *`)?
