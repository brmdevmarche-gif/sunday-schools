# RTL Fix Inventory — Knasty Portal

**Date**: 2026-03-21
**Locales**: English (LTR) + Arabic (RTL)
**Framework**: Tailwind CSS v4 (supports logical properties natively)

---

## Summary

| Physical Property | Logical Replacement | Instances | Files |
|-------------------|-------------------|-----------|-------|
| `pl-*` / `pr-*`  | `ps-*` / `pe-*`  | 35        | 20+   |
| `ml-*` / `mr-*`  | `ms-*` / `me-*`  | 79+       | 20+   |
| `text-left` / `text-right` | `text-start` / `text-end` | 43 | 20+ |
| `left-*` / `right-*` | `start-*` / `end-*` | 31 | 20+ |
| `border-l-*` / `border-r-*` | `border-s-*` / `border-e-*` | 8 | 4 |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` | 0 | 0 |
| **TOTAL** | | **~196** | **~50+** |

---

## Conversion Rules

| Physical | Logical (Tailwind v4) | CSS Property |
|----------|----------------------|-------------|
| `pl-*` | `ps-*` | `padding-inline-start` |
| `pr-*` | `pe-*` | `padding-inline-end` |
| `ml-*` | `ms-*` | `margin-inline-start` |
| `mr-*` | `me-*` | `margin-inline-end` |
| `text-left` | `text-start` | `text-align: start` |
| `text-right` | `text-end` | `text-align: end` |
| `left-*` | `start-*` | `inset-inline-start` |
| `right-*` | `end-*` | `inset-inline-end` |
| `border-l-*` | `border-s-*` | `border-inline-start` |
| `border-r-*` | `border-e-*` | `border-inline-end` |
| `rounded-l-*` | `rounded-s-*` | `border-start-start-radius` + `border-end-start-radius` |
| `rounded-r-*` | `rounded-e-*` | `border-start-end-radius` + `border-end-end-radius` |

**Important**: `left-0 right-0` on a fixed/absolute element (like a bottom nav) is NOT directional — it means "stretch full width". Do NOT convert `left-0 right-0` to `start-0 end-0` as both produce the same result but `inset-x-0` is cleaner.

---

## Exceptions (DO NOT Convert)

Some physical properties are intentionally directional:

1. **`rtl:rotate-180`** on icons (e.g., back arrow) — This is an explicit RTL override. Keep as-is.
2. **`left-0 right-0`** on fixed-position elements spanning full width — Not directional, but `inset-x-0` is preferred.
3. **Animation transforms** (`translateX`) — CSS transforms are not affected by `dir`. Keep physical `left`/`right` in animations.
4. **`left-1/2 -translate-x-1/2`** centering pattern — Not directional. Keep.

---

## File-by-File Inventory

### Tier 1: shadcn/ui Components (Fix ONCE, affects entire app)

| File | Physical Classes | Fix |
|------|-----------------|-----|
| `components/ui/table.tsx` | `text-left`, `pr-0` | → `text-start`, `pe-0` |
| `components/ui/select.tsx` | `pr-2`, `left-2`, `right-3.5` | → `pe-2`, `start-2`, `end-3.5` |
| `components/ui/dropdown-menu.tsx` | `pl-2`, `pr-2`, `left-*`, `right-*` (5 instances) | Convert padding; check positioning |
| `components/ui/dialog.tsx` | `text-left`, `right-4` | → `text-start`; close button `end-4` |
| `components/ui/sheet.tsx` | `left-*`, `right-*` (3 instances) | Side-dependent — leave slide directions, convert offsets |
| `components/ui/accordion.tsx` | `text-left` | → `text-start` |
| `components/ui/alert-dialog.tsx` | `text-left` | → `text-start` |
| `components/ui/popover.tsx` | `right-*` | Check if positional — may need `end-*` |
| `components/ui/tooltip.tsx` | `left-*` | Check if positional |
| `components/ui/radio-group.tsx` | `left-*` | Indicator positioning — may need `start-*` |

### Tier 2: Layout Components (High Impact)

| File | Physical Classes | Count | Fix |
|------|-----------------|-------|-----|
| `components/teacher/TeacherBottomNav.tsx` | `left-0`, `right-0` | 3 | → `inset-x-0` (full width, not directional) |
| `components/admin/AdminLayout.tsx` | `left-*` | 1 | Check if sidebar offset — convert to `start-*` |
| `components/parents/ParentDashboardNavbar.tsx` | `left-*`, `right-*` | 2 | → `inset-x-0` or `start-*`/`end-*` |
| `components/NavigationLoader.tsx` | `left-0` | 1 | Progress bar — full width, use `inset-x-0` |
| `app/dashboard/DashboardNavbar.tsx` | `text-left` | 1 | → `text-start` |

### Tier 3: Admin Pages (Desktop-Primary, Lower Priority)

| File | Physical Classes | Count |
|------|-----------------|-------|
| `admin/trips/[id]/TripDetailsClient.tsx` | `ml-*`, `mr-*`, `text-left`, `text-right` | 22 |
| `admin/activities/spiritual-notes/SpiritualNotesAdminClient.tsx` | `ml-*`, `mr-*`, `text-left` | 12 |
| `admin/store/orders/OrdersManagementClient.tsx` | `ml-*`, `mr-*` | 9 |
| `admin/activities/competitions/CompetitionsAdminClient.tsx` | `ml-*`, `text-left`, `text-right` | 8 |
| `admin/classes/ClassesClient.tsx` | `pl-*`, `pr-*` | 2 |
| `admin/churches/ChurchesClient.tsx` | `text-left`, `text-right` | 4 |
| `admin/churches/loading.tsx` | `text-left` | 4 |
| `admin/churches/[id]/ChurchDetailsClient.tsx` | `ml-*`, `text-left` | 3 |
| `admin/activities/ActivitiesManagementClient.tsx` | `ml-*` | 5 |
| `admin/activities/readings/ReadingsAdminClient.tsx` | `ml-*`, `text-left` | 3 |
| `admin/students/[id]/StudentDetailsClient.tsx` | `ml-*` | 4 |
| `admin/roles/RolesClient.tsx` | `text-left` | 2 |
| `admin/store/StoreClient.tsx` | `ml-*`, `pl-*` | 3 |
| `admin/store/[id]/StoreItemDetailsClient.tsx` | `pr-*` | 1 |
| `admin/store/create/CreateStoreItemClient.tsx` | `ml-*` | 2 |
| `admin/store/[id]/edit/EditStoreItemClient.tsx` | `ml-*` | 2 |
| `admin/trips/TripsManagementClient.tsx` | `ml-*` | 2 |
| `admin/trips/create/CreateTripClient.tsx` | `ml-*` | 2 |
| `admin/trips/[id]/EditTripClient.tsx` | `ml-*` | 2 |
| `admin/attendance/history/AttendanceHistoryClient.tsx` | `pl-*` | 1 |
| `admin/store/orders/create/CreateOrderForStudentClient.tsx` | `pl-*` | 2 |
| `admin/students/StudentsClient.tsx` | `right-*` | 1 |

### Tier 4: Student/Teacher Pages (Mobile-Primary, User-Facing)

| File | Physical Classes | Count |
|------|-----------------|-------|
| `components/teacher/AttendanceStudentRow.tsx` | `border-l-*` | 5 |
| `components/teacher/AnnouncementDetail.tsx` | `border-l-*` | 1 |
| `components/teacher/AnnouncementCard.tsx` | `border-l-*` | 1 |
| `components/teacher/ApprovalCard.tsx` | `text-right` | 1 |
| `components/gamification/Leaderboard.tsx` | `text-left`, `text-right`, `border-l-*` | 5 |
| `components/gamification/BadgeCollection.tsx` | `text-left` | 1 |
| `components/gamification/BadgeCard.tsx` | `left-*` | 1 |
| `components/ClassPointsOverview.tsx` | `text-left`, `text-right` | 6 |
| `activities/ActivitiesClient.tsx` | `pl-*` | 1 |
| `activities/readings/[id]/ReadingScheduleDetailClient.tsx` | `ml-*`, `pl-*` | 6 |
| `trips/TripsClient.tsx` | `pr-*`, `text-right` | 3 |
| `trips/[id]/TripDetailsClient.tsx` | `pr-*`, `ml-*` | 6 |
| `store/StoreClient.tsx` | `pl-*`, `right-*` | 2 |
| `store/orders/MyOrdersClient.tsx` | `ml-*` | 1 |
| `dashboard/teacher/attendance/TakeAttendanceClient.tsx` | `ml-*` | 2 |
| `dashboard/teacher/classes/[classId]/roster/ClassRosterClient.tsx` | `pl-*` | 1 |

### Tier 5: Other Components

| File | Physical Classes | Count |
|------|-----------------|-------|
| `components/access-gates.tsx` | `pl-*`, `text-left`, `left-*` | 3 |
| `components/access-gates/StudentSelectionGate.tsx` | `pl-*`, `left-*` | 2 |
| `components/ChurchPointsConfig.tsx` | `pl-*` | 3 |
| `components/admin/AssignDioceseAdminDialog.tsx` | `pl-*`, `right-*` | 3 |
| `components/admin/DioceseAdminList.tsx` | `text-left` | 2 |
| `components/admin/roles/PermissionSelector.tsx` | `pl-*`, `right-*` | 4 |
| `components/ImageUpload.tsx` | `left-*` | 1 |
| `components/trips/TripImageUpload.tsx` | `left-*` | 1 |

---

## RTL + Screen Reader Intersection Issues

### Issue 1: Hardcoded English aria-labels
- `TeacherBottomNav.tsx:114` — `aria-label="Teacher navigation"` — should be `t("nav.teacherNavigation")`
- Any other hardcoded English strings in `aria-label` attributes need i18n

### Issue 2: Sonner toast position
- Default position is `bottom-right`
- In RTL, should be `bottom-left`
- Fix in `sonner.tsx`: `position={dir === "rtl" ? "bottom-left" : "bottom-right"}`

### Issue 3: Icon rotation for directional icons
- Back arrows use `rtl:rotate-180` — CORRECT, keep this pattern
- Search for any arrow/chevron icons that don't have this class when they should

### Issue 4: Bidirectional text in mixed-language content
- When Arabic content contains English words (names, emails), `dir="auto"` on the container helps the browser determine direction
- Consider wrapping user-generated content with `<span dir="auto">`

---

## Migration Strategy

### Phase 1: shadcn/ui components (Tier 1)
Fix once, benefits entire app. ~15 changes across ~10 files.
**Effort**: S

### Phase 2: Layout components (Tier 2)
High-impact fixes for navigation and layout structure.
**Effort**: XS

### Phase 3: User-facing pages (Tier 4)
Student and teacher pages — mobile-primary, user-facing. Highest visual impact for Arabic users.
**Effort**: M

### Phase 4: Admin pages (Tier 3)
Desktop-primary, lower priority but more instances.
**Effort**: M

### Phase 5: Other components (Tier 5)
Remaining miscellaneous components.
**Effort**: S

---

## Automated Validation

After migration, verify RTL correctness:
1. `grep -rn "\bpl-\|\bpr-\|\bml-\|\bmr-\|\btext-left\b\|\btext-right\b\|\bleft-\d\|\bright-\d\|\bborder-l-\|\bborder-r-" src/ --include="*.tsx" | wc -l` — should approach zero (with documented exceptions)
2. Visual test: Switch to Arabic locale and verify all pages layout correctly
3. Screen reader test in Arabic: VoiceOver reads content in correct right-to-left order
