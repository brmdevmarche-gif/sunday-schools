# UX + Accessibility Implementation Plan — Knasty Portal

**Date**: 2026-03-21
**Standard**: WCAG 2.2 AA

All tracks are merged into a single prioritized plan. Accessibility tasks are integrated alongside UX tasks — not treated as separate workstreams.

---

## Sprint 1: Critical Blockers (Week 1)

These issues block keyboard users and screen reader users from basic app functionality.

### AA1. Add skip-to-main-content links to all 4 layouts [CRITICAL]
- **WCAG**: 2.4.1 Bypass Blocks (Level A)
- **Files**: `DashboardNavbar.tsx`, `ParentDashboardNavbar.tsx`, teacher layout (wrapping TeacherBottomNav), `AdminLayout.tsx`
- **Changes**:
  1. Create `src/components/ui/skip-link.tsx` reusable component
  2. Add SkipLink as first child in each layout
  3. Add `id="main-content" tabIndex={-1}` to each `<main>` element
  4. Add i18n keys: `accessibility.skipToMain` to `en.json` + `ar.json`
- **Effort**: S | **Deps**: None

### ~~AA2. Fix 4x div role="button"~~ [ALREADY FIXED]
- All 4 instances already have `tabIndex={0}`, `onKeyDown` (Enter/Space), and `aria-label` (except ClassSelectorClient which needs `aria-label` added).
- **Remaining**: Add `aria-label` to `ClassSelectorClient.tsx:39`. Best practice: convert to `<button>` for semantic HTML.
- **Effort**: XS | **Deps**: None

### AA3. Add unique page titles to ALL routes [HIGH]
- **WCAG**: 2.4.2 Page Titled (Level A)
- **Files**: All ~70 page.tsx files + root layout
- **Changes**:
  1. In `layout.tsx`, change metadata.title to template: `{ template: "%s — Knasty Portal", default: "Knasty Portal" }`
  2. Add `export const metadata: Metadata = { title: "Page Name" }` to every page.tsx
  3. Use `generateMetadata()` for dynamic routes (student details, class details, etc.)
  4. Add i18n keys: `pageTitles.*` namespace to `en.json` + `ar.json`
- **Effort**: L (many files, simple change each) | **Deps**: None

### AA4. Fix focus rings on 3 components [HIGH]
- **WCAG**: 2.4.7 Focus Visible (Level AA)
- **Files**: `tabs.tsx:60`, `searchable-select.tsx:225`, `date-input.tsx:123`
- **Change**: Replace `focus:outline-none` with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Effort**: XS | **Deps**: None

### AA5. Fix unlabeled inputs [HIGH]
- **WCAG**: 3.3.2 Labels or Instructions (Level A)
- **Files**: `AnnouncementsClient.tsx:488-510`, `access-gates.tsx:113-118`
- **Change**: Add `<Label htmlFor="id" className="sr-only">` + matching `id` to each Input
- **Effort**: XS | **Deps**: None

### AA6. Fix AvatarImage missing alt [HIGH]
- **WCAG**: 1.1.1 Text Alternatives (Level A)
- **File**: `access-gates.tsx:157`
- **Change**: `<AvatarImage alt={student.name || t("student.defaultAvatar")} />`
- **Effort**: XS | **Deps**: None

### AA7. Add autocomplete to login form [HIGH]
- **WCAG**: 1.3.5 + 3.3.8 Accessible Authentication (Level AA)
- **File**: `src/app/login/page.tsx:182-202`
- **Change**: Add `autoComplete="username"` and `autoComplete="current-password"`
- **Effort**: XS | **Deps**: None

### AA8. Fix color contrast failures [HIGH]
- **WCAG**: 1.4.3 Contrast Minimum (Level AA)
- **File**: `src/app/globals.css`
- **Changes**:
  1. Darken `--secondary` from `oklch(0.7 0.1 195)` to `oklch(0.55 0.08 195)` OR change `--secondary-foreground` to dark
  2. Darken `--muted-foreground` from `oklch(0.45 0.02 240)` to `oklch(0.40 0.02 240)`
  3. Darken `--border` from `oklch(0.86 0.01 240)` to `oklch(0.75 0.01 240)` for 3:1 non-text contrast
- **Effort**: S | **Deps**: None | **Risk**: Visual appearance changes — get design approval

---

## Sprint 2: High Impact (Week 2)

### AB1. Add aria-label to ALL icon-only buttons [HIGH]
- **WCAG**: 1.1.1 Text Alternatives (Level A)
- **Scope**: 26 confirmed buttons across admin, parent, and shared components
- **Change**: Add `aria-label={t("action.description")}` to each. Add `aria-hidden="true"` to icon inside.
- **Effort**: M | **Deps**: None

### AB2. Add role="alert" to FormMessage [HIGH]
- **WCAG**: 4.1.3 Status Messages (Level AA)
- **File**: `src/components/ui/form.tsx:146`
- **Change**: Add `role="alert"` to the `<p>` element
- **Effort**: XS | **Deps**: None

### AB3. Add prefers-reduced-motion support [MEDIUM]
- **WCAG**: 2.3.3 Animation from Interactions
- **File**: `src/app/globals.css`
- **Change**: Add `@media (prefers-reduced-motion: reduce)` block
- **Effort**: XS | **Deps**: None

### AB4. Define safe-area CSS classes [MEDIUM]
- **File**: `src/app/globals.css`
- **Change**: Add `.safe-area-inset-bottom` and `.pb-safe` with `env(safe-area-inset-bottom)`
- **Also**: Verify viewport meta tag has `viewport-fit=cover`
- **Effort**: XS | **Deps**: None

### AB5. Fix h-screen → h-dvh in layout containers [MEDIUM]
- **Files**: `AdminLayout.tsx:298,309,332` (critical), and ~42 other files with `min-h-screen`
- **Change**: Replace `h-screen` with `h-dvh`, `min-h-screen` with `min-h-dvh` in layout-level containers
- **Effort**: M | **Deps**: None

### AB6. Fix Sonner Toaster for RTL + duration [MEDIUM]
- **File**: `src/components/ui/sonner.tsx`
- **Change**: Add locale-aware position and custom duration
- **Effort**: XS | **Deps**: None

### AB7. Add aria-live to key dynamic content areas [HIGH]
- **WCAG**: 4.1.3 Status Messages (Level AA)
- **Files**: Loading skeletons, attendance results, points displays
- **Change**: Add `aria-busy={isLoading}` to loading containers, `aria-live="polite"` to dynamic content
- **Effort**: M | **Deps**: None

### AB8. Add scope="col" and text-start to TableHead [MEDIUM]
- **File**: `src/components/ui/table.tsx`
- **Change**: Add `scope="col"` default, change `text-left` to `text-start`
- **Effort**: XS | **Deps**: None

### AB9. Add TableCaption to all data tables [MEDIUM]
- **Files**: All admin list pages using Table component
- **Change**: Add `<TableCaption className="sr-only">{t("table.caption")}</TableCaption>`
- **Effort**: S | **Deps**: AB8

---

## Sprint 3: Structural & RTL (Week 3)

### AC1. Add landmark regions to all page types [MEDIUM]
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Files**: Student pages (store, trips, activities), admin pages
- **Changes**:
  1. Ensure `<main id="main-content">` on every page
  2. Add `aria-label` to navigation elements: AdminSidebar, DashboardNavbar
  3. Add `<footer>` where appropriate
- **Effort**: M | **Deps**: AA1 (skip links depend on main-content id)

### AC2. Fix heading hierarchy across all pages [MEDIUM]
- **WCAG**: 1.3.1 Info and Relationships (Level A)
- **Files**: All page types
- **Change**: Ensure single h1 per page, sequential heading levels
- **Effort**: M | **Deps**: None

### AC3. Implement ARIA combobox on SearchableSelect [MEDIUM]
- **WCAG**: 4.1.2 Name, Role, Value (Level A)
- **File**: `src/components/ui/searchable-select.tsx`
- **Change**: Add `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-activedescendant`
- **Effort**: M | **Deps**: None

### AC4. RTL physical CSS → logical CSS migration [MEDIUM]
- **Scope**: ~284 instances across ~50+ files
- **Changes**:
  - `pl-*` → `ps-*`, `pr-*` → `pe-*`
  - `ml-*` → `ms-*`, `mr-*` → `me-*`
  - `text-left` → `text-start`, `text-right` → `text-end`
  - `left-*` → `start-*`, `right-*` → `end-*`
  - `border-l-*` → `border-s-*`, `border-r-*` → `border-e-*`
- **Effort**: L | **Deps**: None
- **See**: rtl-fix-inventory.md for complete file-by-file list

### AC5. Add aria-required to form fields [MEDIUM]
- **WCAG**: 3.3.2 Labels or Instructions (Level A)
- **Files**: All form components using react-hook-form
- **Change**: Add `aria-required="true"` to required FormControl inputs
- **Effort**: S | **Deps**: None

### AC6. Improve badge/count screen reader context [MEDIUM]
- **Files**: TeacherBottomNav badges, points displays, gamification numbers
- **Change**: Add sr-only text for context (e.g., "3 pending items", "127 points")
- **Effort**: S | **Deps**: None

### AC7. i18n TeacherBottomNav aria-label [LOW]
- **File**: `TeacherBottomNav.tsx:114`
- **Change**: Replace hardcoded `"Teacher navigation"` with `t("nav.teacherNavigation")`
- **Effort**: XS | **Deps**: None

---

## Sprint 4: Tooling & Polish (Week 4)

### AD1. Install eslint-plugin-jsx-a11y [LOW]
- **File**: `eslint.config.mjs`
- **Change**: Add jsx-a11y recommended rules with TypeScript parser
- **Effort**: XS (install) + M (fix surfaced errors)

### AD2. Increase touch targets for mobile-primary roles [HIGH]
- **Files**: `button.tsx`, `checkbox.tsx`, `radio-group.tsx`
- **Change**: Add responsive mobile touch target sizes (44px on mobile)
- **Effort**: M | **Deps**: None

### AD3. Add loading state announcements to skeleton pages [MEDIUM]
- **Files**: All 25+ loading.tsx files
- **Change**: Add `aria-busy="true"` and `aria-label="Loading..."` to root container
- **Effort**: M | **Deps**: None

### AD4. Manual testing protocol [NO CODE]
Before shipping, test with:
1. VoiceOver on iOS (Safari) — teacher attendance flow
2. TalkBack on Android — parent approval flow
3. Keyboard only (no mouse) — admin class management flow
4. 200% browser zoom on admin dashboard
5. Arabic locale + RTL for all three flows above

---

## Dependency Graph

```
SPRINT 1 (all parallelizable):
  AA1 (skip links)        ─── start immediately
  AA2 (div→button)        ─── start immediately
  AA3 (page titles)       ─── start immediately
  AA4 (focus rings)       ─── start immediately
  AA5 (unlabeled inputs)  ─── start immediately
  AA6 (avatar alt)        ─── start immediately
  AA7 (login autocomplete)─── start immediately
  AA8 (color contrast)    ─── start immediately

SPRINT 2:
  AB1 (icon aria-labels)  ─── start immediately
  AB2 (FormMessage alert) ─── start immediately
  AB3 (reduced motion)    ─── start immediately
  AB4 (safe area CSS)     ─── start immediately
  AB5 (h-dvh migration)   ─── start immediately
  AB6 (Sonner RTL)        ─── start immediately
  AB7 (aria-live)         ─── start immediately
  AB8 (table scope)       ─── start immediately
  AB9 (table captions)    ─── after AB8

SPRINT 3:
  AC1 (landmarks)         ─── after AA1
  AC2 (headings)          ─── start immediately
  AC3 (combobox ARIA)     ─── start immediately
  AC4 (RTL migration)     ─── start immediately
  AC5 (aria-required)     ─── start immediately
  AC6 (badge context)     ─── start immediately
  AC7 (i18n aria-label)   ─── start immediately

SPRINT 4:
  AD1 (eslint a11y)       ─── start immediately
  AD2 (touch targets)     ─── start immediately
  AD3 (loading states)    ─── start immediately
  AD4 (manual testing)    ─── after all code changes
```

---

## Effort Summary

| Sprint | Tasks | XS | S | M | L | Total Effort |
|--------|-------|----|---|---|---|-------------|
| 1      | 8     | 5  | 1 | 0 | 1 | ~3-4 days   |
| 2      | 9     | 4  | 1 | 3 | 0 | ~3-4 days   |
| 3      | 7     | 1  | 2 | 2 | 1 | ~4-5 days   |
| 4      | 4     | 1  | 0 | 3 | 0 | ~3-4 days   |

**Total estimated**: ~2-3 weeks of focused work.
