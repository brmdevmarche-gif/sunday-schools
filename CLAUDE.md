# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


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
- `npm run test` — Run all Vitest tests (unit + integration)
- `npm run test:unit` — Unit tests only (sanitize, CSRF, roles)
- `npm run test:integration` — Integration tests (auth guard audit, SELECT * check)
- `npm run test:e2e` — Playwright E2E tests
- `npm run test:security` — Playwright security tests (auth bypass, CSRF)
- `npm run test:a11y` — Playwright accessibility tests (WCAG 2.2 AA)
- `npm run check:auth` — Static check: all server actions & API routes have auth guards
- `npm run check:i18n` — Check en.json / ar.json translation key parity
- `npm run check:all` — Full pre-merge check (lint + types + unit tests + auth + i18n)

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

## Accessibility Rules (WCAG 2.2 AA — CRITICAL)

The app targets WCAG 2.2 AA conformance. Every new feature or UI change MUST follow these rules.

### Page Structure

- Every `page.tsx` MUST export metadata with a unique, descriptive title:
  ```typescript
  import type { Metadata } from "next";
  export const metadata: Metadata = { title: "Page Name" };
  ```
  The root layout uses a template: `"%s — Knasty Portal"`. Client component pages need a `layout.tsx` wrapper.

- Every page MUST have a single `<h1>` and sequential heading levels (no skipping h1→h3).

- Use `<main id="main-content">` for the primary content area in layouts. The root layout includes a skip-to-main link (`src/components/ui/skip-link.tsx`).

### Interactive Elements

- **NEVER use `<div>` or `<span>` with `onClick` for interactive elements.** Use `<button>` or `<a>` (Link). If a non-button element MUST be interactive, add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space.

- **Every icon-only button MUST have `aria-label`** describing the action. Add `aria-hidden="true"` to the icon inside:
  ```tsx
  <Button size="icon" aria-label={t("common.delete")}>
    <Trash2 aria-hidden="true" />
  </Button>
  ```

- **All interactive elements must have visible focus indicators.** Use `focus-visible:ring-2 focus-visible:ring-ring` — NEVER `focus:outline-none` without a `focus-visible:` replacement.

- **Touch targets must be at least 44px on mobile.** Button sizes are responsive: `h-11 sm:h-9` (default), `size-11 sm:size-9` (icon). Do NOT override these with smaller fixed sizes on mobile-primary pages.

### Forms

- **Every input MUST have an associated label.** Use `<Label htmlFor="id">` with matching `id` on the input. For search inputs where a visible label is not desired, use `className="sr-only"`:
  ```tsx
  <label htmlFor="search" className="sr-only">{t("common.search")}</label>
  <Input id="search" placeholder={t("common.searchPlaceholder")} />
  ```

- **Prefer react-hook-form + Zod** over manual useState forms. The `FormControl` component automatically provides `aria-invalid` and `aria-describedby`. The `FormMessage` component has `role="alert"` for screen reader announcements.

- **Required fields** must have `aria-required="true"` on the input and a visual `*` indicator with `aria-hidden="true"`.

- **Login/auth inputs** must have `autoComplete` attributes (`"username"`, `"current-password"`, `"email"`, etc.).

### Images and Media

- **All `<Image>` and `<img>` MUST have meaningful `alt` text.** Use `alt=""` only for purely decorative images.
- **All `<AvatarImage>` MUST have `alt` prop** — use the person's name.

### RTL Support (Arabic)

- **ALWAYS use logical CSS properties**, never physical:
  | Never use | Use instead |
  |-----------|-------------|
  | `pl-*` / `pr-*` | `ps-*` / `pe-*` |
  | `ml-*` / `mr-*` | `ms-*` / `me-*` |
  | `text-left` / `text-right` | `text-start` / `text-end` |
  | `left-*` / `right-*` | `start-*` / `end-*` |
  | `border-l-*` / `border-r-*` | `border-s-*` / `border-e-*` |
  | `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |
  | `left-0 right-0` | `inset-x-0` |

- **Exceptions**: `-translate-x-*` transforms, `left-1/2` centering, and explicit `ltr:`/`rtl:` overrides are fine.

- **`aria-label` values must use `t()` i18n keys** so they translate to Arabic.

### Dynamic Content

- Use `aria-live="polite"` on containers that update dynamically (points, counts, status).
- Use `aria-busy={isLoading}` on containers during loading states.
- Sonner toasts handle `role="alert"` (errors) and `role="status"` (success) automatically.

### Color and Motion

- **Color must NOT be the only means of conveying information.** Badges/status indicators must include text or icons alongside color.
- The app respects `prefers-reduced-motion` via `globals.css`. Do NOT add custom animations without wrapping in `@media (prefers-reduced-motion: no-preference)`.
- **Minimum contrast ratios**: 4.5:1 for normal text, 3:1 for large text and UI components. Test new color combinations before using them.

### Data Tables

- Use the `Table` component from `src/components/ui/table.tsx` — it provides `scope="col"` on headers and `text-start` for RTL.
- Add `<TableCaption className="sr-only">{description}</TableCaption>` to every data table.

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
11. **Page title** — `export const metadata` with unique title in every `page.tsx`?
12. **Accessibility** — All inputs labeled? Icon buttons have `aria-label`? Focus visible?
13. **RTL** — Using logical CSS properties (not `pl-`/`pr-`/`ml-`/`mr-`/`text-left`)?
14. **Touch targets** — Interactive elements at least 44px on mobile?
15. **Color contrast** — New colors meet 4.5:1 ratio for text, 3:1 for UI components?

## CI/CD & Automation

### GitHub Actions (`.github/workflows/ci.yml`)

Runs on push/PR to `main` and `develop`. Jobs:

| Job | What it checks |
|-----|---------------|
| `lint-and-typecheck` | ESLint (0 errors) + TypeScript (`tsc --noEmit`) |
| `unit-tests` | Vitest unit tests (36 tests) + integration audit |
| `build` | Next.js production build (needs Supabase env secrets) |
| `security-audit` | `npm audit` + auth guard coverage (`check-auth-guards.mjs`) + raw console.log scan |
| `i18n-check` | EN/AR translation key parity (`check-i18n-parity.mjs`) |

### Pre-commit Hooks (Husky + lint-staged)

Automatically runs on `git commit`:
- **`.ts`/`.tsx` files**: ESLint with `--max-warnings 0`
- **`messages/*.json`**: i18n parity check

### Automation Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `scripts/check-auth-guards.mjs` | `npm run check:auth` | Static analysis: every server action + API route has auth guard |
| `scripts/check-i18n-parity.mjs` | `npm run check:i18n` | Ensures en.json and ar.json have identical key sets |
| Full check | `npm run check:all` | lint + types + unit tests + auth + i18n (pre-merge gate) |

### Required GitHub Secrets

For the `build` job to succeed, set these in repo Settings > Secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## QA Testing Pipeline

Four-phase pipeline documented in `qa-pipeline-prompts-corrected.md`:

| Phase | Tool | Purpose | Status |
|-------|------|---------|--------|
| 0 | Vitest | Unit + integration tests | COMPLETE — 36/36 pass |
| 1 | Claude Cowork | Manual UX/visual testing | COMPLETE — reports in `ux-audit-report.md` |
| 2 | Playwright | E2E + security + a11y tests | COMPLETE — reports in `reports/bug-report.json` |
| 3 | Claude Code | Human-reviewed bug fixing | COMPLETE — 11/17 fixed, 6 deferred (false positives/out-of-scope) |

### Completed Remediations

- **Security**: 226 server actions guarded, 7 API routes secured, CSRF on mutations, rate limiting, RLS on 57/57 tables, nonce-based CSP
- **Accessibility**: Skip-to-main link, icon `aria-label`s, focus indicators, WCAG 2.2 AA audit
- **UX**: Brand consistency, settings descriptions, mobile scroll, error page navigation
- **i18n**: 2,336 keys with full EN/AR parity

### Known Backlog

| Item | Priority | Notes |
|------|----------|-------|
| 43 SELECT * violations in Supabase queries | MEDIUM | Integration tests flag these; migrate to explicit columns |
| Switch CSP from Report-Only to enforcing | MEDIUM | Monitor violations first |
| Client-side structured logger | LOW | ~100 client console calls remaining |
| Seed data date fixes | LOW | scripts/seed-database.ts uses random dates |
| 284 physical CSS properties (RTL) | MEDIUM | Tracked in `rtl-fix-inventory.md` |
