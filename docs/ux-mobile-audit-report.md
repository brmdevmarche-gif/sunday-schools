# UX/UI Mobile-First Audit Report

**Date:** January 2026
**Auditor:** UX Expert (Sally)
**Focus:** Mobile-first design optimization for users accessing the portal primarily on mobile phones
**Last Updated:** January 9, 2026

---

## Implementation Status

### Completed Fixes

| Item | Priority | Status |
|------|----------|--------|
| Button touch targets (44px) | P1 | DONE |
| AdminSidebar hardcoded text | P1 | DONE |
| Page headers stack on mobile | P1 | DONE |
| Multi-column forms responsive | P1 | DONE |
| ResponsiveTable component created | P1 | DONE |
| Tabs scrollable on mobile | P2 | DONE |
| Dialog content scrolling | P2 | DONE |
| Stats grids responsive (5-col) | P2 | DONE |

### Remaining Items

| Item | Priority | Status |
|------|----------|--------|
| FilterSheet component | P2 | DONE |
| Filter collapsing implementation | P2 | PARTIAL (6 pages done) |
| Checkbox touch targets | P1 | DONE |
| Table to card migration | P2 | DONE (5 pages migrated) |
| Tooltip mobile handling | P3 | DONE |
| Breadcrumb truncation | P3 | DONE |
| UserDetailsClient attendance/login tables | P2 | DONE |

---

## Executive Summary

This audit identifies UX/UI issues across the Knasty Portal with emphasis on mobile usability. Since users primarily access the portal on mobile phones, the recommendations prioritize touch-friendly interactions, readable content, and efficient mobile navigation.

---

## Priority Levels

- **P1 (Critical)**: Issues causing usability blockers or significantly degraded mobile experience
- **P2 (Significant)**: Issues that substantially impact user experience
- **P3 (Minor)**: Polish items and nice-to-have improvements

---

## 1. Global/Shared Components Issues

### P1 - Critical

#### 1.1 Table Component - Mobile Unfriendly
**Location:** `src/components/ui/table.tsx`
**Issue:** Tables require horizontal scrolling on mobile, making data hard to read and interact with.
**Impact:** Users must scroll horizontally to see all data, losing context of which row they're viewing.
**Status:** DONE - ResponsiveTable component created and migrated to main admin pages
**Fix Applied:**
- ResponsiveTable component at `src/components/ui/responsive-table.tsx`
- Migrated pages: DiocesesClient, ClassesClient, AnnouncementsClient, UsersClient (accordion tables)
- Component transforms to card-based layout on mobile automatically
- Added mobile sort dropdown support for sortable tables

#### 1.2 Button Touch Targets Too Small
**Location:** `src/components/ui/button.tsx`
**Issue:** Icon buttons (`size="icon"`) are 36px (h-9), below the 44px minimum recommended for touch targets.
**Impact:** Users may mis-tap buttons on mobile.
**Status:** DONE
**Fix Applied:**
- `icon`: 44px on mobile (`size-11`), 36px on desktop (`sm:size-9`)
- `icon-sm`: 40px on mobile (`size-10`), 32px on desktop (`sm:size-8`)
- `icon-lg`: 44px on mobile (`size-11`), 40px on desktop (`sm:size-10`)

#### 1.3 AdminSidebar Hardcoded Text
**Location:** `src/components/admin/AdminSidebar.tsx`
**Issue:** "Settings" and "Logout" are hardcoded in English, not using translation keys.
**Impact:** Arabic users see mixed language interface.
**Status:** DONE
**Fix Applied:** Replaced with `t('nav.settings')` and `t('nav.logout')`

### P2 - Significant

#### 1.4 Dialog Content Scrolling
**Location:** `src/components/ui/dialog.tsx`
**Issue:** Long form dialogs may overflow on mobile without proper scroll handling.
**Status:** DONE
**Fix Applied:** Added `max-h-[90vh] overflow-y-auto` to DialogContent

#### 1.5 Missing Mobile-Specific Loading States
**Issue:** Loading skeletons designed for desktop layouts look cramped on mobile.
**Status:** DONE
**Fix Applied:**
- Updated loading.tsx files for dioceses, classes, churches, users
- Desktop: Shows table skeleton
- Mobile: Shows card-based skeleton matching the ResponsiveTable card view
- Mobile filter button skeleton shown instead of filter card

### P3 - Minor

#### 1.6 Tooltip Not Mobile-Friendly
**Location:** `src/components/ui/tooltip.tsx`
**Issue:** Tooltips rely on hover which doesn't work on touch devices.
**Status:** DONE
**Fix Applied:** Added CSS media query `@media(hover:hover) and (pointer:fine)` to only show tooltips on devices with hover capability (desktop/laptop with mouse). Tooltips are hidden on touch devices.

---

## 2. Navigation & Layout Issues

### P1 - Critical

#### 2.1 Page Headers Overflow on Mobile
**Location:** Multiple admin client pages
**Issue:** Headers with multiple action buttons overflow horizontally on small screens.
**Status:** DONE
**Fix Applied:** Updated 8 admin client pages with `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`
**Files Fixed:**
- UsersClient.tsx
- ClassesClient.tsx
- DiocesesClient.tsx
- ChurchesClient.tsx
- StudentsClient.tsx
- TripsManagementClient.tsx
- StoreClient.tsx

#### 2.2 Filter Cards Take Too Much Space
**Location:** All admin list pages (Classes, Users, Announcements, etc.)
**Issue:** Filter cards with 4-column grids collapse poorly on mobile, taking significant viewport space.
**Status:** PARTIAL - 6 pages migrated to ResponsiveFilters
**Fix Applied:**
- Created FilterSheet and ResponsiveFilters components
- Filters collapse behind a "Filters" button on mobile with slide-out sheet
- Shows active filter count badge
- Implemented on: ClassesClient, UsersClient, ChurchesClient, StudentsClient, TripsManagementClient, OrdersManagementClient
**Note:** DiocesesClient doesn't have filters (simple list)

### P2 - Significant

#### 2.3 Tabs Not Scrollable on Mobile
**Location:** UserDetailsClient.tsx, various pages
**Issue:** Tab lists may overflow and cut off on narrow screens.
**Status:** DONE
**Fix Applied:** Added `max-w-full overflow-x-auto justify-start sm:justify-center` to TabsList

#### 2.4 Breadcrumbs Can Be Truncated
**Location:** Various detail pages
**Issue:** Long breadcrumb trails may overflow on mobile.
**Status:** DONE
**Fix Applied:**
- Created ResponsiveBreadcrumb component at `src/components/ui/responsive-breadcrumb.tsx`
- On mobile: Shows first item (home) > ... > last item (current page)
- On desktop: Shows all breadcrumb items
- Migrated UserDetailsClient.tsx as example

---

## 3. Data Display Issues

### P1 - Critical

#### 3.1 Tables Need Mobile Alternative
**Locations:**
- `ClassesClient.tsx` - Classes table
- `UsersClient.tsx` - Users by role accordion tables
- `AnnouncementsClient.tsx` - Announcements table
- `DiocesesClient.tsx` - Dioceses table

**Issue:** All data tables use the same horizontal scroll pattern which is suboptimal for mobile.
**Status:** DONE - Main admin tables migrated to ResponsiveTable
**Fix Applied:**
- DiocesesClient.tsx - Migrated with mobile sort dropdown
- ClassesClient.tsx - Migrated with mobile sort dropdown
- AnnouncementsClient.tsx - Migrated with card view
- UsersClient.tsx - Accordion tables migrated with card view

#### 3.2 Accordion Tables in UsersClient
**Location:** `UsersClient.tsx`
**Issue:** Nested tables inside accordions are hard to navigate on mobile.
**Status:** DONE
**Fix Applied:**
- Migrated to ResponsiveTable component
- Card-based list inside accordion on mobile
- Shows name (title), email (subtitle), church, status, and actions

### P2 - Significant

#### 3.3 Empty States Could Be More Actionable
**Issue:** Some empty states don't provide clear next steps.
**Status:** DONE (from previous audit phase)
**Fix Applied:** EmptyState component with CTA buttons added across modules

#### 3.4 Long Content Truncation
**Issue:** Email addresses, user names in tables may overflow.
**Status:** TODO
**Recommendation:** Add proper truncation with tooltips/expand on tap

---

## 4. Form & Input Issues

### P1 - Critical

#### 4.1 Multi-Column Forms on Mobile
**Locations:**
- Create User dialog (`grid-cols-2`)
- Various filter sections (`lg:grid-cols-4`)

**Issue:** Two-column form layouts force tiny inputs on mobile.
**Status:** DONE
**Fix Applied:** Updated 12 files with `grid-cols-1 sm:grid-cols-2`
**Files Fixed:**
- UsersClient.tsx
- ClassesClient.tsx
- ChurchesClient.tsx
- StudentsClient.tsx
- CreateTripClient.tsx, EditTripClient.tsx, TripDetailsClient.tsx
- ReadingsAdminClient.tsx, CompetitionsAdminClient.tsx, SpiritualNotesAdminClient.tsx
- CreateActivityClient.tsx, EditActivityClient.tsx

#### 4.2 Select Dropdowns Hard to Use
**Issue:** Native select on iOS can be hard to navigate with many options.
**Status:** TODO
**Recommendation:**
- For long lists (churches, dioceses), use searchable combobox
- Consider virtualized lists for performance

### P2 - Significant

#### 4.3 Date/Time Pickers
**Issue:** Native datetime-local inputs work but aren't optimized for mobile UX.
**Status:** TODO
**Recommendation:** Consider mobile-friendly date picker library or custom component

#### 4.4 Password Visibility Toggle Position
**Location:** `UserDetailsClient.tsx`
**Issue:** Password visibility toggle button inside input may be hard to tap.
**Status:** TODO
**Recommendation:** Increase touch target, ensure adequate spacing

---

## 5. Specific Module Issues

### Classes Module

| Issue | Priority | Status | Location |
|-------|----------|--------|----------|
| Roster dialog table scrolling | P2 | DONE | ClassesClient.tsx |
| Stats cards grid | P3 | DONE | ClassDetailsClient.tsx |

### Users Module

| Issue | Priority | Status | Location |
|-------|----------|--------|----------|
| Tabs with icons overflow | P2 | DONE | tabs.tsx (global fix) |
| Login history table | P2 | DONE | UserDetailsClient.tsx |
| Attendance history table | P2 | DONE | UserDetailsClient.tsx |
| 5-column stats grid | P2 | DONE | UserDetailsClient.tsx |

### Announcements Module

| Issue | Priority | Status | Location |
|-------|----------|--------|----------|
| Complex form with many checkboxes | P1 | DONE | AnnouncementsClient.tsx |
| Status tabs + table | P2 | DONE | tabs.tsx (global fix) |
| Target role checkboxes | P3 | DONE | AnnouncementsClient.tsx |

### Attendance Module

| Issue | Priority | Status | Location |
|-------|----------|--------|----------|
| Calendar picker | P2 | TODO | Various |
| Student cards | P3 | N/A | Already card-based |

---

## 6. Accessibility Issues (Mobile-Specific)

### P1 - Critical

#### 6.1 Touch Target Sizes
**Issue:** Many interactive elements are below 44x44px minimum.
**Elements:** Icon buttons, checkboxes, small badges with actions
**Status:** DONE - Icon buttons and checkboxes fixed
**Fix Applied:**
- Button component icon sizes increased to 44px on mobile
- Checkbox component now has invisible 44px touch target via pseudo-element

#### 6.2 Focus States
**Issue:** Focus states may not be visible on mobile with touch navigation.
**Status:** TODO
**Recommendation:** Ensure active states are clearly visible

### P2 - Significant

#### 6.3 Color Contrast in Status Badges
**Issue:** Some badge colors (yellow, light gray) may have insufficient contrast.
**Status:** TODO
**Recommendation:** Verify WCAG 2.1 AA compliance for all badge variants

---

## 7. Performance Considerations

### P2 - Significant

#### 7.1 Large Lists
**Issue:** Lists with many items (users, students) load all at once.
**Status:** TODO
**Recommendation:**
- Implement pagination or infinite scroll
- Consider virtualization for lists > 50 items

#### 7.2 Image Optimization
**Issue:** Avatar images may not be optimized for mobile bandwidth.
**Status:** TODO
**Recommendation:** Use Next.js Image component with appropriate sizes

---

## 8. Quick Wins - COMPLETED

All quick wins have been implemented:

1. **Fix header button stacking** - DONE
2. **Translate hardcoded strings** - DONE
3. **Increase touch targets** - DONE
4. **Make tabs scrollable** - DONE
5. **Single-column forms on mobile** - DONE

---

## 9. New Components Added

### 9.1 ResponsiveTable Component
**Location:** `src/components/ui/responsive-table.tsx`
**Status:** DONE
**Features:**
- Renders tables on desktop, cards on mobile
- Supports title/subtitle columns for card view
- Includes loading skeleton
- Supports row click actions
- Supports custom action buttons

**Usage Example:**
```tsx
<ResponsiveTable
  data={items}
  columns={[
    { key: 'name', header: 'Name', cell: (item) => item.name, isTitle: true },
    { key: 'email', header: 'Email', cell: (item) => item.email, isSubtitle: true },
    { key: 'status', header: 'Status', cell: (item) => <Badge>{item.status}</Badge> },
  ]}
  getRowKey={(item) => item.id}
  onRowClick={(item) => router.push(`/details/${item.id}`)}
  renderActions={(item) => <Button size="icon-sm"><Pencil /></Button>}
/>
```

### 9.2 MobileSheet Component
**Status:** TODO
Full-screen bottom sheet for forms/dialogs on mobile.

### 9.3 FilterSheet Component
**Location:** `src/components/ui/filter-sheet.tsx`
**Status:** DONE
**Features:**
- Slide-out sheet for filters on mobile
- ResponsiveFilters wrapper (inline on desktop, sheet on mobile)
- Active filter count badge
- Apply and Clear buttons
- Controlled and uncontrolled modes

**Usage Example:**
```tsx
<ResponsiveFilters
  title={t('filters.title')}
  activeFilterCount={activeFilters}
  onApply={handleApply}
  onClear={handleClear}
  applyText={t('filters.apply')}
  clearText={t('filters.clear')}
>
  {/* Filter inputs */}
</ResponsiveFilters>
```

### 9.4 ResponsiveBreadcrumb Component
**Location:** `src/components/ui/responsive-breadcrumb.tsx`
**Status:** DONE
**Features:**
- Shows all breadcrumb items on desktop
- On mobile: Shows first item > ... > last item
- Automatic home icon for first item pointing to "/admin"
- RTL support for separators
- Truncation for long page titles

**Usage Example:**
```tsx
<ResponsiveBreadcrumb
  items={[
    { label: "Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "John Doe" }, // Current page (no href)
  ]}
/>
```

### 9.5 FloatingActionButton Component
**Location:** `src/components/ui/floating-action-button.tsx`
**Status:** DONE
**Features:**
- Fixed position at bottom-right of screen on mobile
- 56px touch target (Material Design standard)
- Active scale animation for touch feedback
- Supports icon-only and extended (icon + label) modes
- Hidden on desktop by default (where header buttons are used)
- Safe area support for notched devices
- Variant support: default, secondary, destructive

**Usage Example:**
```tsx
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Plus } from "lucide-react";

<FloatingActionButton
  icon={<Plus />}
  onClick={() => setOpen(true)}
  aria-label="Add new item"
/>

// Extended FAB with label
<FloatingActionButton
  icon={<Plus />}
  label="Add Class"
  onClick={() => setOpen(true)}
/>
```

---

## 10. Implementation Progress

### Phase 1 (Quick Wins) - COMPLETED
- [x] Header button stacking
- [x] Touch target sizes
- [x] Hardcoded string translations
- [x] Scrollable tabs
- [x] Dialog scrolling
- [x] Stats grid responsiveness

### Phase 2 (Form Improvements) - COMPLETED
- [x] Single-column forms on mobile
- [x] Filter collapsing (PARTIAL - 6 pages done)
- [ ] Improved select/combobox (TODO)

### Phase 3 (Data Display) - MOSTLY COMPLETE
- [x] ResponsiveTable component created
- [x] Card views for main list pages (DiocesesClient, ClassesClient, AnnouncementsClient, UsersClient)
- [x] Mobile sort dropdown support added to ResponsiveTable
- [ ] Mobile-optimized detail pages (PARTIAL)

### Phase 4 (Polish) - PARTIAL
- [x] Mobile-optimized loading skeletons
- [x] FloatingActionButton component created
- [ ] Performance optimizations (pagination/virtualization)
- [ ] Accessibility improvements (focus states, color contrast)
- [ ] Animation refinements

---

## Appendix: Files Modified

### UI Components
- button.tsx - Touch targets increased
- checkbox.tsx - Touch targets increased (44px invisible hit area)
- dialog.tsx - Scroll handling added
- tabs.tsx - Horizontal scroll added
- tooltip.tsx - Hidden on touch devices (hover:hover media query)
- responsive-table.tsx - NEW COMPONENT
- filter-sheet.tsx - NEW COMPONENT
- responsive-breadcrumb.tsx - NEW COMPONENT
- floating-action-button.tsx - NEW COMPONENT

### Layout Components
- AdminSidebar.tsx - Translations added

### Client Pages (Headers Fixed)
- UsersClient.tsx
- ClassesClient.tsx
- DiocesesClient.tsx
- ChurchesClient.tsx
- StudentsClient.tsx
- TripsManagementClient.tsx
- StoreClient.tsx

### Client Pages (Forms Fixed)
- UsersClient.tsx
- ClassesClient.tsx
- ChurchesClient.tsx
- StudentsClient.tsx
- CreateTripClient.tsx
- EditTripClient.tsx
- TripDetailsClient.tsx
- ReadingsAdminClient.tsx
- CompetitionsAdminClient.tsx
- SpiritualNotesAdminClient.tsx
- CreateActivityClient.tsx
- EditActivityClient.tsx
- AnnouncementsClient.tsx - Checkbox grids responsive (single-column on mobile)

### Client Pages (Grids Fixed)
- UserDetailsClient.tsx
- StudentDetailsClient.tsx
- users/[id]/loading.tsx

### Client Pages (ResponsiveFilters Implemented)
- ClassesClient.tsx - Filters collapse on mobile
- UsersClient.tsx - Filters collapse on mobile
- ChurchesClient.tsx - Filters collapse on mobile
- StudentsClient.tsx - Filters collapse on mobile
- TripsManagementClient.tsx - Filters collapse on mobile
- OrdersManagementClient.tsx - Filters collapse on mobile

### Client Pages (ResponsiveTable Migrated)
- DiocesesClient.tsx - Table → ResponsiveTable with mobile sort
- ClassesClient.tsx - Table → ResponsiveTable with mobile sort, roster dialogs converted to div-based lists
- AnnouncementsClient.tsx - Table → ResponsiveTable with card view
- UsersClient.tsx - Accordion tables → ResponsiveTable with card view

### Detail Pages (Tables Converted to Cards)
- UserDetailsClient.tsx - Attendance/login history tables → card-based lists

### Detail Pages (ResponsiveBreadcrumb Migrated)
- UserDetailsClient.tsx - First page migrated to ResponsiveBreadcrumb

### Loading Skeletons (Mobile-Friendly)
- dioceses/loading.tsx - Card skeleton on mobile, table on desktop
- classes/loading.tsx - Card skeleton on mobile, filter button skeleton
- churches/loading.tsx - Card skeleton on mobile, filter button skeleton
- users/loading.tsx - Card skeleton for accordion items on mobile

---

*Report updated with implementation status - January 9, 2026*
