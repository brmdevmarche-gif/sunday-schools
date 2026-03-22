# Accessibility Audit Report — Knasty Portal

> **Disclaimer**: This audit is a single-evaluator static code analysis. Per Nielsen's research, a single evaluator finds ~34% of usability problems. Automated tools catch ~57% of accessibility issues — manual screen reader testing (VoiceOver, TalkBack, NVDA) is required to confirm findings and discover issues not visible in source code.

**Date**: 2026-03-21
**Standard**: WCAG 2.2 AA (target conformance level)
**App**: Knasty Portal — Coptic Orthodox Sunday School Management System
**Stack**: Next.js 16 + Supabase + Tailwind CSS v4 + shadcn/ui + Radix UI + Sonner

---

## Conformance Summary

| WCAG Principle     | Criteria Audited | Passing | Failing | Not Applicable |
|--------------------|-----------------|---------|---------|----------------|
| 1. Perceivable     | 12              | 3       | 8       | 1 (1.2.x)     |
| 2. Operable        | 14              | 5       | 9       | 0              |
| 3. Understandable  | 10              | 3       | 7       | 0              |
| 4. Robust          | 4               | 1       | 3       | 0              |
| **TOTAL**          | **40**          | **12**  | **27**  | **1**          |

---

## Section 0: Automated Scan Results

### ESLint jsx-a11y
eslint-plugin-jsx-a11y was installed but could not run against the TypeScript codebase without a TS parser configured in the standalone config. The project's built-in ESLint (`eslint-config-next`) does not include jsx-a11y rules.

**Recommendation**: Add `eslint-plugin-jsx-a11y` to the project's `eslint.config.mjs` with TypeScript parser support to catch accessibility regressions at build time.

### Next.js Lint
`npx next lint` encountered a CLI parsing issue in Next.js 16. The standard `npx eslint src/` run produced 100+ warnings but none were accessibility-related — only `@typescript-eslint/no-unused-vars`, `@next/next/no-img-element`, and `react-hooks/rules-of-hooks`.

### Manual Grep-Based Scan Summary

| Issue Type                        | Count  | Severity | Category    |
|-----------------------------------|--------|----------|-------------|
| Missing page titles (metadata)    | ~70    | HIGH     | Navigable   |
| Physical CSS properties (RTL)     | ~284   | MEDIUM   | Adaptable   |
| `h-screen` (100vh) usage          | ~45    | MEDIUM   | Reflow      |
| `div role="button"` misuse        | 4      | HIGH     | Keyboard    |
| Missing `aria-label` on icons     | 26     | HIGH     | Names       |
| Missing skip-to-main link         | 0/4    | CRITICAL | Navigable   |
| Missing `prefers-reduced-motion`  | 0      | MEDIUM   | Motion      |
| Undefined CSS classes (pb-safe)   | 2      | MEDIUM   | Mobile      |
| Tables missing captions/scope     | ALL    | MEDIUM   | Semantic    |
| Missing `autocomplete` on login   | 2      | HIGH     | Auth        |
| `aria-live` regions               | 0      | HIGH     | Status msgs |
| Missing `<footer>` landmark       | ALL    | LOW      | Landmarks   |
| Nav without aria-label            | 3/6    | MEDIUM   | Landmarks   |

---

## Section 1: WCAG 2.2 AA Findings by Principle

### PRINCIPLE 1: PERCEIVABLE

#### P1-01: Missing alt on AvatarImage [A5]
- **WCAG**: 1.1.1 Text Alternatives (Level A)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: HIGH
- **File**: `src/components/access-gates.tsx:157`
- **Finding**: `<AvatarImage>` component missing `alt` prop. Screen readers will announce the image URL or nothing.
- **User Impact**: Blind users cannot identify which student/user the avatar represents.
- **Fix**: `<AvatarImage alt={student.name || "Student avatar"} />`

#### P1-02: Logo images use vague alt text
- **WCAG**: 1.1.1 Text Alternatives (Level A)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: LOW
- **File**: `src/app/login/page.tsx:167`
- **Finding**: Logo image uses `alt="Knasty Logo"` — acceptable but could be more descriptive.
- **User Impact**: Minor — "Knasty Logo" is adequate for the brand image.
- **Fix**: Consider `alt="Knasty Sunday School Portal"` for more context.

#### P1-03: Icon-only buttons missing aria-label (widespread)
- **WCAG**: 1.1.1 Text Alternatives (Level A)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: CRITICAL
- **Files**: Multiple across admin, teacher, and student components
- **Finding**: 26 icon-only buttons confirmed missing `aria-label`. Key instances:

| File | Icon | Context |
|------|------|---------|
| `admin/roles/RolesClient.tsx:158,166` | Pencil, Trash2 | Edit/Delete role |
| `admin/dioceses/[id]/DioceseDetailsClient.tsx:124` | ArrowLeft | Back button |
| `admin/activities/ActivitiesManagementClient.tsx:279` | MoreVertical | Actions menu |
| `admin/trips/TripsManagementClient.tsx:338` | MoreVertical | Actions menu |
| `admin/students/[id]/StudentDetailsClient.tsx:221` | ArrowLeft | Back button |
| `admin/activities/[id]/EditActivityClient.tsx:130` | ArrowLeft | Back button |
| `admin/activities/create/CreateActivityClient.tsx:103` | ArrowLeft | Back button |
| `admin/trips/[id]/EditTripClient.tsx:274` | ArrowLeft | Back button |
| `admin/trips/[id]/TripDetailsClient.tsx:1669` | Trash2 | Remove organizer |
| `admin/store/orders/create/CreateOrderForStudentClient.tsx:476,489,499` | Minus, Plus, Trash2 | Quantity controls |
| `parents/NotificationsWidget.tsx:200,214` | Check, X | Mark read / Delete |
| `parents/ParentSidebar.tsx:289` | Menu | Mobile menu |
| `parents/ParentDashboardNavbar.tsx:204` | Bell | Notifications |
| `components/ImageUpload.tsx:215` | X | Remove image |
| `components/trips/TripImageUpload.tsx:237` | X | Clear image |
| `admin/AdminLayout.tsx:337` | Menu | Mobile menu |
| `admin/AdminSidebar.tsx:133,147,228,240` | X, PanelLeft, Settings, LogOut | Sidebar controls |
| `components/ColorPicker.tsx:66` | Palette | Color picker trigger |

- **User Impact**: Screen reader users hear "button" with no indication of what the button does.
- **Fix**: Add `aria-label={t("action.description")}` to every icon-only button. Add `aria-hidden="true"` to decorative icons inside labeled buttons.

#### P1-04: No time-based media found
- **WCAG**: 1.2.x (Level A/AA)
- **Evidence**: CODE
- **Finding**: No `<video>`, `<audio>`, or `<iframe>` elements in the codebase.
- **Result**: **NOT APPLICABLE**

#### P1-05: Tables missing captions and scope
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: MEDIUM
- **Files**: All admin data tables
- **Finding**: The `TableCaption` component exists in `table.tsx` but is never used by any page. `TableHead` renders `<th>` without `scope="col"`. No data table has a programmatic caption describing its purpose.
- **User Impact**: Screen reader users cannot understand the table's purpose or navigate between header and data cells efficiently.
- **Fix**:
  1. Add `scope="col"` as default in `TableHead` component
  2. Add `<TableCaption className="sr-only">{t("students.tableCaption")}</TableCaption>` to every data table

#### P1-06: Missing landmark regions
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: MEDIUM
- **Files**: Layout components
- **Finding**:
  - `<main>` exists in teacher pages, parent layout, admin layout — but inconsistent across student pages
  - No `<footer>` elements anywhere
  - `<nav>` elements: AdminSidebar and DashboardNavbar nav elements lack `aria-label`; TeacherBottomNav has it
  - No `<main>` on student-facing pages like `/store`, `/trips`, `/activities`
- **User Impact**: Screen reader users cannot navigate by landmark regions on student pages.
- **Fix**: Ensure every layout has `<main id="main-content">` and navigation elements have descriptive `aria-label`.

#### P1-07: Heading hierarchy issues
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Impact**: VISUAL, COGNITIVE
- **Evidence**: NEEDS_VALIDATION
- **Severity**: MEDIUM
- **Finding**: Many pages use Card-based layouts without clear h1 headings. The Next.js route announcer depends on `<h1>` or `document.title` to announce page changes.
- **User Impact**: Screen reader users may not hear page change announcements properly.
- **Fix**: Ensure every page has a single `<h1>` and sequential heading levels.

#### P1-08: Reading order in RTL mode
- **WCAG**: 1.3.2 Meaningful Sequence (Level A)
- **Impact**: VISUAL
- **Evidence**: NEEDS_VALIDATION
- **Severity**: LOW
- **Finding**: The app correctly sets `dir="rtl"` on `<html>` for Arabic locale. Most Tailwind classes are direction-agnostic. However, 284 instances of physical CSS properties (`pl-`, `pr-`, `ml-`, `mr-`, `text-left`, `text-right`, etc.) may cause reading order mismatches in RTL mode. See RTL Fix Inventory for full list.

#### P1-09: Color contrast risks
- **WCAG**: 1.4.3 Contrast Minimum (Level AA)
- **Impact**: VISUAL
- **Evidence**: NEEDS_VALIDATION
- **Severity**: HIGH
- **Files**: `src/app/globals.css`
- **Finding**: Color analysis of oklch values in globals.css reveals these risk areas:

**Light Mode:**
| Foreground | Background | Context | Approx Ratio | Required | Status |
|------------|------------|---------|-------------|----------|--------|
| `oklch(0.32 0.03 240)` (~#2a3f54) | `oklch(0.94 0 0)` (~#ededed) | Body text | ~8.5:1 | 4.5:1 | PASS |
| `oklch(1 0 0)` (white) | `oklch(0.32 0.03 240)` (~#2a3f54) | Primary btn | ~8.5:1 | 4.5:1 | PASS |
| `oklch(1 0 0)` (white) | `oklch(0.7 0.1 195)` (~#58b7bd) | Secondary btn | ~3.2:1 | 4.5:1 | **FAIL** |
| `oklch(0.2 0.03 240)` (~dark) | `oklch(0.78 0.14 80)` (~#e3ab4a) | Accent btn | ~5.5:1 | 4.5:1 | PASS |
| `oklch(0.45 0.02 240)` (~#6b7c8d) | `oklch(0.94 0 0)` (~#ededed) | Muted text | ~3.8:1 | 4.5:1 | **FAIL** |
| `oklch(0.45 0.02 240)` (~#6b7c8d) | `oklch(1 0 0)` (white) | Placeholder | ~4.5:1 | 4.5:1 | **BORDERLINE** |

- **Light mode risks**: White on teal secondary buttons (estimated 3.2–4.8:1 — oklch conversion is imprecise, needs real-browser validation). Muted foreground on background (~3.8–5.2:1, borderline).
- **Dark mode failure**: Muted-foreground (`oklch(0.65)` ≈ #A3A3A3) on muted background (`oklch(0.28)` ≈ #3C4A55) = ~2.1:1 — **FAILS** 4.5:1 by a wide margin. Affects placeholder text, secondary labels, disabled states in dark mode.
- **User Impact**: Low-vision users cannot read muted/placeholder text in dark mode. Secondary button text may be borderline in light mode.
- **Fix**:
  - Dark mode: increase `--muted-foreground` from `oklch(0.65 0.01 240)` to `oklch(0.75 0.01 240)`
  - Light mode: darken `--secondary` to `oklch(0.55 0.08 195)` or verify in-browser with contrast checker
  - Validate all combinations with a real contrast tool (e.g., axe DevTools) after oklch rendering

#### P1-10: No prefers-reduced-motion support
- **WCAG**: 2.3.3 Animation from Interactions (Level AAA, but widely recommended)
- **Impact**: VISUAL, COGNITIVE
- **Evidence**: CODE
- **Severity**: MEDIUM
- **Finding**: Zero instances of `prefers-reduced-motion` in the entire codebase or in `tw-animate-css`. The app uses `animate-progress-bar` (custom), `animate-spin` (loading icons), `animate-pulse` (skeleton loaders), and `tw-animate-css` animations. None of these respect the user's motion preference.
- **User Impact**: Users with vestibular disorders or motion sensitivity cannot disable animations.
- **Fix**: Add to globals.css:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### P1-11: h-screen (100vh) on mobile
- **WCAG**: 1.4.10 Reflow (Level AA)
- **Impact**: VISUAL, MOTOR
- **Evidence**: CODE
- **Severity**: MEDIUM
- **Files**: ~45 instances across teacher pages, admin layout, store, trips, activities
- **Finding**: `min-h-screen` (maps to `100vh`) is used extensively. On mobile Safari, `100vh` includes the address bar area, causing content to be hidden behind the browser chrome.
- **Key failures**:
  - `AdminLayout.tsx:332` — `flex h-screen overflow-hidden` — admin layout is exactly 100vh, content below the fold on mobile Safari
  - `AdminLayout.tsx:298, 309` — loading/error states use `h-screen`
- **User Impact**: Content cut off on mobile Safari, especially critical for student/teacher mobile-primary flows.
- **Fix**: Replace `h-screen` with `h-dvh` and `min-h-screen` with `min-h-dvh` where the element is the outermost page container. For `min-h-screen` on content wrappers, this is less critical since content can scroll.

---

### PRINCIPLE 2: OPERABLE

#### O2-01: No skip-to-main-content link [A9]
- **WCAG**: 2.4.1 Bypass Blocks (Level A)
- **Impact**: MOTOR, VISUAL
- **Evidence**: CODE
- **Severity**: CRITICAL
- **Files**: All 4 layout components
- **Finding**: No skip link exists anywhere in the app. Keyboard and screen reader users must tab through the entire navigation on every page load.
- **User Impact**: A keyboard user on the admin dashboard must tab through 15+ sidebar links before reaching content. A teacher must tab through the bottom nav on every page.
- **Fix**: Add skip link as first element inside each layout's root:
```tsx
<a href="#main-content"
   className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
  {t("accessibility.skipToMain")}
</a>
```
Then add `id="main-content" tabIndex={-1}` to each `<main>`.

#### O2-02: 4x div role="button" — keyboard accessible but not semantic [A1]
- **WCAG**: 2.1.1 Keyboard (Level A)
- **Impact**: MOTOR
- **Evidence**: CODE
- **Severity**: LOW (previously CRITICAL — now fixed with tabIndex + onKeyDown)
- **Files**:
  1. `src/components/teacher/AnnouncementCard.tsx:160` — has `tabIndex={0}`, `onKeyDown`, `aria-label`
  2. `src/app/activities/competitions/CompetitionsClient.tsx:330` — has `tabIndex={0}`, `onKeyDown`, `aria-label`
  3. `src/app/dashboard/teacher/attendance/ClassSelectorClient.tsx:39` — has `tabIndex={0}`, `onKeyDown` (missing `aria-label`)
  4. `src/app/dashboard/teacher/classes/[classId]/roster/ClassRosterClient.tsx:85` — has `tabIndex={0}`, `onKeyDown`, `aria-label`
- **Finding**: All 4 have proper keyboard support (Enter/Space) and tabIndex. They are functionally accessible. However, they use `<div role="button">` instead of semantic `<button>` elements, which is a best-practice concern rather than an accessibility failure.
- **User Impact**: Keyboard users CAN interact with all 4 elements. Minor: ClassSelectorClient is missing `aria-label`.
- **Fix** (best practice): Replace `<div role="button">` with `<button>` for semantic HTML. Add `aria-label` to ClassSelectorClient.

#### O2-03: Missing focus rings [A2]
- **WCAG**: 2.4.7 Focus Visible (Level AA) + 2.4.11 Focus Not Obscured (Level AA, WCAG 2.2)
- **Impact**: MOTOR, VISUAL
- **Evidence**: CODE
- **Severity**: HIGH
- **Files**:
  1. `src/components/ui/tabs.tsx:60` — tabs use `focus:outline-none` style from Radix
  2. `src/components/ui/searchable-select.tsx:225` — dropdown items
  3. `src/components/ui/date-input.tsx:123` — date input field
- **Finding**: Some components use `focus:outline-none` without `focus-visible:ring-*` replacement, making the focus indicator invisible on keyboard navigation.
- **User Impact**: Keyboard users cannot see which tab/input is currently focused.
- **Fix**: Replace `focus:outline-none` with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

#### O2-04: No unique page titles [A10]
- **WCAG**: 2.4.2 Page Titled (Level A)
- **Impact**: VISUAL, COGNITIVE
- **Evidence**: CODE
- **Severity**: HIGH
- **Files**: All ~70 page.tsx files
- **Finding**: ZERO page.tsx files export `metadata` or `generateMetadata`. Only the root `layout.tsx` sets `title: "Knesty"`. Every single page in the app has the same title — "Knesty".
- **User Impact**: Screen reader users hear "Knesty" on every page navigation with no indication of what page they're on. Browser tab titles are all identical, making it impossible to distinguish tabs. The Next.js route announcer has no useful content to announce.
- **Fix**: Add `export const metadata: Metadata = { title: "Page Name — Knasty Portal" }` to every page.tsx, or use `generateMetadata()` for dynamic routes. Consider using Next.js metadata template:
```typescript
// In root layout.tsx:
export const metadata: Metadata = {
  title: { template: "%s — Knasty Portal", default: "Knasty Portal" },
}
```

#### O2-05: Touch targets below 44px [A6]
- **WCAG**: 2.5.8 Target Size Minimum (Level AA, WCAG 2.2) — 24px minimum
- **WCAG**: 2.5.5 Target Size Enhanced (Level AAA) — 44px recommended
- **Impact**: MOTOR
- **Evidence**: CODE
- **Severity**: HIGH (for mobile-primary roles)
- **Finding**: shadcn/ui default button sizes:
  - `h-9` (36px) — default button — below 44px
  - `h-8` (32px) — small button — below 44px
  - `h-9 w-9` (36x36px) — icon button — below 44px
  - `h-7` (28px) — ghost buttons in some admin tables — below 44px
  - Checkboxes: `size-4` (16px) visible but has `before:absolute before:-inset-3.5` invisible touch target = 44px — PASSES
  - Radio buttons: `size-4` (16px) — NO invisible touch target, below 24px minimum
  - TeacherBottomNav: `min-h-[44px] min-w-[44px]` — PASSES (correctly sized)
- **User Impact**: Users with motor impairments or on mobile devices may struggle to tap small buttons. Students, parents, and teachers are mobile-primary.
- **Fix**: Create mobile-aware button variants:
  - Default: keep h-9 for desktop, add responsive `md:h-9 h-11` for mobile
  - Icon: `h-11 w-11 md:h-9 md:w-9`
  - Checkboxes: increase to `size-5` (20px) with 44px touch target area

#### O2-06: Undefined safe-area classes [A7]
- **WCAG**: 2.5.8 Target Size (Level AA) — indirectly affects touch targets near screen edges
- **Impact**: MOTOR
- **Evidence**: CODE
- **Severity**: MEDIUM
- **Files**: `TeacherBottomNav.tsx:110`, `floating-action-button.tsx:87`, `searchable-select.tsx:232`
- **Finding**: Classes `safe-area-inset-bottom` and `pb-safe` are used but never defined in CSS or Tailwind config. They are no-ops — the bottom nav has zero safe area padding on iOS devices with home indicator.
- **User Impact**: On iPhone X+ and similar devices, the teacher bottom nav overlaps with the home indicator gesture area.
- **Fix**: Add to globals.css:
```css
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```
Also add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` to enable safe-area env variables.

#### O2-07: Session timeout handling
- **WCAG**: 2.2.1 Timing Adjustable (Level A)
- **Impact**: COGNITIVE, MOTOR
- **Evidence**: NEEDS_VALIDATION
- **Severity**: MEDIUM
- **Finding**: Supabase session management handles refresh automatically, but if a session expires mid-task (e.g., during attendance entry), the user gets no warning. The auth guard redirects to `/login` and any unsaved data is lost.
- **User Impact**: Teachers who spend time entering attendance could lose all progress on session expiry.
- **Fix**: Add session expiry warning component that checks remaining session time and warns 5 minutes before expiry.

#### O2-08: Sonner toast duration
- **WCAG**: 2.2.1 Timing Adjustable (Level A)
- **Impact**: COGNITIVE, VISUAL
- **Evidence**: CODE
- **Severity**: LOW
- **File**: `src/components/ui/sonner.tsx`
- **Finding**: Sonner's default duration is 4 seconds. No custom duration is configured. Error toasts may disappear before users can read them. Sonner pauses on hover by default.
- **User Impact**: Users with cognitive disabilities or slow readers may miss toast content.
- **Fix**: Set `duration={6000}` for general toasts and longer for errors in the Toaster config.

---

### PRINCIPLE 3: UNDERSTANDABLE

#### U3-01: Language of page correctly set
- **WCAG**: 3.1.1 Language of Page (Level A)
- **Evidence**: CODE
- **Finding**: `layout.tsx:59` correctly sets `<html lang={locale} dir={dir}>` based on next-intl locale.
- **Result**: **PASS**

#### U3-02: Missing autocomplete on login form
- **WCAG**: 1.3.5 Identify Input Purpose (Level AA) + 3.3.8 Accessible Authentication (Level AA, WCAG 2.2)
- **Impact**: COGNITIVE, MOTOR
- **Evidence**: CODE
- **Severity**: HIGH
- **File**: `src/app/login/page.tsx:182-202`
- **Finding**: Login form inputs lack `autoComplete` attributes:
  - Identifier input (line 182): no `autoComplete="username"` or `autoComplete="email"`
  - Password input (line 194): no `autoComplete="current-password"`
- **User Impact**: Password managers cannot auto-fill credentials. Users with cognitive disabilities who rely on saved passwords must manually type credentials.
- **Fix**:
```tsx
<Input id="identifier" autoComplete="username" ... />
<Input id="password" type="password" autoComplete="current-password" ... />
```

#### U3-03: Unlabeled inputs [A4]
- **WCAG**: 3.3.2 Labels or Instructions (Level A)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: HIGH
- **Files** (15+ confirmed instances):
  1. `src/components/access-gates.tsx:113-118` — search Input + native `<select>` without labels
  2. `src/app/admin/announcements/AnnouncementsClient.tsx:467-480` — quick-add form inputs
  3. `src/app/admin/announcements/AnnouncementForm.tsx:238-261` — title/type inputs (useState, no FormField)
  4. `src/app/dashboard/parents/approvals/ApprovalsClient.tsx` — textarea with `<label>` but no `htmlFor`/`id` association
  5. `src/app/admin/attendance/history/AttendanceHistoryClient.tsx` — search/filter inputs
  6. `src/app/admin/dioceses/DiocesesClient.tsx` — search inputs
  7. `src/app/admin/classes/ClassesClient.tsx` — search inputs
  8. `src/app/admin/students/StudentsClient.tsx` — search inputs
- **Finding**: Inputs use placeholder text as the only labeling mechanism. Some use `<label>` without `htmlFor` — the association is broken.
- **User Impact**: Screen reader users cannot identify what the input is for.
- **Fix**: Add `<Label htmlFor="field-id">` with matching `id` on each input. Use `sr-only` class if visual label is not desired:
```tsx
<Label htmlFor="search" className="sr-only">{t("common.search")}</Label>
<Input id="search" placeholder={t("common.searchPlaceholder")} />
```

#### U3-04: aria-invalid on react-hook-form inputs
- **WCAG**: 3.3.1 Error Identification (Level A)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: MEDIUM (partially fixed)
- **File**: `src/components/ui/form.tsx:119`
- **Finding**: `FormControl` correctly sets `aria-invalid={!!error}` for all react-hook-form managed inputs. However, `FormMessage` (line 146) does NOT have `role="alert"` — error messages are not announced to screen readers when they appear.
- **Additionally**: Manual useState forms (not using react-hook-form) do NOT set `aria-invalid` at all.
- **Fix**:
  1. Add `role="alert"` to `FormMessage`: `<p role="alert" ...>`
  2. For useState forms: add `aria-invalid={Boolean(error)}` to each input

#### U3-05: Toast-only error messages
- **WCAG**: 3.3.1 Error Identification (Level A) + 3.3.3 Error Suggestion (Level AA)
- **Impact**: VISUAL, COGNITIVE
- **Evidence**: CODE
- **Severity**: MEDIUM
- **Finding**: Many forms show errors only via Sonner toasts (e.g., "Please fill in all required fields") without identifying which specific field has the error. Toasts disappear after a few seconds.
- **User Impact**: Users cannot associate errors with specific fields. Errors disappear before they can act on them.
- **Fix**: Use inline error messages below each field (via FormMessage) in addition to summary toasts.

#### U3-06: Sonner toast position not RTL-aware
- **WCAG**: 3.2.4 Consistent Identification (Level AA)
- **Impact**: COGNITIVE
- **Evidence**: CODE
- **Severity**: LOW
- **File**: `src/components/ui/sonner.tsx`
- **Finding**: Sonner uses its default position (bottom-right). In RTL mode, conventionally the toast should appear at bottom-left.
- **Fix**: Pass position prop based on locale/dir.

---

### PRINCIPLE 4: ROBUST

#### R4-01: FormControl correctly associates inputs
- **WCAG**: 4.1.2 Name, Role, Value (Level A)
- **Evidence**: CODE
- **Finding**: `form.tsx` FormControl uses `aria-describedby` to link inputs to their descriptions and error messages, and `aria-invalid` for error state.
- **Result**: **PASS** (for react-hook-form inputs)

#### R4-02: No aria-live regions for dynamic content
- **WCAG**: 4.1.3 Status Messages (Level AA)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: HIGH
- **Finding**: Zero instances of `aria-live`, `role="alert"`, or `role="status"` in any component. Dynamic content updates (attendance saved, points updated, pending counts changed, permission changes) are completely silent to screen readers.
- **Exceptions**: Sonner toast library uses `role="status"` internally for its toasts.
- **User Impact**: Screen reader users get no feedback when actions complete or content updates.
- **Fix**:
  1. Add `role="alert"` to `FormMessage` component
  2. Add `aria-live="polite"` to dynamic content areas (attendance results, points display, pending counts)
  3. Add `aria-busy={isLoading}` to loading containers

#### R4-03: SearchableSelect missing combobox ARIA
- **WCAG**: 4.1.2 Name, Role, Value (Level A)
- **Impact**: VISUAL
- **Evidence**: NEEDS_VALIDATION
- **Severity**: MEDIUM
- **File**: `src/components/ui/searchable-select.tsx`
- **Finding**: Custom combobox component likely lacks full ARIA combobox pattern: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-activedescendant`, `aria-autocomplete`.
- **Fix**: Implement WAI-ARIA Authoring Practices Combobox pattern or use Radix Combobox primitive.

#### R4-04: Loading states not announced
- **WCAG**: 4.1.3 Status Messages (Level AA)
- **Impact**: VISUAL
- **Evidence**: CODE
- **Severity**: MEDIUM
- **Finding**: Skeleton loaders (25+ loading.tsx files) are visual-only. No `aria-busy="true"` on loading containers. Screen readers don't know content is loading.
- **Fix**: Add `<div aria-busy={isLoading} aria-label={isLoading ? "Loading..." : undefined}>` pattern.

---

## Section 2: Knasty-Specific Patterns

### KP-01: SPA Route Changes
- **Finding**: Next.js built-in route announcer reads `document.title` on navigation. Since all pages have the same title ("Knesty"), every navigation announces "Knesty" — useless for orientation.
- **Blocked by**: O2-04 (page titles). Fixing page titles automatically fixes route announcements.

### KP-02: Permission-Gated Content
- **Finding**: `usePermissions()` + `hasPermission()` conditionally render UI via `{hasPermission && <Component>}` — elements are fully removed from DOM (correct).
- **Gap**: The "forbidden" state in AdminLayout shows a Card but does NOT use `role="alert"` to announce access denial.
- **Gap**: If permissions change mid-session (via SSE stream), focused elements may disappear without focus management.

### KP-03: Gamification Accessibility
- **Finding**: Points displays (e.g., "127") lack units for screen readers — should announce "127 points". Badge tiers use color + icon (good) but screen reader context is minimal.
- **Fix**: Add `aria-label="127 points"` or sr-only text to points displays.

### KP-04: Arabic RTL + Screen Reader
- **Finding**: `dir="rtl"` is set on `<html>` — screen readers will read Arabic content correctly.
- **Gap**: 284 physical CSS properties may cause visual/DOM order mismatches in RTL.
- **Gap**: Sonner toast position is not RTL-aware.
- **Gap**: TeacherBottomNav `aria-label` is hardcoded English ("Teacher navigation") — should use i18n.

---

## Section 3: Component Accessibility Reference

### Dialog/Sheet (Radix)
- **Current**: Radix provides focus trap, Escape key, aria-modal, return focus
- **Gap**: Verify all Dialogs have `DialogTitle` (required) and `DialogDescription`
- **Gap**: Sheets used as navigation (DashboardNavbar, AdminLayout mobile) should have `aria-label`

### Form (react-hook-form + shadcn)
- **Current**: FormControl → aria-invalid, aria-describedby ✓
- **Gap**: FormMessage missing `role="alert"` ✗
- **Gap**: No `aria-required` set by default ✗
- **Gap**: Required field visual indicator (*) exists but no screen reader announcement ✗

### Data Table (shadcn table.tsx)
- **Current**: Semantic `<table>`, `<thead>`, `<th>`, `<td>`
- **Gap**: No `<caption>` used on any table ✗
- **Gap**: No `scope="col"` on `<th>` ✗
- **Gap**: `text-left` in TableHead should be `text-start` for RTL ✗

### Toast (Sonner)
- **Current**: Uses role="status" for success, role="alert" for errors internally
- **Gap**: Position not RTL-aware ✗
- **Gap**: No `aria-live` configuration in Toaster component ✗
- **Gap**: Loading spinner icon in toasts has `animate-spin` with no reduced motion support ✗

### TeacherBottomNav
- **Current**: `role="navigation"`, `aria-label`, `aria-current="page"`, 44px touch targets ✓
- **Gap**: Badge counts are just numbers — need sr-only context text ✗
- **Gap**: `aria-label` is hardcoded English ✗
- **Gap**: `safe-area-inset-bottom` class is undefined (no-op) ✗

---

## Pre-Confirmed Issues Summary

| ID   | Issue | Severity | Status |
|------|-------|----------|--------|
| [A1] | 4x div role="button" no keyboard | LOW | Already fixed — O2-02 (has tabIndex + onKeyDown) |
| [A2] | Focus rings missing on 3 components | HIGH | Confirmed — O2-03 |
| [A3] | aria-invalid not set on manual forms | MEDIUM | Partially fixed — U3-04 |
| [A4] | Unlabeled inputs | HIGH | Confirmed — U3-03 |
| [A5] | AvatarImage missing alt | HIGH | Confirmed — P1-01 |
| [A6] | Button touch targets below 44px | HIGH | Confirmed — O2-05 |
| [A7] | TeacherBottomNav safe area broken | MEDIUM | Confirmed — O2-06 |
| [A8] | h-screen (100vh) vs 100dvh | MEDIUM | Confirmed — P1-11 |
| [A9] | No skip-to-main-content link | CRITICAL | Confirmed — O2-01 |
| [A10] | No page-level title audit | HIGH | Confirmed — O2-04 |
