# AI-POWERED QA PIPELINE (CORRECTED)

**Claude Cowork + Claude Code**
Complete Testing & Bug Fixing Workflow

Four-phase pipeline: Unit/Integration Tests > Manual QA > Automated E2E > Human-Reviewed Fix

Corrected based on adversarial review against: Playwright Official Docs, Martin Fowler's Test Pyramid,
Google Testing Blog, OWASP WSTG, Kent C. Dodds' Testing Trophy, and LLM auto-repair research.

---

## Pipeline Overview

| Phase | Tool | Purpose |
|-------|------|---------|
| 0 | Claude Code | **Unit + integration tests** (Vitest) -- fast tests for pure functions, auth guards, API routes, Zod schemas, sanitization. Fixes the Ice Cream Cone anti-pattern. |
| 1 | Claude Cowork | **Manual UX/visual testing** -- walks through the app like a real user across all roles, both locales, and dark mode. |
| 2 | Claude Code | **Automated E2E + security tests** (Playwright) -- smoke, flow, accessibility, visual regression, and OWASP-aligned security tests. |
| 3 | Claude Code | **Human-reviewed bug fixing** -- reads bug reports, proposes diffs, waits for human approval on Critical/High bugs. |

## Quick Start

1. **Phase 0:** Run in Claude Code in your project directory. Installs Vitest, writes unit + integration tests.
2. **Phase 1:** Run in Claude Cowork with your app URL. Manual test sweep across roles, locales, themes.
3. **Phase 2:** Run in Claude Code. Installs Playwright, writes E2E + security tests, generates `reports/bug-report.json`.
4. **Phase 3:** Run in Claude Code. Reads bug reports, proposes fixes with diffs for human review.
5. **Re-run Phase 0-2** to verify fixes. Repeat until clean.

## Tips

- Always fill in the `[PLACEHOLDERS]` in each prompt before running.
- Phase 0 and Phase 1 can run in parallel -- they test different things.
- Phase 2 depends on Phase 0 infrastructure being set up (test accounts, env config).
- **Never auto-fix Critical or High security bugs** -- always review the diff first.
- The JSON format from Phase 2 is designed for easy machine consumption in Phase 3.

---

## PHASE 0: UNIT + INTEGRATION TESTS (CLAUDE CODE)

### Prompt 0 -- Unit & Integration Test Suite

Run this prompt in Claude Code from your project root directory. It sets up Vitest and writes
fast-feedback tests for pure functions, auth guards, API routes, and data validation.

**Best for:** Auth guard coverage, input validation, sanitization, role hierarchy,
CSRF logic, rate limiting -- anything testable without a browser.

**Why this phase exists:** The Testing Pyramid (Martin Fowler) and Testing Trophy (Kent C. Dodds)
both emphasize that the majority of tests should be unit and integration tests, not E2E.
E2E-only suites are slow, flaky, and give poor fault localization.

```
You are a Senior Test Engineer setting up a unit and integration test suite for a Next.js 16 + Supabase application. Your goal is to write fast, reliable tests that catch bugs without needing a browser.

## Context (fill in before use)
- Repo Path: [PATH_TO_PROJECT]
- Tech Stack: Next.js 16 (App Router), Supabase (Auth + DB + RLS), next-intl, Tailwind, shadcn/ui
- Auth: Supabase SSR with role-based guards (super_admin, diocese_admin, church_admin, teacher, parent, student + more)
- Key Files:
  - Auth guards (server actions): src/lib/auth-guard.ts
  - Auth guards (API routes): src/lib/api/auth.ts
  - CSRF validation: src/lib/api/csrf.ts
  - Sanitization: src/lib/sanitize.ts
  - Rate limiting: src/lib/rate-limit.ts
  - Role constants: src/lib/constants/roles.ts
  - API response helpers: src/lib/api/response.ts

## Phase 1: Environment Setup

Install Vitest as a devDependency in the EXISTING project. DO NOT run `npm init` or create a new package.json.

```bash
npm install -D vitest @vitejs/plugin-react
```

Create a vitest.config.ts at project root:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Add test scripts to the EXISTING package.json:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:unit": "vitest run tests/unit",
  "test:integration": "vitest run tests/integration"
}
```

Create directory structure:
```
tests/
  unit/
    sanitize.test.ts
    csrf.test.ts
    roles.test.ts
    zod-schemas.test.ts
  integration/
    auth-guards.test.ts
    api-routes.test.ts
  setup.ts
```

## Phase 2: Unit Tests

### 2A. Sanitization Tests (tests/unit/sanitize.test.ts)
Test the sanitizeContentForStorage and sanitizeContentForDisplay functions:
- XSS payloads are stripped: `<script>alert(1)</script>`, `<img onerror=alert(1)>`, `<div onmouseover=...>`
- Safe HTML is preserved: `<p>`, `<strong>`, `<em>`, `<a href="...">`
- Nested XSS payloads: `<div><script>alert(1)</script></div>`
- Unicode/encoded payloads: `&#x3C;script&#x3E;`
- Empty and null inputs
- Very long strings (10,000+ chars)

### 2B. CSRF Validation Tests (tests/unit/csrf.test.ts)
Test the validateCsrf function:
- Safe methods (GET, HEAD, OPTIONS) always pass
- Matching origin/host passes
- Mismatched origin/host returns 403
- Missing origin header passes (non-browser request)
- Invalid origin URL returns 403
- Missing host header passes

### 2C. Role Hierarchy Tests (tests/unit/roles.test.ts)
Test role constants and hierarchy:
- ADMIN_ROLES contains exactly: super_admin, diocese_admin, church_admin
- STAFF_ROLES contains all admin roles plus teacher roles
- USER_ROLES array order matches hierarchy (super_admin first, most privileged)
- Role hierarchy enforcement: lower roles cannot create equal-or-higher roles

### 2D. Zod Schema Tests (tests/unit/zod-schemas.test.ts)
For each API route that has a Zod schema, test:
- Valid input passes
- Missing required fields fail with appropriate error
- Invalid email format fails
- Password too short/long fails
- Invalid role value fails
- UUID format validation on ID fields
- Boundary values (empty strings, max length)

## Phase 3: Integration Tests

### 3A. Auth Guard Tests (tests/integration/auth-guards.test.ts)
For each server action file (find all files containing 'use server'):
- Verify the FIRST executable line calls an auth guard (requireAdmin, requireStaff, requireAuth, requireParent)
- This can be a static analysis test -- read the file content and verify the pattern

For each API route file (find all route.ts files):
- Verify POST/PUT/DELETE handlers call validateCsrf
- Verify all handlers call an auth guard (requireAdminApiUser, requireStaffApiUser, requireApiAuth)
- Exception: public routes like login

### 3B. API Route Tests (tests/integration/api-routes.test.ts)
Test actual API route handlers with mocked Supabase:
- Unauthenticated requests return 401
- Wrong role requests return 403
- Cross-origin POST requests return 403 (CSRF)
- Valid requests with correct role succeed
- Invalid input returns 400 with Zod error details

## Phase 4: Output
1. Run all tests: `npm test`
2. Print summary: total tests, passed, failed, coverage
3. If any auth guard tests fail, flag them as CRITICAL security issues
4. Generate a simple report to: reports/unit-test-report.json

## IMPORTANT RULES
- Install in the EXISTING project -- never run `npm init -y`
- Use the project's path alias (@/) in imports
- Do NOT mock auth guards in integration tests -- test that they are called
- Use the project's structured logger, not console.log
- Focus on testing behavior, not implementation details
```

---

## PHASE 1: MANUAL QA (CLAUDE COWORK)

### Prompt 1 -- Cowork Visual & UX Tester

Copy this entire prompt into Claude Cowork. Replace all `[PLACEHOLDERS]` with your app details.
Cowork will open your app in Chrome and systematically test every flow.

**Best for:** Visual bugs, responsive issues, UX problems, broken layouts, real-user perspective testing.

**Enhanced from original:** Added multi-role testing, Arabic/RTL locale, dark mode, and
project-specific auth flows.

```
You are a Senior QA Engineer performing a comprehensive manual test sweep of a web application. Your goal is to test every user-facing flow, catch visual/UX bugs, and produce a structured bug report.

## Context (fill in before use)
- App URL: [YOUR_APP_URL]
- App Type: Sunday School Management System (church education portal)
- Key User Roles: super_admin, church_admin, teacher, parent, student
- Auth Credentials:
  - Admin: [admin email / password]
  - Teacher: [teacher email / password]
  - Parent: [parent email / password]
  - Student (user code login): [6-digit code / password]
- Supported Locales: English (LTR), Arabic (RTL)
- Theme: Light mode + Dark mode (toggle in settings/header)
- Priority Flows: login (both methods), admin user management, class management, teacher dashboard, parent dashboard, activities, trips, store, gamification

## Testing Protocol

### Phase A: Reconnaissance (5 min)
1. Open the app URL in Chrome
2. Take a full-page screenshot of the landing/login page
3. Map out the main navigation structure
4. Identify all major user flows from the UI
5. Note the tech stack if visible (Next.js, Tailwind, shadcn/ui)

### Phase B: Multi-Role Flow Testing

Test each flow as EACH relevant role. For each role:

**Login Testing:**
- Login with email + password
- Login with 6-digit user code (if applicable)
- Test invalid credentials (wrong password, non-existent email)
- Test rate limiting: try 6 rapid login attempts -- the 6th should be rejected
- Test "back button after login" behavior
- Verify redirect goes to the correct dashboard for each role

**Functional Testing (per role):**
- Does the happy path complete successfully?
- Can this role access ONLY the pages/actions they should?
- Try navigating directly to admin URLs as a non-admin (type the URL)
- Do form validations trigger correctly? (empty fields, invalid email, short passwords, special characters)
- Do error messages appear and are they helpful?
- Do success states (toasts, redirects, confirmations) work?
- Do destructive actions show a confirmation dialog (not browser confirm)?
- Do all links/buttons lead to the right destination?

**Visual/UI Testing:**
- Any overlapping elements, cut-off text, or broken layouts?
- Are images loading? Any broken image placeholders?
- Is spacing/alignment consistent?
- Do hover/focus/active states work on interactive elements?
- Is typography consistent (no random font sizes or weights)?
- Are all icon-only buttons understandable (do they have tooltips/labels)?

**Responsive Testing:**
- Resize browser to mobile width (375px) -- does layout adapt?
- Check tablet width (768px)
- Are touch targets large enough on mobile? (at least 44px)
- Does navigation collapse to hamburger/drawer on mobile?

### Phase C: Arabic/RTL Testing (CRITICAL)
1. Switch locale to Arabic:
   - Set cookie `NEXT_LOCALE=ar` in browser DevTools, OR
   - Use the locale switcher if available in the UI
2. Reload the page
3. Verify:
   - `dir="rtl"` is set on the `<html>` element
   - Text is right-aligned
   - Navigation items are mirrored (hamburger on right, etc.)
   - No overlapping or misaligned elements
   - Padding/margins are mirrored correctly (no content pushed off-screen)
   - Icons that indicate direction (arrows, chevrons) are flipped
   - Numbers and dates display correctly
4. Check key pages in Arabic: login, admin dashboard, teacher dashboard, class list
5. Take screenshots of any RTL layout issues

### Phase D: Dark Mode Testing
1. Toggle to dark mode
2. Check every page visited for:
   - Sufficient contrast (text readable against background)
   - No "unthemed" elements (white boxes on dark background or vice versa)
   - Form inputs, dropdowns, modals styled correctly
   - Status badges and indicators still distinguishable
   - Hover/focus states visible in dark mode
3. Test dark mode in BOTH English and Arabic locales

### Phase E: Accessibility Spot Checks
- Can you tab through the page? Are there visible focus indicators?
- Do screen-reader-relevant elements have labels? (check a few buttons, inputs)
- Is there a skip-to-content link?
- Are there any images without alt text?
- Check heading hierarchy on 2-3 key pages (h1, h2, h3 in order)

### Phase F: Edge Cases
- Rapid double-clicking on submit buttons
- Extremely long text inputs (500+ characters in name fields)
- Empty states (no data, no results)
- Refreshing mid-flow (does state persist?)
- Console errors: open DevTools and note any visible error indicators
- 404 page: navigate to a non-existent URL
- Performance feel: any noticeably slow pages or actions?

## Bug Report Format

For EACH bug found, create an entry with:

```
BUG-[NUMBER]
Severity: Critical / High / Medium / Low / Cosmetic
Category: Functional | Visual | Responsive | UX | Performance | Accessibility | RTL | Dark Mode | Security
Page/Flow: [where it occurs]
Role Tested: [which user role was active]
Locale: [en / ar]
Theme: [light / dark]
Steps to Reproduce:
  1. [step]
  2. [step]
  3. [step]
Expected: [what should happen]
Actual: [what actually happens]
Screenshot: [attach if possible]
Browser/Viewport: [e.g., Chrome 375px]
Notes: [any additional context]
```

## Severity Definitions
- **Critical**: App crashes, data loss, security issue (accessing other role's data), complete flow blocker
- **High**: Major feature broken, but workaround exists
- **Medium**: Feature works but behaves incorrectly in specific cases
- **Low**: Minor visual or UX issue, doesn't block functionality
- **Cosmetic**: Pixel-level polish, nice-to-have improvements

## Output Requirements
1. Start with a brief Executive Summary (overall app health, total bugs by severity, by category)
2. List all bugs in descending severity order
3. Group bugs by category (Security > Functional > RTL > Accessibility > Visual > Cosmetic)
4. End with a Recommendations section for UX improvements that aren't bugs
5. Save the full report as a structured document

IMPORTANT:
- Test as EACH role (admin, teacher, parent, student at minimum)
- Test in BOTH locales (English and Arabic)
- Test in BOTH themes (light and dark)
- Focus on bugs a real user would encounter
- Don't flag opinionated design preferences as bugs unless they genuinely hurt usability
```

---

## PHASE 2: AUTOMATED E2E + SECURITY TESTING (CLAUDE CODE)

### Prompt 2 -- Automated Test Suite

Run this prompt in Claude Code from your project root directory. It installs Playwright,
creates comprehensive test suites including OWASP-aligned security tests, and generates
a structured bug report.

**Best for:** Functional regressions, accessibility violations (axe-core), security testing
(auth bypass, CSRF, RLS), visual regression across locales/themes, performance metrics.

**Key corrections from original:**
- No `npm init -y` -- installs in existing project
- Adds security test suite aligned with OWASP WSTG
- Uses Playwright `storageState` for auth fixtures (official best practice)
- Tests both locales (en/ar) and both themes (light/dark)
- Handles CSP nonce blocking with env-gated Report-Only mode
- Uses user-facing locators (`getByRole`, `getByLabel`) not CSS selectors
- Adds test data management (seed, isolation, cleanup)

```
You are a Senior QA Automation Engineer. Your task is to set up and run a comprehensive automated test suite against a web application, then produce a structured bug report.

## Context (fill in before use)
- App URL: [YOUR_APP_URL] (usually http://localhost:3000)
- Repo Path: [PATH_TO_PROJECT]
- Tech Stack: Next.js 16 (App Router, Turbopack), Supabase, next-intl (en/ar), Tailwind, shadcn/ui
- Auth: Supabase SSR with role-based guards. Roles: super_admin, diocese_admin, church_admin, teacher, parent, student
- Login methods: email+password AND 6-digit user code
- CSP: Nonce-based strict-dynamic via src/proxy.ts (NOT middleware.ts)
- Auth Credentials:
  - super_admin: [email] / [password]
  - church_admin: [email] / [password]
  - teacher: [email] / [password]
  - parent: [email] / [password]
  - student (user code): [6-digit code] / [password]

## Phase 1: Environment Setup

IMPORTANT: Install into the EXISTING project. Do NOT run `npm init -y`.

```bash
# Install Playwright and axe-core as dev dependencies
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium

# Create test directories
mkdir -p tests/e2e tests/security tests/visual tests/accessibility tests/performance
mkdir -p tests/fixtures tests/.auth
mkdir -p reports screenshots
```

Add to .gitignore:
```
test-results/
playwright-report/
tests/.auth/
screenshots/
```

Add test scripts to the existing package.json (merge, don't overwrite):
```json
{
  "test:e2e": "playwright test",
  "test:security": "playwright test tests/security/",
  "test:a11y": "playwright test tests/accessibility/",
  "test:visual": "playwright test tests/visual/"
}
```

### CSP Test Mode

The app uses nonce-based CSP that will block Playwright's injected scripts and axe-core.
Add a test-mode flag to src/proxy.ts.

Find the line where CSP header is set (something like `finalResponse.headers.set('Content-Security-Policy', csp)`)
and change it to:
```typescript
const cspHeader = process.env.PLAYWRIGHT_TESTING === 'true'
  ? 'Content-Security-Policy-Report-Only'
  : 'Content-Security-Policy';
finalResponse.headers.set(cspHeader, csp);
```

This switches to Report-Only mode during tests so Playwright/axe-core can inject scripts.

### Playwright Configuration

Create playwright.config.ts at project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Serial by default to avoid DB conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid Supabase data conflicts
  reporter: [['html', { outputFolder: 'reports' }], ['json', { outputFile: 'reports/bug-report.json' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry', // Only trace on retry, not every test (Playwright best practice)
    screenshot: 'only-on-failure',
  },
  // Auto-start the dev server (Next.js recommended approach)
  webServer: {
    command: 'PLAYWRIGHT_TESTING=true npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    // Auth setup -- runs first, saves storageState for each role
    { name: 'setup', testDir: './tests/fixtures', testMatch: 'auth.setup.ts' },

    // English LTR
    {
      name: 'en-desktop',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'en-mobile',
      use: { ...devices['Pixel 5'], storageState: 'tests/.auth/admin.json' },
      dependencies: ['setup'],
    },

    // Arabic RTL
    {
      name: 'ar-desktop',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/admin.json', locale: 'ar' },
      dependencies: ['setup'],
    },
    {
      name: 'ar-mobile',
      use: { ...devices['Pixel 5'], storageState: 'tests/.auth/admin.json', locale: 'ar' },
      dependencies: ['setup'],
    },

    // Security tests -- use different auth states
    {
      name: 'security',
      testDir: './tests/security',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

## Phase 2: Auth Fixtures (CRITICAL)

### Auth Setup (tests/fixtures/auth.setup.ts)

Use Playwright's official storageState pattern to log in once per role and reuse cookies:

```typescript
import { test as setup, expect } from '@playwright/test';

const TEST_ACCOUNTS = {
  admin: { identifier: '[ADMIN_EMAIL]', password: '[PASSWORD]' },
  church_admin: { identifier: '[CHURCH_ADMIN_EMAIL]', password: '[PASSWORD]' },
  teacher: { identifier: '[TEACHER_EMAIL]', password: '[PASSWORD]' },
  parent: { identifier: '[PARENT_EMAIL]', password: '[PASSWORD]' },
  student: { identifier: '[STUDENT_6_DIGIT_CODE]', password: '[PASSWORD]' },
};

for (const [role, creds] of Object.entries(TEST_ACCOUNTS)) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|identifier|user code/i).fill(creds.identifier);
    await page.getByLabel(/password/i).fill(creds.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(admin|dashboard)/);
    await page.context().storageState({ path: `tests/.auth/${role}.json` });
  });
}
```

### Test Helpers (tests/fixtures/helpers.ts)

```typescript
import { Page } from '@playwright/test';

export async function setLocale(page: Page, locale: 'en' | 'ar') {
  await page.context().addCookies([{
    name: 'NEXT_LOCALE',
    value: locale,
    domain: 'localhost',
    path: '/',
  }]);
}

export async function setDarkMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
}

export function uniqueId(prefix: string) {
  return `${prefix}-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
```

## Phase 3: Test Suites

### 3A. Smoke Tests (tests/e2e/smoke.spec.ts)
Quick health checks for all major pages:
- All main routes return 200 (not 404 or 500) or redirect to login
- Critical elements render on each page (heading, navigation)
- No console errors on page load
- All images load successfully (no broken image placeholders)
- Page has a `<title>` tag
- Page has exactly one `<h1>`

Use user-facing locators:
```typescript
// GOOD: user-facing locators (Playwright best practice)
await page.getByRole('heading', { level: 1 });
await page.getByRole('navigation');
await page.getByLabel('Search');

// BAD: implementation details (anti-pattern)
// await page.locator('.header-title');
// await page.locator('#nav-container');
```

### 3B. Flow Tests (tests/e2e/flows.spec.ts)
End-to-end user journey testing per role:

**Admin flows:**
- Create a new user (test role hierarchy -- admin can't create super_admin)
- Manage classes (CRUD)
- View announcements
- Navigate all admin sections

**Teacher flows:**
- View assigned classes
- Take attendance
- View student profiles

**Parent flows:**
- View child's dashboard
- View grades/activities

**All roles:**
- Login with valid credentials
- Login with invalid credentials (error message appears)
- Logout and verify redirect to login
- Form validation with invalid data (empty, malformed, boundary values)

### 3C. Security Tests (tests/security/) -- OWASP WSTG Aligned

**auth-bypass.spec.ts -- Forced Browsing (WSTG-AUTHZ-02):**
```typescript
// For each protected admin route, attempt access without authentication
const ADMIN_ROUTES = ['/admin', '/admin/users', '/admin/classes', '/admin/settings'];
const TEACHER_ROUTES = ['/dashboard/teacher'];
const PARENT_ROUTES = ['/dashboard/parents'];

test('unauthenticated users cannot access admin routes', async ({ page }) => {
  for (const route of ADMIN_ROUTES) {
    const response = await page.goto(route);
    // Should redirect to /login OR return 401
    expect(page.url()).toContain('/login');
  }
});
```

**role-escalation.spec.ts -- Vertical Privilege Escalation (WSTG-AUTHZ-03):**
```typescript
// Log in as teacher, try to access admin routes
test('teacher cannot access admin routes', async ({ browser }) => {
  const context = await browser.newContext({ storageState: 'tests/.auth/teacher.json' });
  const page = await context.newPage();
  for (const route of ADMIN_ROUTES) {
    await page.goto(route);
    // Should redirect away or show 403
    expect(page.url()).not.toContain('/admin');
  }
});

// Log in as parent, try to access teacher routes
test('parent cannot access teacher routes', async ({ browser }) => {
  const context = await browser.newContext({ storageState: 'tests/.auth/parent.json' });
  const page = await context.newPage();
  await page.goto('/dashboard/teacher');
  expect(page.url()).not.toContain('/dashboard/teacher');
});
```

**csrf.spec.ts -- Cross-Origin Request Testing:**
```typescript
// Send POST requests to mutation endpoints with mismatched Origin header
test('cross-origin POST to create-user returns 403', async ({ request }) => {
  const response = await request.post('/api/admin/create-user', {
    headers: {
      'Origin': 'https://evil.example.com',
      'Host': 'localhost:3000',
    },
    data: { email: 'test@test.com', password: 'password123', role: 'student' },
  });
  expect(response.status()).toBe(403);
});
```

**rate-limit.spec.ts -- Rate Limiting Verification:**
```typescript
test('login is rate-limited to 5 attempts per minute', async ({ page }) => {
  for (let i = 0; i < 6; i++) {
    await page.goto('/login');
    await page.getByLabel(/email|identifier/i).fill('nonexistent@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForTimeout(500);
  }
  // 6th attempt should show rate limit error
  await expect(page.getByText(/too many|rate limit|try again/i)).toBeVisible();
});
```

**rls-isolation.spec.ts -- Horizontal Access Control:**
```typescript
// Log in as teacher A, verify they cannot see teacher B's class data
// This requires two teacher accounts with different class assignments
```

### 3D. Accessibility Tests (tests/accessibility/a11y.spec.ts)

```bash
# axe-core is already installed above
```

Run axe-core on every major page in BOTH locales:
```typescript
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/admin', '/dashboard/teacher', '/dashboard/parents', '/login'];
const LOCALES = ['en', 'ar'];

for (const locale of LOCALES) {
  for (const pagePath of PAGES) {
    test(`a11y: ${pagePath} [${locale}]`, async ({ page }) => {
      await setLocale(page, locale);
      await page.goto(pagePath);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
```

Additional checks:
- Keyboard navigation (tab order, focus traps in modals)
- Skip-to-content link works
- All form inputs have associated labels
- Color contrast ratios (4.5:1 text, 3:1 UI components)
- Heading hierarchy (no skipped levels)

### 3E. Visual Regression Tests (tests/visual/visual.spec.ts)

Screenshot comparison for key pages across the full matrix:
- 2 locales (en, ar) x 3 viewports (desktop 1280px, tablet 768px, mobile 375px) x 2 themes (light, dark)
- First run establishes baselines -- not a test pass
- Subsequent runs compare against baselines

```typescript
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

for (const locale of ['en', 'ar']) {
  for (const vp of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      test(`visual: login [${locale}/${vp.name}/${theme}]`, async ({ page }) => {
        await page.setViewportSize(vp);
        await setLocale(page, locale);
        if (theme === 'dark') await setDarkMode(page);
        await page.goto('/login');
        await expect(page).toHaveScreenshot(`login-${locale}-${vp.name}-${theme}.png`);
      });
    }
  }
}
```

RTL-specific visual checks:
- Verify `dir="rtl"` on `<html>` when locale is 'ar'
- Navigation items mirrored
- Text alignment flipped

### 3F. Performance Tests (tests/performance/perf.spec.ts)

Use Playwright's built-in performance APIs (NOT React DevTools):
```typescript
test('page load performance', async ({ page }) => {
  await page.goto('/login');
  const metrics = await page.evaluate(() => {
    const paint = performance.getEntriesByType('paint');
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      fcp: paint.find(e => e.name === 'first-contentful-paint')?.startTime,
      domContentLoaded: nav.domContentLoadedEventEnd,
      loadComplete: nav.loadEventEnd,
    };
  });
  expect(metrics.fcp).toBeLessThan(3000); // FCP under 3s
});
```

Check for:
- Page load times (FCP < 3s, LCP < 4s)
- No layout shift (CLS < 0.1)
- Slow API calls (flag any taking > 1s)

## Phase 4: Test Execution

```bash
# Start the dev server with CSP relaxed for testing
PLAYWRIGHT_TESTING=true npm run dev &

# Run all tests
npx playwright test

# Run specific category
npx playwright test tests/security/
npx playwright test tests/accessibility/

# The webServer config in playwright.config.ts can auto-start the server
# In that case, just run:
npx playwright test
```

## Phase 5: Bug Report Generation

After running all tests, analyze failures and produce a structured report.

### Bug Report Format (JSON):
```json
{
  "report_metadata": {
    "app_url": "",
    "date": "",
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "test_matrix": "2 locales x 3 viewports x 2 themes"
  },
  "bugs": [
    {
      "id": "BUG-001",
      "severity": "critical|high|medium|low|cosmetic",
      "category": "security|functional|rtl|accessibility|visual|responsive|performance",
      "title": "Short descriptive title",
      "page": "/path-or-component",
      "file_hint": "src/components/SomeComponent.tsx (line ~42)",
      "role_tested": "admin|teacher|parent|student|unauthenticated",
      "locale": "en|ar|both",
      "theme": "light|dark|both",
      "steps_to_reproduce": ["step1", "step2"],
      "expected": "what should happen",
      "actual": "what actually happens",
      "error_log": "console error or stack trace if available",
      "screenshot": "screenshots/bug-001.png",
      "viewport": "1280px|768px|375px",
      "owasp_ref": "WSTG-AUTHZ-02 (if applicable)",
      "suggested_fix": "Brief suggestion for the developer",
      "test_file": "tests/security/auth-bypass.spec.ts:42"
    }
  ],
  "security_summary": {
    "auth_bypass_issues": [],
    "csrf_issues": [],
    "role_escalation_issues": [],
    "rls_violations": []
  },
  "accessibility_summary": {
    "critical_violations": [],
    "serious_violations": [],
    "moderate_violations": []
  },
  "performance_summary": {
    "slow_pages": [],
    "cls_issues": []
  }
}
```

### Severity Definitions
- **Critical**: Auth bypass, data exposure across roles, app crashes, data loss, RLS violation
- **High**: Major feature broken, CSRF not enforced on mutation, workaround exists
- **Medium**: Feature works incorrectly in specific locale/viewport/theme
- **Low**: Minor visual or UX issue
- **Cosmetic**: Polish item

## Phase 6: Output
1. Save the JSON bug report to: reports/bug-report.json
2. Save the HTML Playwright report to: reports/
3. Save all failure screenshots to: screenshots/
4. Print an executive summary to terminal:
   - Total bugs by severity and category
   - Security issues (MUST list all, even if zero)
   - Top 5 most critical issues
   - Accessibility score per locale
   - Performance overview
   - Recommended fix priority order

IMPORTANT RULES:
- NEVER run `npm init -y` -- install in the existing project
- Use user-facing locators (getByRole, getByLabel, getByText) -- NOT CSS selectors
- Every bug MUST include steps to reproduce
- Include file_hint whenever you can trace the bug to source code
- Security bugs MUST reference the OWASP test ID
- Don't flag opinionated preferences as bugs
- If a test is flaky, run it 3 times before reporting
- The first visual regression run establishes baselines -- document this
```

---

## PHASE 3: HUMAN-REVIEWED BUG FIXING (CLAUDE CODE)

### Prompt 3 -- Bug Fixer with Human Review Gate

Run this prompt in Claude Code after Phases 0-2 are complete. Point it at the bug report(s).
It proposes fixes for human review rather than applying them autonomously.

**Best for:** Systematic, severity-ordered bug fixing with human oversight for safety.

**Key corrections from original:**
- Human review gate for Critical/High bugs (research shows 35%+ auto-fix failure rate)
- No `// Fixed: BUG-XXX` inline comments (use commit messages instead)
- Runs type checker and linter as part of verification
- Does NOT batch-apply all fixes before testing

```
You are a Senior Software Engineer receiving a QA bug report. Your task is to systematically propose and apply fixes, with human review for critical issues.

## Input
Load the bug report from: reports/bug-report.json (or the path provided).
Also load any manual QA report if available.

## IMPORTANT SAFETY RULES

1. **Critical and High severity security bugs**: PROPOSE a diff but DO NOT apply it. Show the diff to the user and wait for approval. These bugs involve auth guards, CSRF, RLS, role escalation -- incorrect fixes can introduce new vulnerabilities.

2. **Medium, Low, Cosmetic bugs**: You may fix these directly, but verify each fix before moving to the next one.

3. **DO NOT add `// Fixed: BUG-XXX` comments** to the code. Reference bug IDs in the git commit message, not inline. The project convention is: only add comments where logic isn't self-evident.

4. **DO NOT refactor surrounding code.** Keep fixes minimal and focused -- touch only what's needed to fix the reported bug.

5. **DO NOT use `console.log`** -- use the structured logger (`import { logger } from '@/lib/logger'` for server, `import { clientLogger } from '@/lib/client-logger'` for client).

## Fix Protocol

### Step 1: Triage and Plan
1. Read the full bug report
2. Group bugs by affected file/component
3. Identify bugs that share a root cause (fix once, resolve many)
4. Create a fix order: Critical > High > Medium > Low > Cosmetic
5. Print the plan before starting:

```
FIX PLAN
========
Critical (X bugs): [list]
High (X bugs): [list]
Medium (X bugs): [list]
Low (X bugs): [list]
Cosmetic (X bugs): [list]

Shared root causes identified:
- BUG-003 + BUG-007: Both caused by missing auth guard in [file]
- BUG-005 + BUG-012: Both caused by physical CSS properties instead of logical
```

### Step 2: Fix Execution

For EACH bug, in severity order:

**Critical/High (Human Review Required):**
1. Read the file_hint to locate the relevant code
2. Understand the root cause (don't just patch symptoms)
3. SHOW the proposed diff to the user. Do not apply it.
4. Wait for the user to approve or modify
5. After approval, apply the fix
6. Run the failing test to verify the fix
7. Run `npx tsc --noEmit` to check for type errors
8. Run `npm run lint` to check for lint errors

**Medium/Low/Cosmetic (Direct Fix):**
1. Read the file_hint to locate the relevant code
2. Understand the root cause
3. Apply the fix
4. Run the failing test to verify
5. Run `npx tsc --noEmit` after every 3rd fix

### Step 3: Verification

After ALL fixes are applied:
1. Run the full test suite: `npm test` (unit + integration)
2. Run E2E tests: `npx playwright test`
3. Run the type checker: `npx tsc --noEmit`
4. Run the linter: `npm run lint`

### Step 4: Fix Report

Output a summary:

```
FIX REPORT
==========
Date: [date]
Total Bugs Received: [N]
Bugs Fixed: [N]
Bugs Deferred: [N] (with reasons)

FIXES APPLIED:
- BUG-001 [Critical/Security]: [title]
  File: [file]
  Fix: [brief description]
  Verified: [test passed / type check passed]

- BUG-002 [High]: [title]
  File: [file]
  Fix: [brief description]
  Verified: [test passed]

DEFERRED:
- BUG-XXX [Low]: [title]
  Reason: [needs design decision / requires backend change / needs product input]

REGRESSION CHECK:
- Unit tests: PASS/FAIL
- E2E tests: PASS/FAIL
- Type check: PASS/FAIL
- Lint: PASS/FAIL
```

## Rules
- NEVER skip Critical or High severity bugs
- NEVER auto-apply Critical/High security fixes without human review
- If a fix would require a breaking change, flag it and propose the approach before applying
- If you're unsure about a fix, show the user two options and let them choose
- Keep fixes minimal and focused -- don't refactor unrelated code
- Preserve existing code style and patterns
- Use the project's established patterns:
  - Auth guards: requireAdmin(), requireAdminApiUser() etc.
  - API responses: apiSuccess(), apiError()
  - CSRF: validateCsrf() on POST/PUT/DELETE
  - Logging: logger.error(), logger.info() (never console.log)
  - Destructive UIs: ConfirmDialog (never window.confirm)
  - RTL: logical CSS (ps-/pe-/ms-/me-, never pl-/pr-/ml-/mr-)
```

---

## Appendix: Corrective Actions Applied

This corrected pipeline addresses the following issues from the adversarial review:

| # | Issue | Status |
|---|-------|--------|
| 1 | Ice Cream Cone anti-pattern (no unit/integration tests) | FIXED -- Added Phase 0 |
| 2 | `npm init -y` destroys package.json | FIXED -- Install as devDependencies |
| 3 | Auto-fix dangerous failure modes | FIXED -- Human review gate for Critical/High |
| 4 | No OWASP-aligned security testing | FIXED -- Added tests/security/ suite |
| 5 | Playwright best practices violated | FIXED -- storageState, user-facing locators, trace on retry |
| 6 | No test data management | FIXED -- Auth fixtures, unique IDs, seed strategy |
| 7 | Missing i18n/RTL testing | FIXED -- 2 locales x 3 viewports x 2 themes |
| 8 | CSP blocks Playwright/axe-core | FIXED -- env-gated Report-Only mode |
| 9 | SQL injection tests misdirected | FIXED -- Replaced with PostgREST filter + XSS tests |
| 10 | Next.js 16 specifics missing | FIXED -- webServer config, proxy.ts, server actions |
| 11 | `// Fixed: BUG-XXX` comment noise | FIXED -- Removed, use commit messages |
| 12 | Server actions untested | FIXED -- Added auth guard static analysis in Phase 0 |

## Sources

- [Playwright Official Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js Testing with Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
- [Martin Fowler -- The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [web.dev -- Testing Strategies](https://web.dev/articles/ta-strategies)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP -- Testing for Bypassing Authorization Schema](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/02-Testing_for_Bypassing_Authorization_Schema)
- [LLM-based Agents for Automated Bug Fixing (arxiv, 2024)](https://arxiv.org/html/2411.10213v2)
- [Adversarial Bug Reports in LLM-Based APR (arxiv, 2025)](https://arxiv.org/html/2509.05372v1)
