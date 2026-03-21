# Knasty Portal - Quick Wins (All Completed)

Quick wins are LOW-effort / HIGH-impact fixes under 30 minutes each.
All items below have been implemented in Sprint 1.

---

## 1. Middleware Auth Redirect (5 min) - DONE

**File**: `src/lib/supabase/middleware.ts`
**Change**: Removed `request.nextUrl.pathname.startsWith("/dashboard")` restriction from redirect condition. Now all protected paths redirect unauthenticated users.

## 2. PostgREST Search Escaping (10 min) - DONE

**File**: `src/app/api/admin/users/route.ts`
**Change**: Added `escapePostgrestSearch()` to escape `%`, `_`, `\` in search input + 100-char limit + 200-row max limit.

## 3. SELECT * Removal (5 min) - DONE

**File**: `src/app/api/admin/create-user/route.ts`
**Change**: Replaced `.select("*")` with explicit column list: `"id, email, full_name, username, role, avatar_url, church_id, diocese_id, is_active"`.

## 4. Security Headers (10 min) - DONE

**File**: `next.config.ts`
**Change**: Added `async headers()` with X-Frame-Options (DENY), X-Content-Type-Options (nosniff), HSTS, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control.

## 5. Remote Image Cleanup (5 min) - DONE

**File**: `next.config.ts`
**Change**: Removed `hollywoodreporter.com` and `picsum.photos` from `remotePatterns`, replaced with `*.supabase.co`.

## 6. Health Check Endpoint (10 min) - DONE

**File**: `src/app/api/health/route.ts` (new)
**Change**: `GET /api/health` returns `{ status: "healthy"|"degraded", checks: { database }, timestamp }` with 200/503 status.

## 7. Error Boundaries (20 min) - DONE

**Files**: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx` (all new)
**Change**: Root error boundary with "Try Again" + "Go Home" buttons, global error boundary for layout crashes, 404 page with shadcn Card UI.

## 8. User Creation Race Condition (10 min) - DONE

**File**: `src/app/api/admin/create-user/route.ts`
**Change**: Replaced fragile `setTimeout(1000)` with poll-and-retry loop (5 attempts, 300ms intervals) checking for trigger-created profile.

---

## Remaining Quick Wins (Not Yet Implemented)

### Migrate middleware.ts to proxy.ts (5 min)
```bash
npx @next/codemod@latest middleware-to-proxy
```
Next.js 16 deprecates `middleware.ts`. This codemod renames the file and function automatically.

### Fix `any` types in permissions/check.ts (10 min)
**File**: `src/lib/permissions/check.ts:26,135`
**Change**: Type the RPC response instead of `(p: any)`:
```typescript
interface PermissionRpcRow {
  permission_code: string
  permission_name: string
  module: string
  resource: string
  action: string
}
const codes = (data || []).map((p: PermissionRpcRow) => p.permission_code)
```
