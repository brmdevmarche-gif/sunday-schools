# SELECT * Migration Prompt (for Claude Code)

## Task

Migrate all Supabase `.select('*')` and `.select()` (no args) calls to use explicit column selection.

## Why

The integration test `tests/integration/auth-guard-audit.test.ts` flags 43 files using `SELECT *`. Explicit column selection:
- Prevents accidentally exposing sensitive columns
- Reduces payload size
- Makes the code self-documenting about which fields are actually used

## Rules

1. For each file, find every `.select('*')` or `.select()` (empty) call
2. Look at how the result is used downstream (what fields are accessed on the returned rows)
3. Replace with `.select('col1, col2, col3')` listing only the columns actually used
4. If a file uses a TypeScript type for the result, check the type definition to know which columns exist
5. For joined/nested selects like `.select('*, classes(*)')`, convert to `.select('id, name, classes(id, name, ...)')`
6. PRESERVE the `'use server'` directive at the top of server action files
7. After each file edit, verify no TypeScript errors are introduced
8. Run `npx vitest run tests/integration` after all edits to confirm the SELECT * count drops

## Files to migrate (43 total)

### Priority 1 — Server actions (auth-guarded, high traffic)
- src/app/admin/points/actions.ts
- src/app/admin/students/actions.ts
- src/app/admin/students/[id]/actions.ts
- src/app/admin/users/actions.ts
- src/app/admin/store/orders/actions.ts
- src/app/admin/trips/actions.ts
- src/app/admin/announcements/actions.ts
- src/app/admin/churches/actions.ts
- src/app/admin/classes/actions.ts
- src/app/admin/dioceses/actions.ts
- src/app/admin/settings/actions.ts
- src/app/admin/activities/actions.ts
- src/app/activities/actions.ts
- src/app/activities/competitions/actions.ts
- src/app/activities/readings/actions.ts
- src/app/activities/spiritual-notes/actions.ts
- src/app/dashboard/parents/actions.ts
- src/app/dashboard/teacher/trips/actions.ts
- src/app/gamification/actions.ts
- src/app/trips/actions.ts

### Priority 2 — Pages (server components with direct DB calls)
- src/app/admin/announcements/page.tsx
- src/app/admin/announcements/[id]/edit/page.tsx
- src/app/admin/announcements/create/page.tsx
- src/app/admin/churches/[id]/page.tsx
- src/app/admin/dioceses/[id]/page.tsx
- src/app/admin/store/[id]/page.tsx
- src/app/admin/students/[id]/page.tsx
- src/app/admin/students/page.tsx
- src/app/admin/users/[id]/page.tsx

### Priority 3 — API routes
- src/app/api/auth/profile/route.ts
- src/app/api/permissions/route.ts
- src/app/api/permissions/stream/route.ts

### Priority 4 — Library files
- src/lib/login-history.ts
- src/lib/profile.ts
- src/lib/sunday-school/churches.ts
- src/lib/sunday-school/classes.ts
- src/lib/sunday-school/diocese-admins.ts
- src/lib/sunday-school/dioceses.ts
- src/lib/sunday-school/roles-debug.ts
- src/lib/sunday-school/roles-simple.ts
- src/lib/sunday-school/roles.client.ts
- src/lib/sunday-school/roles.ts
- src/lib/sunday-school/users.server.ts
- src/lib/sunday-school/users.ts

## Verification

After completing all migrations, run:
```bash
npx vitest run tests/integration
npx tsc --noEmit
npm run lint
```

All integration tests related to SELECT * should now pass. TypeScript and lint should remain clean.
