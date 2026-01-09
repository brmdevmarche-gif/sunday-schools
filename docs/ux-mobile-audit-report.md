# UX/UI Mobile-First Audit Report

**Date:** January 2026
**Auditor:** UX Expert (Sally)
**Focus:** Mobile-first design optimization for users accessing the portal primarily on mobile phones

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
**Recommendation:**
- Create a `ResponsiveTable` component that transforms to card-based layout on mobile
- Alternative: Add "sticky" first column for horizontal scrolling tables
- Consider collapsible row details pattern

#### 1.2 Button Touch Targets Too Small
**Location:** `src/components/ui/button.tsx`
**Issue:** Icon buttons (`size="icon"`) are 36px (h-9), below the 44px minimum recommended for touch targets.
**Impact:** Users may mis-tap buttons on mobile.
**Recommendation:**
- Increase icon button sizes to 44px minimum on mobile
- Add `min-h-11 min-w-11` for touch targets via CSS or variant

#### 1.3 AdminSidebar Hardcoded Text
**Location:** `src/components/admin/AdminSidebar.tsx:254,265`
**Issue:** "Settings" and "Logout" are hardcoded in English, not using translation keys.
**Impact:** Arabic users see mixed language interface.
**Recommendation:** Replace with `t('nav.settings')` and `t('nav.logout')`

### P2 - Significant

#### 1.4 Dialog Content Scrolling
**Location:** `src/components/ui/dialog.tsx`
**Issue:** Long form dialogs may overflow on mobile without proper scroll handling.
**Recommendation:**
- Add `max-h-[90vh] overflow-y-auto` to dialog content body
- Consider full-screen sheet on mobile for complex forms

#### 1.5 Missing Mobile-Specific Loading States
**Issue:** Loading skeletons designed for desktop layouts look cramped on mobile.
**Recommendation:** Create mobile-optimized skeleton layouts with stacked cards instead of grids

### P3 - Minor

#### 1.6 Tooltip Not Mobile-Friendly
**Location:** `src/components/ui/tooltip.tsx`
**Issue:** Tooltips rely on hover which doesn't work on touch devices.
**Recommendation:** Disable tooltips on mobile or convert to tap-to-reveal

---

## 2. Navigation & Layout Issues

### P1 - Critical

#### 2.1 Page Headers Overflow on Mobile
**Location:** Multiple admin client pages
**Issue:** Headers with multiple action buttons overflow horizontally on small screens.
**Example:** UsersClient.tsx has "Link Parent" + "Create User" buttons that may not fit.
**Recommendation:**
- Stack buttons vertically on mobile: `flex flex-col sm:flex-row gap-2`
- Use icon-only buttons on mobile with dropdown for actions
- Consider floating action button (FAB) pattern for primary action

#### 2.2 Filter Cards Take Too Much Space
**Location:** All admin list pages (Classes, Users, Announcements, etc.)
**Issue:** Filter cards with 4-column grids collapse poorly on mobile, taking significant viewport space.
**Recommendation:**
- Collapse filters behind a "Filter" button on mobile
- Use bottom sheet for filter options
- Consider search + filter icon pattern

### P2 - Significant

#### 2.3 Tabs Not Scrollable on Mobile
**Location:** UserDetailsClient.tsx, various pages
**Issue:** Tab lists may overflow and cut off on narrow screens.
**Recommendation:**
- Add horizontal scroll to TabsList: `overflow-x-auto flex-nowrap`
- Or use dropdown for tab selection on mobile

#### 2.4 Breadcrumbs Can Be Truncated
**Location:** Various detail pages
**Issue:** Long breadcrumb trails may overflow on mobile.
**Recommendation:**
- Show only last 2 items with "..." collapse on mobile
- Or use back button instead of breadcrumbs on mobile

---

## 3. Data Display Issues

### P1 - Critical

#### 3.1 Tables Need Mobile Alternative
**Locations:**
- `ClassesClient.tsx` - Classes table
- `UsersClient.tsx` - Users by role accordion tables
- `AnnouncementsClient.tsx` - Announcements table
- All attendance, trips, churches, dioceses tables

**Issue:** All data tables use the same horizontal scroll pattern which is suboptimal for mobile.
**Recommendation:**
Create a responsive data display pattern:
```tsx
// Desktop: Table view
// Mobile: Card stack view
<MediaQuery mobile={<CardList data={items} />} desktop={<DataTable data={items} />} />
```

#### 3.2 Accordion Tables in UsersClient
**Location:** `UsersClient.tsx`
**Issue:** Nested tables inside accordions are hard to navigate on mobile.
**Recommendation:**
- Use card-based list inside accordion on mobile
- Show fewer columns (name, status, actions only)

### P2 - Significant

#### 3.3 Empty States Could Be More Actionable
**Issue:** Some empty states don't provide clear next steps.
**Recommendation:** Ensure all empty states have a primary CTA button

#### 3.4 Long Content Truncation
**Issue:** Email addresses, user names in tables may overflow.
**Recommendation:** Add proper truncation with tooltips/expand on tap

---

## 4. Form & Input Issues

### P1 - Critical

#### 4.1 Multi-Column Forms on Mobile
**Locations:**
- Create User dialog (`grid-cols-2`)
- Various filter sections (`lg:grid-cols-4`)

**Issue:** Two-column form layouts force tiny inputs on mobile.
**Recommendation:**
- Change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`
- Ensure all forms stack to single column on mobile

#### 4.2 Select Dropdowns Hard to Use
**Issue:** Native select on iOS can be hard to navigate with many options.
**Recommendation:**
- For long lists (churches, dioceses), use searchable combobox
- Consider virtualized lists for performance

### P2 - Significant

#### 4.3 Date/Time Pickers
**Issue:** Native datetime-local inputs work but aren't optimized for mobile UX.
**Recommendation:** Consider mobile-friendly date picker library or custom component

#### 4.4 Password Visibility Toggle Position
**Location:** `UserDetailsClient.tsx:925-949`
**Issue:** Password visibility toggle button inside input may be hard to tap.
**Recommendation:** Increase touch target, ensure adequate spacing

---

## 5. Specific Module Issues

### Classes Module

| Issue | Priority | Location | Recommendation |
|-------|----------|----------|----------------|
| Roster dialog table scrolling | P2 | ClassesClient.tsx | Use card list on mobile |
| Stats cards grid | P3 | ClassDetailsClient.tsx | Already responsive |

### Users Module

| Issue | Priority | Location | Recommendation |
|-------|----------|----------|----------------|
| Tabs with icons overflow | P2 | UserDetailsClient.tsx | Make TabsList scrollable |
| Login history table | P2 | UserDetailsClient.tsx | Card view for mobile |
| 5-column stats grid | P2 | UserDetailsClient.tsx | 2 columns on mobile |

### Announcements Module

| Issue | Priority | Location | Recommendation |
|-------|----------|----------|----------------|
| Complex form with many checkboxes | P1 | AnnouncementsClient.tsx | Use collapsible sections |
| Status tabs + table | P2 | AnnouncementsClient.tsx | Tab bar scrollable |
| Target role checkboxes | P3 | AnnouncementsClient.tsx | Use checkbox group component |

### Attendance Module

| Issue | Priority | Location | Recommendation |
|-------|----------|----------|----------------|
| Calendar picker | P2 | Various | Mobile-optimized date selection |
| Student cards | P3 | AttendanceClient | Already card-based - good! |

---

## 6. Accessibility Issues (Mobile-Specific)

### P1 - Critical

#### 6.1 Touch Target Sizes
**Issue:** Many interactive elements are below 44x44px minimum.
**Elements:** Icon buttons, checkboxes, small badges with actions
**Recommendation:** Audit all interactive elements for minimum touch target size

#### 6.2 Focus States
**Issue:** Focus states may not be visible on mobile with touch navigation.
**Recommendation:** Ensure active states are clearly visible

### P2 - Significant

#### 6.3 Color Contrast in Status Badges
**Issue:** Some badge colors (yellow, light gray) may have insufficient contrast.
**Recommendation:** Verify WCAG 2.1 AA compliance for all badge variants

---

## 7. Performance Considerations

### P2 - Significant

#### 7.1 Large Lists
**Issue:** Lists with many items (users, students) load all at once.
**Recommendation:**
- Implement pagination or infinite scroll
- Consider virtualization for lists > 50 items

#### 7.2 Image Optimization
**Issue:** Avatar images may not be optimized for mobile bandwidth.
**Recommendation:** Use Next.js Image component with appropriate sizes

---

## 8. Quick Wins (Implement First)

These changes provide the most impact with minimal effort:

1. **Fix header button stacking** - Add `flex-col sm:flex-row` to header action containers
2. **Translate hardcoded strings** - AdminSidebar "Settings" and "Logout"
3. **Increase touch targets** - Add min-h/min-w-11 to icon buttons
4. **Make tabs scrollable** - Add overflow-x-auto to TabsList
5. **Single-column forms on mobile** - Update grid-cols-2 to grid-cols-1 sm:grid-cols-2

---

## 9. Recommended Component Additions

### 9.1 ResponsiveDataDisplay Component
A wrapper that renders tables on desktop and card lists on mobile.

### 9.2 MobileSheet Component
Full-screen bottom sheet for forms/dialogs on mobile.

### 9.3 FilterSheet Component
Collapsible filter drawer for mobile list pages.

### 9.4 FloatingActionButton Component
For primary actions on mobile list pages.

---

## 10. Implementation Roadmap

### Phase 1 (Quick Wins) - Estimated: 1 session
- Header button stacking
- Touch target sizes
- Hardcoded string translations
- Scrollable tabs

### Phase 2 (Form Improvements) - Estimated: 2 sessions
- Single-column forms on mobile
- Filter collapsing
- Improved select/combobox

### Phase 3 (Data Display) - Estimated: 3-4 sessions
- ResponsiveDataDisplay component
- Card views for all list pages
- Mobile-optimized detail pages

### Phase 4 (Polish) - Estimated: 2 sessions
- Performance optimizations
- Accessibility improvements
- Animation refinements

---

## Appendix: Files Audited

### UI Components
- button.tsx
- dialog.tsx
- table.tsx
- input.tsx
- card.tsx
- tabs.tsx
- breadcrumb.tsx
- empty-state.tsx
- confirm-dialog.tsx

### Layout Components
- AdminLayout.tsx
- AdminSidebar.tsx

### Client Pages
- ClassesClient.tsx
- UsersClient.tsx
- UserDetailsClient.tsx
- AnnouncementsClient.tsx

### Global Styles
- globals.css (theme variables, animations)

---

*Report generated by UX Expert audit process*
