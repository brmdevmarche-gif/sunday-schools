# Knasty Portal - Security Audit Report

**Date**: 2026-03-21
**Auditor**: Staff Engineer Review (Automated + Manual)
**Stack**: Next.js 16.0.7 + Supabase + TypeScript
**Scope**: Full codebase (~352 files, ~84K LOC)

---

## Executive Summary

The audit identified **5 CRITICAL**, **5 HIGH**, **9 MEDIUM**, and **2 LOW** severity findings across security, reliability, error handling, and UX. The most severe issues were **missing authorization on admin endpoints** (both API routes and 130+ server action functions) and **an XSS vulnerability via unsanitized HTML rendering**.

All CRITICAL and HIGH severity items (except rate limiting, which requires external infrastructure) have been remediated across 3 sprints. Additionally, a follow-up adversarial review identified and fixed **privilege escalation**, **missing role guards on teacher/parent/user-facing actions** (225 additional functions), and **architectural improvements**.

---

## CRITICAL Findings

### C1. No Error Boundaries (error.tsx / not-found.tsx)
- **Category**: Error Handling / OWASP 2025 #10
- **Status**: REMEDIATED
- Root `error.tsx`, `global-error.tsx`, `not-found.tsx` + segment-level boundaries for `/admin` and `/dashboard`. All i18n-aware (EN/AR). Global error supports dark mode.

### C2. No Authorization on `/api/admin/create-user`
- **Category**: OWASP 2025 #1 (Broken Access Control)
- **Status**: REMEDIATED
- Added `requireAdminApiUser()` + Zod validation + role hierarchy enforcement (admins can only create users below their privilege level)

### C3. XSS via dangerouslySetInnerHTML
- **Category**: OWASP 2025 #3 (Injection)
- **Status**: REMEDIATED
- Write-time sanitization (`sanitize-html`) in announcements actions + read-time sanitization in component. Sanitization chain verified: `description` field -> DB -> mapped to `content` -> sanitized on display.

### C4. Middleware Auth Redirect Gap
- **Category**: OWASP 2025 #1 (Broken Access Control)
- **Status**: REMEDIATED
- All protected paths now redirect unauthenticated users. Middleware migrated to `proxy.ts` (Next.js 16 convention).

### C5. No Authorization on Server Actions (355 functions total)
- **Category**: OWASP 2025 #1 (Broken Access Control)
- **Status**: REMEDIATED
- 130 admin functions: `requireAdmin()` (14 files)
- 24 teacher functions: `requireStaff()` (7 files)
- 11 parent functions: `requireParent()` (1 file)
- 61 user-facing functions: `requireAuth()` (6 files — activities, trips, gamification)
- All guards use shared DAL with React `cache()` for per-request deduplication

---

## HIGH Findings

### H1. No Security Headers
- **Status**: REMEDIATED — X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. CSP deferred for nonce-based implementation.

### H2. No Rate Limiting
- **Status**: OPEN — Requires `@upstash/ratelimit` or PostgreSQL-backed solution. In-memory rate limiting rejected (anti-pattern for serverless).

### H3. No Zod Validation on API Routes
- **Status**: REMEDIATED — Zod schemas on create-user, diocese admin assignment/update. Schema uses shared `USER_ROLES` const.

### H4. PostgREST Filter Injection
- **Status**: REMEDIATED — Escape `\`, `%`, `_` in search input + 100-char limit.

### H5. SELECT * Leaking User Data
- **Status**: REMEDIATED — Explicit column lists in create-user and auth/profile routes.

---

## MEDIUM Findings

| # | Finding | Status |
|---|---------|--------|
| M1 | 305+ console.log statements | PARTIAL — Structured logger created (`src/lib/logger.ts`). Incremental migration recommended. |
| M2 | No health check | REMEDIATED — `GET /api/health` with admin client (bypasses RLS) |
| M3 | User creation race condition | REMEDIATED — Poll-and-retry replaces setTimeout |
| M4 | Admin client per call | WONT FIX — Recommended Supabase pattern |
| M5 | Stale remote image patterns | REMEDIATED — `*.supabase.co` only |
| M6 | No CSRF on API routes | OPEN — Server Actions already protected by Next.js |
| M7 | No offline detection | REMEDIATED — `OfflineDetector` component with i18n toasts |
| M8 | Inconsistent error responses | REMEDIATED — `apiSuccess()`/`apiError()` envelope helpers |
| M9 | `any` types in permissions | REMEDIATED — `PermissionRpcRow` interface replaces `any` |

---

## LOW Findings

| # | Finding | Status |
|---|---------|--------|
| L1 | ESLint allows `any` | OPEN — Zero actual `any` usage remains |
| L2 | Missing destructive confirmations | OPEN — Tracked for future sprint |

---

## Architectural Changes Completed

1. **Migrated `middleware.ts` to `proxy.ts`** — Next.js 16 convention
2. **Created shared DAL** — `src/lib/auth-guard.ts` with cached `getAuthUser()`, `requireAuth()`, `requireAdmin()`, `requireStaff()`, `requireParent()`
3. **Created API auth layer** — `src/lib/api/auth.ts` with discriminated union result type
4. **Extracted shared role constants** — `src/lib/constants/roles.ts` with `ReadonlySet` for O(1) lookups
5. **Role hierarchy enforcement** — Admins can only create users below their privilege level
6. **Added `server-only`** markers on all server-side auth modules
7. **Standardized API responses** — `apiSuccess()`/`apiError()` envelope

## Remaining Recommendations

1. **Rate limiting** — Use `@upstash/ratelimit` or `rate-limiter-flexible` with PostgreSQL
2. **Nonce-based CSP** — Generate per-request nonces in proxy.ts
3. **RLS verification** — Audit all Supabase tables for deny-by-default policies
4. **SOC 2 audit logging** — Immutable audit trail with DB triggers
5. **Console.log bulk migration** — Incrementally replace with structured logger
