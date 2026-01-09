# Knasty Portal - Comprehensive UX/UI Audit Report

**Prepared by:** Sally (UX Expert)
**Date:** January 2026
**Version:** 1.0

---

## Executive Summary

This comprehensive UX/UI audit covers the entire Knasty Portal application, including 53+ routes, 40+ client components, and 28 UI components. The application demonstrates solid foundational design with consistent use of shadcn/ui components, good RTL support, and a cohesive design system. However, there are systematic issues across modules that, if addressed, would significantly improve usability, accessibility, and user experience.

### Overall Score: **7.2/10**

| Category | Score | Notes |
|----------|-------|-------|
| Visual Consistency | 8/10 | Strong shadcn/ui foundation, minor inconsistencies |
| Mobile Responsiveness | 6/10 | Many breakpoint issues on grid layouts |
| Accessibility | 6/10 | Missing ARIA labels, color-only indicators |
| i18n/RTL Support | 7/10 | Good structure, hardcoded strings remain |
| User Experience | 7.5/10 | Clear flows, some friction points |
| Information Architecture | 8/10 | Well-organized, logical navigation |

---

## Table of Contents

1. [Design System Analysis](#1-design-system-analysis)
2. [Authentication & Login](#2-authentication--login)
3. [Student Dashboard](#3-student-dashboard)
4. [Activities Module](#4-activities-module)
5. [Attendance Module](#5-attendance-module)
6. [Trips Module](#6-trips-module)
7. [Store Module](#7-store-module)
8. [Announcements Module](#8-announcements-module)
9. [Admin Panel](#9-admin-panel)
10. [Cross-Cutting Issues](#10-cross-cutting-issues)
11. [Improvement Plan](#11-improvement-plan)

---

## 1. Design System Analysis

### Color Palette (globals.css)

**Strengths:**
- Modern OKLCH color space for perceptually uniform colors
- Proper dark mode support with semantic color tokens
- Brand-consistent palette (dark blue primary, teal secondary, golden accent)

**Issues:**

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| No semantic success/warning colors | Medium | Add `--success`, `--warning` CSS variables |
| Chart colors not used consistently | Low | Standardize chart usage across components |
| No focus ring color distinct from ring | Low | Add `--focus-ring` for better focus visibility |

### Typography

**Current:** Geist Sans (system font) with monospace variant

**Issues:**
- No defined type scale hierarchy beyond Tailwind defaults
- Inconsistent heading sizes across pages (text-2xl vs text-3xl)

### Spacing & Layout

**Strengths:**
- Consistent use of container with mx-auto px-4
- Good use of gap utilities for flex/grid spacing

**Issues:**
- Inconsistent section padding (py-4, py-6, py-8 used interchangeably)
- No standardized spacing scale documentation

---

## 2. Authentication & Login

**File:** `src/app/login/page.tsx`

### Strengths
- Clean, centered card layout
- Theme and language selectors in top bar
- RTL-aware arrow rotation
- Handles both email and 6-digit user code login

### Issues

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | No "Forgot Password" flow | - | Add password reset link |
| High | No password visibility toggle | 225-233 | Add show/hide password button |
| Medium | No form validation feedback | 209-241 | Add inline validation errors |
| Medium | No loading skeleton while checking auth | - | Add suspense boundary |
| Low | Logo hardcoded size (80x80) | 196-202 | Consider responsive sizing |
| Low | No "Remember me" option | - | Add persistent session toggle |

### Accessibility
- Missing `aria-live` for form errors
- Password input lacks `autocomplete="current-password"`

---

## 3. Student Dashboard

**File:** `src/app/dashboard/page.tsx`

### Strengths
- Beautiful hero section with church cover image parallax
- Clear points card with gradient design
- Navigation cards with icons and descriptions
- Integrated announcements widget

### Issues

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| Critical | CSS typo: `p-4bg-white/70` | 231 | Fix to `p-4 bg-white/70` |
| High | Hero image parallax breaks on iOS Safari | 208-226 | Use CSS approach or disable on mobile |
| High | Points card text may be illegible | 275-315 | Ensure WCAG contrast on gradient |
| Medium | Navigation cards don't show loading state | 323-359 | Add skeleton loaders |
| Medium | "Coming Soon" badge not translated | 340-342 | Use `t("studentHome.comingSoon")` |
| Low | User code displayed without copy button | 247-253 | Add click-to-copy functionality |

### Mobile UX
- Profile section stacks well on mobile
- Navigation card grid responsive (cols-1 -> cols-2 -> cols-3)

---

## 4. Activities Module

### 4.1 Activities Hub (`ActivitiesClient.tsx`)

**Strengths:**
- Good filter system (search + status dropdown)
- Clear status badges for participation state
- Enhanced activities navigation cards

**Issues:**

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | Back button goes to `router.back()` | 233 | Navigate to `/dashboard` explicitly |
| Medium | No pagination for large activity lists | - | Add infinite scroll or pagination |
| Medium | Activity cards have no skeleton loading | - | Add loading state |
| Low | `confirm()` for withdraw uses browser dialog | 146 | Use custom confirmation dialog |

### 4.2 Competitions Admin (`CompetitionsAdminClient.tsx`)

**Issues:**

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | Stats grid breaks on mobile (`grid-cols-4`) | 174 | Change to `grid-cols-2 md:grid-cols-4` |
| High | No search/filter functionality | 209-266 | Add search input and status filter |
| High | Eye button lacks tooltip/aria-label | 256-258 | Add accessibility labels |
| Medium | No edit/delete actions in table | - | Add dropdown menu with actions |
| Medium | Long form dialog (12+ fields) | 310-525 | Consider multi-step wizard |
| Medium | Place bonus labels not translated | 453-476 | Add i18n keys for "1st Place", etc. |
| Low | Missing Arabic description field | 344-352 | Add `description_ar` input |

### 4.3 Competition Detail (`CompetitionDetailClient.tsx`)

**Issues:**

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| Critical | File upload not implemented | 130-133 | Implement or hide PDF option |
| High | Prize texts hardcoded in English | 295-314 | Translate "1st Place", "2nd Place", "3rd Place" |
| Medium | No confirmation before submit | 109-159 | Add confirmation step |
| Medium | Progress bar lacks `aria-label` | 210 | Add screen reader label |
| Low | My Submission card below fold | 350 | Move higher for submitted users |

---

## 5. Attendance Module

**File:** `src/app/attendance/TeacherAttendanceClient.tsx`

### Strengths
- Touch-friendly buttons (h-12, h-14 sizing)
- Clear visual feedback with status colors
- Floating save FAB for mobile
- Quick actions for bulk marking

### Issues

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | Deprecated CSS: `bg-linear-to-br` | 256 | Change to `bg-gradient-to-br` |
| High | Quick action buttons lack dark mode styles | 427-458 | Add dark mode variants |
| Medium | No offline support | - | Cache attendance for offline entry |
| Medium | Notes field only shows after status selected | 605-614 | Always show notes option |
| Low | No undo for accidental status changes | - | Add undo toast action |

### Accessibility
- Status buttons have hidden labels on mobile (`hidden sm:inline`)
- Need accessible alternatives for color-only indicators

---

## 6. Trips Module

**File:** `src/app/trips/TripsClient.tsx`

### Strengths
- Good filter by trip type
- Clear status badges (approved/pending/rejected)
- Trip cards show key info (dates, price tiers, destinations)

### Issues

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | Three price tiers crammed in one line | 354-362 | Use responsive table or cards |
| High | Trip types not translated | 269-270 | Use `t(`trips.types.${trip.trip_type}`)` |
| Medium | Image error handling hides element | 258-260 | Show placeholder instead |
| Medium | No trip sorting (by date, price) | - | Add sort dropdown |
| Low | Subscribe dialog lacks loading overlay | 420-491 | Add loading state to entire dialog |

---

## 7. Store Module

**File:** `src/app/store/StoreClient.tsx`

### Strengths
- Excellent cart UX with floating FAB
- Real-time points balance display
- Two-step checkout with confirmation
- "Locked" state for unaffordable items

### Issues

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | Price tier hardcoded to "normal" | 95 | Get actual tier from user profile |
| Medium | No category/filter options | - | Add category tabs or filter |
| Medium | Cart state lost on page refresh | - | Persist cart in localStorage |
| Medium | Sticky points bar animation jarring | 248-274 | Use smoother CSS transition |
| Low | No wishlist/save for later | - | Add wishlist functionality |
| Low | Item grid jumps on scroll (hasScrolled) | 82-91 | Use smoother layout shift handling |

### E-commerce UX Best Practices Missing
- No "recently viewed" items
- No related items suggestions
- No quantity input (only +/- buttons)
- No search history/autocomplete

---

## 8. Announcements Module

**File:** `src/app/admin/announcements/AnnouncementsClient.tsx`

### Strengths
- Comprehensive status tabs (all/active/scheduled/expired/deleted)
- Good scoping system (dioceses -> churches -> classes)
- Quick date range presets (week, month, etc.)
- Type tags with autocomplete suggestions

### Issues

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | Dialog extremely long (900+ lines) | 471-690 | Refactor into separate component |
| High | Many hardcoded English strings | Various | Add translations for "Title", "Description", etc. |
| Medium | DateTimePicker is custom inline component | 338-378 | Extract to reusable component |
| Medium | Table rows clickable but no visual affordance | 723-771 | Add hover effect or cursor change |
| Low | Republish dialog shares state variables | 276-315 | Isolate state per dialog |

---

## 9. Admin Panel

### 9.1 Admin Sidebar (`AdminSidebar.tsx`)

**Strengths:**
- Collapsible with tooltip support
- Mobile-responsive with sheet pattern
- RTL-aware icon rotation

**Issues:**

| Priority | Issue | Line | Recommendation |
|----------|-------|------|----------------|
| High | "Settings" and "Logout" not translated | 231, 245, 254, 265 | Use t() for these strings |
| Medium | No keyboard navigation indicators | - | Add focus-visible styles |
| Medium | Logo alt text says "Knesty" (typo) | 121 | Change to "Knasty" |
| Low | User info hidden in collapsed state | 159-170 | Consider avatar-only view |

### 9.2 Admin Layout Patterns

**Observed inconsistencies across admin pages:**

| Pattern | Used In | Issue |
|---------|---------|-------|
| Page header with back button | Some pages | Not all admin pages have back navigation |
| Search + Filter row | Activities, Users | Missing in Competitions, Readings |
| Table vs Card grid | Mixed | Some use tables, others use card grids |
| Dropdown menu for actions | Activities | Missing in Competitions |
| Bulk actions | Attendance | Not available in other modules |

---

## 10. Cross-Cutting Issues

### 10.1 Mobile Responsiveness

**Systematic grid breakpoint issues:**

| Component | Current | Should Be |
|-----------|---------|-----------|
| Stats cards (4-column) | `grid-cols-4` | `grid-cols-2 md:grid-cols-4` |
| Stats cards (3-column) | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` |
| Activities/Trips grid | `md:grid-cols-2 lg:grid-cols-3` | Good |
| Store grid | `md:cols-2 lg:cols-3 xl:cols-4` | Good |

### 10.2 Accessibility (WCAG 2.1 AA)

**Critical issues:**

1. **Icon-only buttons without labels** (High)
   - Back buttons, action buttons, FABs
   - Fix: Add `aria-label` to all icon buttons

2. **Color-only status indicators** (High)
   - Status badges rely solely on color
   - Fix: Always include text or icon alongside color

3. **Missing form labels** (Medium)
   - Some inputs lack associated labels
   - Fix: Ensure all inputs have `<Label htmlFor="...">` or `aria-label`

4. **Focus management in dialogs** (Medium)
   - Focus doesn't trap in modals on some browsers
   - Fix: Use Radix Dialog's built-in focus trapping properly

5. **No skip links** (Low)
   - Admin panel lacks skip-to-content link
   - Fix: Add skip navigation link

### 10.3 Internationalization (i18n)

**Hardcoded strings found:**

| Location | Strings |
|----------|---------|
| CompetitionDetailClient | "1st Place", "2nd Place", "3rd Place" |
| AdminSidebar | "Settings", "Logout" |
| AnnouncementsClient | "Title", "Description", "Types (tags)", etc. |
| Various | Date formatting without locale |

**RTL issues:**
- Most arrow icons properly use `rtl:rotate-180`
- Some `ml-*` should be `ms-*` for RTL support

### 10.4 Performance

**Opportunities:**

1. **No skeleton loaders** - Most pages show nothing while loading
2. **No image optimization** - Using `<img>` instead of `next/image` in many places
3. **Large bundle components** - AnnouncementsClient is 900+ lines
4. **No virtualization** - Long lists not virtualized

### 10.5 Error Handling

**Current patterns:**
- Using `toast.error()` for all errors
- Browser `confirm()` for destructive actions

**Improvements needed:**
- Custom error boundaries
- Inline form validation
- Custom confirmation dialogs
- Retry mechanisms for failed actions

---

## 11. Improvement Plan

### Phase 1: Critical Fixes (Week 1-2)

**P0 - Must Fix:**

1. **Fix CSS typo in Dashboard** (`p-4bg-white/70`)
   - File: `src/app/dashboard/page.tsx:231`

2. **Fix deprecated CSS** (`bg-linear-to-br`)
   - File: `src/app/attendance/TeacherAttendanceClient.tsx:256`

3. **Fix mobile grid breakpoints** (all stat cards)
   - Pattern: `grid-cols-4` -> `grid-cols-2 md:grid-cols-4`
   - Affects: Dashboard, Competitions Admin, Activities

4. **Implement file upload or hide PDF option**
   - File: `CompetitionDetailClient.tsx:130-133`

5. **Add aria-labels to icon buttons**
   - All back buttons, action buttons, FABs

### Phase 2: UX Improvements (Week 3-4)

**P1 - High Impact:**

1. **Add search/filter to admin tables**
   - Competitions Admin, Readings Admin

2. **Add edit/delete actions to Competitions table**
   - Mirror ActivitiesManagementClient pattern

3. **Add skeleton loading states**
   - All list views and data-dependent components

4. **Translate hardcoded strings**
   - Prize labels, sidebar, announcements form

5. **Add password visibility toggle to login**
   - Standard UX pattern

6. **Refactor long components**
   - AnnouncementsClient -> smaller components

### Phase 3: Enhanced Features (Week 5-6)

**P2 - Nice to Have:**

1. **Multi-step wizard for competition creation**
   - Break 12+ field form into logical steps

2. **Offline support for attendance**
   - Cache data for entry without connection

3. **Cart persistence in Store**
   - localStorage for cart state

4. **Custom confirmation dialogs**
   - Replace browser `confirm()`

5. **User price tier implementation**
   - Store currently hardcodes "normal"

### Phase 4: Polish & Optimization (Week 7-8)

**P3 - Refinement:**

1. **Add virtualization for long lists**
   - react-window or similar

2. **Image optimization**
   - Replace `<img>` with `next/image`

3. **Add focus indicators**
   - Visible focus rings for keyboard nav

4. **Add skip links to admin panel**
   - Accessibility improvement

5. **Standardize spacing/padding**
   - Document and enforce consistent spacing

---

## Component-Specific Recommendations

### Reusable Components to Create

1. **`<StatCard>`** - Standardize stats display
2. **`<PageHeader>`** - Consistent page headers with back nav
3. **`<DataTable>`** - Standardize admin tables
4. **`<ConfirmDialog>`** - Replace browser confirm()
5. **`<EmptyState>`** - Consistent empty state pattern
6. **`<SkeletonCard>`** - Loading state for cards
7. **`<PriceDisplay>`** - Handle currency formatting with i18n

### Design Tokens to Add

```css
/* Semantic colors */
--success: oklch(0.6 0.15 145);
--warning: oklch(0.75 0.15 85);
--info: oklch(0.6 0.12 230);

/* Spacing scale */
--space-section: 1.5rem;    /* py-6 */
--space-component: 1rem;    /* gap-4 */
--space-element: 0.5rem;    /* gap-2 */
```

---

## Appendix: File Reference

### Key Files Audited

| Module | Files |
|--------|-------|
| Auth | `src/app/login/page.tsx` |
| Dashboard | `src/app/dashboard/page.tsx` |
| Activities | `ActivitiesClient.tsx`, `CompetitionsAdminClient.tsx`, `CompetitionDetailClient.tsx`, `CompetitionsClient.tsx` |
| Attendance | `TeacherAttendanceClient.tsx` |
| Trips | `TripsClient.tsx` |
| Store | `StoreClient.tsx` |
| Announcements | `AnnouncementsClient.tsx` |
| Admin | `AdminSidebar.tsx`, `ActivitiesManagementClient.tsx` |
| Design System | `globals.css` |

---

## Summary

The Knasty Portal has a strong foundation with modern tooling (Next.js 16, Tailwind CSS 4, Radix UI). The main areas requiring attention are:

1. **Mobile responsiveness** - Grid layouts need better breakpoints
2. **Accessibility** - Icon buttons need labels, color-only indicators need alternatives
3. **i18n completeness** - Several hardcoded strings remain
4. **UX consistency** - Standardize patterns across admin modules
5. **Performance** - Add loading states and optimize images

Following the phased improvement plan will systematically address these issues while maintaining the application's current functionality.

---

---

## Appendix B: Implementation Progress Log

### Completed (January 2026)

#### Phase 1 - Critical Fixes ✅
| Task | Status | Files Modified |
|------|--------|----------------|
| Fix CSS typo (`p-4bg-white/70`) | ✅ Done | `src/app/dashboard/page.tsx` |
| Fix deprecated CSS (`bg-linear-to-br`) | ✅ Done | `src/app/attendance/TeacherAttendanceClient.tsx` |
| Fix mobile grid breakpoints | ✅ Done | `CompetitionsAdminClient.tsx`, `CompetitionsClient.tsx`, `CompetitionDetailClient.tsx` |
| Add aria-labels to icon buttons | ✅ Done | `ActivitiesClient.tsx`, `StoreClient.tsx`, `TripsClient.tsx`, `CompetitionsAdminClient.tsx` |
| Add missing translations | ✅ Done | `messages/en.json`, `messages/ar.json` |
| Add search/filter to Competitions | ✅ Done | `CompetitionsAdminClient.tsx` |

#### Phase 2 - UX Improvements ✅
| Task | Status | Files Created/Modified |
|------|--------|------------------------|
| Skeleton loading - Competitions | ✅ Done | `src/app/activities/competitions/loading.tsx` |
| Skeleton loading - Activities | ✅ Done | `src/app/activities/loading.tsx` |
| Skeleton loading - Store | ✅ Done | `src/app/store/loading.tsx` |
| Create ConfirmDialog component | ✅ Done | `src/components/ui/confirm-dialog.tsx` |
| Edit/Delete dropdown - Competitions | ✅ Done | `CompetitionsAdminClient.tsx` |

#### Dioceses & Churches Admin - Implemented ✅
| Task | Status | Files Modified/Created |
|------|--------|------------------------|
| Replace confirm() with ConfirmDialog | ✅ Done | `DiocesesClient.tsx`, `ChurchesClient.tsx` |
| Add aria-labels to icon buttons | ✅ Done | `DiocesesClient.tsx`, `ChurchesClient.tsx` |
| Create loading skeletons (list pages) | ✅ Done | `src/app/admin/dioceses/loading.tsx`, `src/app/admin/churches/loading.tsx` |
| Add missing translations | ✅ Done | `messages/en.json`, `messages/ar.json` |
| Replace native inputs with shadcn/ui | ✅ Done | `DioceseDetailsClient.tsx`, `ChurchDetailsClient.tsx` |
| Replace native img with next/image | ✅ Done | `DioceseDetailsClient.tsx`, `ChurchDetailsClient.tsx` |
| Refactor tabs to shadcn/ui Tabs | ✅ Done | `DioceseDetailsClient.tsx`, `ChurchDetailsClient.tsx` |
| Create loading skeletons (detail pages) | ✅ Done | `src/app/admin/dioceses/[id]/loading.tsx`, `src/app/admin/churches/[id]/loading.tsx` |
| Add breadcrumb navigation | ✅ Done | `DioceseDetailsClient.tsx`, `ChurchDetailsClient.tsx`, `src/components/ui/breadcrumb.tsx` |
| Add loading states to save buttons | ✅ Done | `DioceseDetailsClient.tsx`, `ChurchDetailsClient.tsx` (Loader2 spinner) |
| Implement table sorting | ✅ Done | `DiocesesClient.tsx`, `ChurchesClient.tsx` (sortable columns with icons) |
| Add empty state designs | ✅ Done | `DiocesesClient.tsx`, `ChurchesClient.tsx`, `src/components/ui/empty-state.tsx` |

#### Phase 3 - Pending
- [ ] Add offline support for attendance
- [ ] Add cart persistence in Store
- [ ] Refactor AnnouncementsClient
- [ ] Add virtualization for long lists

#### Phase 4 - Pending
- [ ] Image optimization (next/image)
- [ ] Add focus indicators
- [ ] Add skip links to admin
- [ ] Standardize spacing/padding

### Modules Audited
- [x] Authentication & Login
- [x] Dashboard
- [x] Activities Hub & Sub-modules (Competitions, Readings, Spiritual Notes)
- [x] Attendance
- [x] Trips
- [x] Store
- [x] Announcements
- [x] Admin Panel & Navigation
- [x] Dioceses Management
- [x] Churches Management
- [x] Classes Management
- [ ] Users Management
- [ ] Students Management

---

## Appendix C: Dioceses & Churches Admin Audit

**Audit Date:** January 2026

### C.1 Dioceses Management

#### C.1.1 Dioceses List (`DiocesesClient.tsx`)

**File:** `src/app/admin/dioceses/DiocesesClient.tsx` (445 lines)

**Strengths:**
- Clean table layout with consistent columns
- Create/Edit dialog with proper form validation
- Diocese admin management panel (assign/remove admins)
- Search functionality available
- Good use of Card and Badge components

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| High | Uses browser `confirm()` for delete | ~340 | Replace with ConfirmDialog component |
| High | Icon buttons lack aria-labels | Various | Add `aria-label` to Shield, Pencil, Trash2, ChevronRight icons |
| Medium | No loading skeleton | - | Add `loading.tsx` file for route |
| Medium | Hardcoded strings ("Diocese Admins", "Churches", etc.) | Various | Add i18n translation keys |
| Low | Table has no empty state design | - | Add styled empty state component |
| Low | Pagination missing for large lists | - | Add pagination or infinite scroll |

**Accessibility Issues:**
- Shield icon button (admins) - no aria-label
- Pencil icon button (edit) - no aria-label
- Trash2 icon button (delete) - no aria-label
- ChevronRight icon (navigate) - no aria-label

---

#### C.1.2 Diocese Details (`DioceseDetailsClient.tsx`)

**File:** `src/app/admin/dioceses/[id]/DioceseDetailsClient.tsx` (610 lines)

**Strengths:**
- Comprehensive detail view with multiple tabs
- Theme customization with ColorPicker
- Churches list with inline management
- Good use of inline editing pattern

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| High | Uses native HTML `<input>` in edit mode | Various | Use shadcn/ui Input component for consistency |
| High | Uses native `<img>` instead of next/image | ~180-195 | Replace with Image component for optimization |
| High | Custom tab implementation | ~210-250 | Use shadcn/ui Tabs component |
| Medium | Browser `confirm()` for destructive actions | ~400-420 | Replace with ConfirmDialog |
| Medium | Hardcoded English strings | Various | Add i18n keys: "No diocese admins assigned", "Churches in this diocese", "Basic Info", "Theme Settings", "Diocese Admins" |
| Medium | No loading state when saving | - | Add loading spinner to save buttons |
| Low | Theme preview not reactive | ~320 | Show real-time preview of color changes |
| Low | No breadcrumb navigation | - | Add breadcrumb: Admin > Dioceses > [Diocese Name] |

**Component Consistency Issues:**
- Edit mode uses `<input className="...">` instead of `<Input />` from shadcn/ui
- Tab buttons are custom-built instead of using Tabs from shadcn/ui
- Cover image uses `<img>` instead of `<Image>` from next/image

---

### C.2 Churches Management

#### C.2.1 Churches List (`ChurchesClient.tsx`)

**File:** `src/app/admin/churches/ChurchesClient.tsx` (505 lines)

**Strengths:**
- Diocese filter dropdown for hierarchical navigation
- Consistent table layout matching Dioceses
- Good badge usage for status
- Search functionality available

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| High | Uses browser `confirm()` for delete | ~380 | Replace with ConfirmDialog component |
| High | Icon buttons lack aria-labels | Various | Add `aria-label` to all icon buttons |
| Medium | No loading skeleton | - | Add `loading.tsx` file |
| Medium | Diocese filter not translated | ~185 | Use `t("churches.filterByDiocese")` |
| Medium | Hardcoded strings | Various | Translate "Church Classes", "Members", etc. |
| Low | No bulk operations | - | Consider bulk delete/archive |
| Low | Table sort not implemented | - | Add sortable columns |

**Accessibility Issues:**
- Pencil icon (edit) - no aria-label
- Trash2 icon (delete) - no aria-label
- ChevronRight icon (view details) - no aria-label
- Users icon (members) - no aria-label

---

#### C.2.2 Church Details (`ChurchDetailsClient.tsx`)

**File:** `src/app/admin/churches/[id]/ChurchDetailsClient.tsx` (534 lines)

**Strengths:**
- Comprehensive detail view with classes management
- Inline editing for church info
- Good information hierarchy
- Cover image support

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| High | Uses native HTML `<input>` in edit mode | Various | Use shadcn/ui Input component |
| High | Uses native `<img>` for cover image | ~165-180 | Replace with Image from next/image |
| High | Custom tabs implementation | ~200-240 | Use shadcn/ui Tabs component |
| Medium | Browser `confirm()` for deletes | ~350 | Replace with ConfirmDialog |
| Medium | Hardcoded English strings | Various | Translate: "Basic Info", "Classes", "Members", "No classes", etc. |
| Medium | No loading states on actions | - | Add loading spinners |
| Low | No breadcrumb navigation | - | Add: Admin > Churches > [Church Name] |
| Low | Class list not paginated | - | Add pagination for churches with many classes |

---

### C.3 Summary of Common Issues (Dioceses & Churches)

**Pattern Issues Found:**

1. **Browser confirm() Usage** - Both modules use `window.confirm()` for delete operations. Should use the new ConfirmDialog component.

2. **Icon Button Accessibility** - Multiple icon-only buttons throughout both modules lack aria-labels:
   - Edit (Pencil)
   - Delete (Trash2)
   - View Details (ChevronRight)
   - Manage Admins (Shield)
   - Members (Users)

3. **Component Inconsistency** - Edit modes use native HTML inputs instead of shadcn/ui Input components.

4. **Custom Tabs** - Both detail pages implement custom tab UIs instead of using the shadcn/ui Tabs component.

5. **Image Optimization** - Cover images use native `<img>` tags instead of next/image for optimization.

6. **i18n Gaps** - Multiple hardcoded English strings in both modules.

7. **No Loading Skeletons** - Neither module has `loading.tsx` files for route-level loading states.

---

### C.4 Recommended Fixes for Dioceses & Churches

**Priority 1 (Critical):**
```
✅ Replace browser confirm() with ConfirmDialog in both modules
✅ Add aria-labels to all icon-only buttons
✅ Replace native <input> with shadcn/ui Input in edit modes (detail pages)
```

**Priority 2 (High):**
```
✅ Create loading.tsx skeletons for both routes (list and detail pages)
✅ Add missing i18n translation keys
✅ Replace native <img> with next/image (detail pages)
✅ Refactor custom tabs to use shadcn/ui Tabs (detail pages)
```

**Priority 3 (Medium):**
```
✅ Add breadcrumb navigation (using shadcn/ui Breadcrumb component with RTL support)
✅ Add loading states to save buttons (Loader2 spinner with animation)
✅ Implement table sorting (sortable columns: Name, Location, Churches/Classes count)
✅ Add empty state designs (new EmptyState component with icon, title, description, action)
```

**Translation Keys Needed:**
```json
{
  "dioceses": {
    "dioceseAdmins": "Diocese Admins",
    "noAdmins": "No diocese admins assigned",
    "churches": "Churches",
    "basicInfo": "Basic Info",
    "themeSettings": "Theme Settings",
    "churchesInDiocese": "Churches in this diocese"
  },
  "churches": {
    "filterByDiocese": "Filter by Diocese",
    "churchClasses": "Church Classes",
    "members": "Members",
    "noClasses": "No classes found",
    "basicInfo": "Basic Info",
    "classes": "Classes"
  }
}
```

---

## Appendix D: Classes Management Audit

**Audit Date:** January 2026

### D.1 Classes List (`ClassesClient.tsx`)

**File:** `src/app/admin/classes/ClassesClient.tsx` (952 lines)

**Strengths:**
- Good hierarchical filter system (Diocese → Church cascade)
- Comprehensive create/edit dialog with proper form fields
- User assignment dialog with search and multi-select
- Roster dialog with teachers/students sections
- Proper toast notifications for success/error states

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| High | Uses browser `confirm()` for delete | ~280, ~298 | Replace with ConfirmDialog component |
| High | Icon buttons lack aria-labels | ~465-519 | Add `aria-label` to Users, UserPlus, User, Pencil, Trash2 icons |
| High | No loading skeleton | - | Create `loading.tsx` file for route |
| Medium | Empty state is plain text | ~413-415 | Use EmptyState component |
| Medium | RTL issue: `mr-2` instead of `me-2` | ~344 | Change to `me-2` for RTL support |
| Low | No table sorting | - | Add sortable columns |
| Low | No pagination for large lists | - | Add pagination or infinite scroll |

**Accessibility Issues:**
- Users icon button (roster) - no aria-label
- UserPlus icon button (assign student) - no aria-label
- UserIcon button (assign teacher) - no aria-label
- Pencil icon button (edit) - no aria-label
- Trash2 icon button (delete) - no aria-label

---

### D.2 Class Details (`ClassDetailsClient.tsx`)

**File:** `src/app/admin/classes/[id]/ClassDetailsClient.tsx` (1366 lines)

**Strengths:**
- Uses shadcn/ui Tabs component correctly
- Good tab structure (Roster, Activities, Trips, Points)
- CSV export functionality for trip students
- Uses Dialog component for delete confirmation (not browser confirm)
- ClassPointsOverview component for points tab

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| High | Header action buttons wrap poorly on mobile | ~464-510 | Reorganize to responsive layout or dropdown menu |
| High | RTL issues: `mr-2` used throughout | ~445, 589, etc. | Change all `mr-*` to `me-*` for RTL support |
| High | Native `<input>` used instead of shadcn/ui Input | ~1249-1255 | Replace with `<Input>` component |
| High | No breadcrumb navigation | - | Add breadcrumb: Admin > Classes > [Class Name] |
| Medium | No loading skeleton | - | Create `loading.tsx` file for route |
| Medium | Long file (1366 lines) | - | Consider refactoring into smaller components |
| Low | Trip tab loading indicator not prominent | ~861-867 | Use Skeleton or Loader component |

**RTL Issues Found:**
- Line 445: `mr-2` → should be `me-2`
- Line 589: `mr-2` → should be `me-2`
- Line 593: `mr-2` → should be `me-2`
- Line 604: `mr-2` → should be `me-2`
- Line 608: `mr-2` → should be `me-2`

---

### D.3 Birthdays Page (`BirthdaysClient.tsx`)

**File:** `src/app/admin/classes/[id]/birthdays/BirthdaysClient.tsx` (295 lines)

**Strengths:**
- Clean month-by-month grid layout
- Good stats cards with icons
- RTL-aware month names (Arabic/English)
- Responsive grid (4 cols XL, 3 cols LG, 2 cols MD, 1 col mobile)
- Proper ordinal suffixes for dates (1st, 2nd, 3rd, etc.)

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| Medium | RTL issue: `mr-2` instead of `me-2` | ~164 | Change to `me-2` |
| Low | No breadcrumb navigation | - | Add: Admin > Classes > [Class] > Birthdays |
| Low | No loading skeleton | - | Create `loading.tsx` file |

---

### D.4 Trip Class Students (`TripClassStudentsClient.tsx`)

**File:** `src/app/admin/classes/trips/[id]/TripClassStudentsClient.tsx` (405 lines)

**Strengths:**
- Good filter system (class, subscription status, search)
- Currency symbol based on locale
- Good stats cards layout
- Proper i18n usage throughout

**Issues:**

| Priority | Issue | Line(s) | Recommendation |
|----------|-------|---------|----------------|
| Medium | RTL issue: `mr-2` instead of `me-2` | ~145 | Change to `me-2` |
| Low | No breadcrumb navigation | - | Add breadcrumb navigation |
| Low | Stats grid could improve on mobile | ~170 | Use `grid-cols-2 md:grid-cols-4` |

---

### D.5 Summary of Classes Module Issues

**Common Issues Across All Files:**

1. **No loading.tsx files** - None of the class routes have loading skeletons:
   - `src/app/admin/classes/loading.tsx` - Missing
   - `src/app/admin/classes/[id]/loading.tsx` - Missing
   - `src/app/admin/classes/[id]/birthdays/loading.tsx` - Missing
   - `src/app/admin/classes/trips/[id]/loading.tsx` - Missing

2. **RTL Support** - Multiple instances of `mr-*` that should be `me-*`

3. **Browser confirm()** - Used in ClassesClient for delete operations

4. **No breadcrumb navigation** - Missing on all detail pages

5. **Icon buttons lack aria-labels** - Multiple accessibility issues

---

### D.6 Recommended Fixes for Classes Module

**Priority 1 (Critical):**
```
□ Replace browser confirm() with ConfirmDialog in ClassesClient
□ Add aria-labels to all icon-only buttons
□ Fix RTL issues (mr-* → me-*)
□ Replace native <input> with shadcn/ui Input in ClassDetailsClient
```

**Priority 2 (High):**
```
□ Create loading.tsx skeletons for all routes
□ Add breadcrumb navigation to detail pages
□ Use EmptyState component for empty states
□ Reorganize ClassDetailsClient header for mobile
```

**Priority 3 (Medium):**
```
□ Add table sorting to ClassesClient
□ Refactor ClassDetailsClient (1366 lines is too long)
□ Add pagination for large class lists
```

**Translation Keys Needed:**
```json
{
  "classes": {
    "viewRoster": "View Roster",
    "assignStudent": "Assign Student",
    "assignTeacher": "Assign Teacher",
    "classDetails": "Class Details"
  }
}
```

---

*Report generated by Sally, UX Expert*
