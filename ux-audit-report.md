# UX Audit Report — Knasty Portal

> **Disclaimer**: This is a single-evaluator static analysis. Per Nielsen's research, a single evaluator finds ~34% of usability problems. Manual user testing with real teachers, parents, and students is required to validate these findings.

**Date**: 2026-03-21
**App**: Knasty Portal — Coptic Orthodox Sunday School Management System
**Locales**: English + Arabic (RTL)

---

## Summary Scorecard

| Module/Role      | CRIT | HIGH | MED | LOW | Mobile /10 | RTL /10 | a11y /10 |
|------------------|------|------|-----|-----|-----------|---------|----------|
| Student (store)  | 1    | 2    | 3   | 1   | 5/10      | 4/10    | 3/10     |
| Student (trips)  | 0    | 2    | 3   | 1   | 5/10      | 4/10    | 3/10     |
| Student (activities) | 0 | 2   | 3   | 1   | 5/10      | 4/10    | 3/10     |
| Parent           | 0    | 3    | 2   | 1   | 6/10      | 4/10    | 3/10     |
| Teacher          | 2    | 3    | 3   | 1   | 6/10      | 5/10    | 4/10     |
| Admin (desktop)  | 0    | 3    | 4   | 2   | 4/10      | 4/10    | 3/10     |
| Login            | 0    | 1    | 2   | 1   | 7/10      | 6/10    | 5/10     |
| **Cross-cutting** | **2** | **4** | **5** | **2** | — | — | — |

**Overall a11y score: 3.3/10** — Significant gaps in keyboard access, screen reader support, and semantic structure.

---

## Cross-Cutting UX Issues

### CX-01: No Error Recovery Context (CRITICAL)
Every form in the app shows errors via Sonner toasts only. When a toast disappears (4s default), the user has no way to see what went wrong. Combined with the lack of inline field-level errors, users must guess which field failed validation.

**Impact**: All roles. Most severe for admins creating students/classes (complex forms with many fields).

### CX-02: No Loading State Feedback for Screen Readers (HIGH)
25+ skeleton loading screens are visual-only. No `aria-busy`, no screen reader announcement when content loads. Keyboard/SR users experience silence during loading.

### CX-03: Inconsistent Navigation Patterns (MEDIUM)
- Student pages have no consistent navigation shell — each page loads independently with back buttons
- Parent pages have a sidebar + navbar pattern
- Teacher pages have a bottom nav (mobile-optimized)
- Admin pages have sidebar + top bar

The student experience feels like isolated pages rather than an app. No breadcrumbs, no persistent nav.

### CX-04: No Search/Filter Discovery (MEDIUM)
Admin list pages (students, classes, users, orders) have search inputs but:
- No keyboard shortcut to focus search (e.g., Cmd+K)
- No search across modules (global search)
- Filter states are not persisted in URL (refreshing loses filters)

### CX-05: No Empty State Guidance (LOW)
Some list pages show blank areas when no data exists rather than helpful empty states with CTAs.

---

## Per-Role UX Issues

### Student Role (Mobile-Primary)

#### S-01: No persistent navigation (HIGH)
Students navigate between /dashboard, /store, /trips, /activities, /gamification via cards on the dashboard. There's no bottom nav or persistent navigation like the teacher role has. Students must go back to the dashboard to switch sections.

#### S-02: Store purchase flow lacks confirmation context (MEDIUM)
The store purchase uses ConfirmDialog but doesn't show the student's current points balance next to the price, making it easy to accidentally spend points.

#### S-03: Activities page uses 100vh layout (MEDIUM)
Content cut off on mobile Safari due to `min-h-screen` (100vh).

### Teacher Role (Mobile-Primary)

#### T-01: Class selector is keyboard-inaccessible (CRITICAL)
`ClassSelectorClient.tsx:39` uses `div role="button"` — keyboard users CANNOT select a class, blocking the entire attendance flow.

#### T-02: Attendance entry is optimized for mobile but not keyboard (HIGH)
The attendance status buttons (present/absent/late/excused) are touch-friendly (44px targets) but lack keyboard shortcuts. A teacher with 30 students must tab through ~120 buttons to complete attendance.

#### T-03: Bottom nav badge counts lack context (MEDIUM)
The pending action count badge shows "3" but doesn't indicate "3 pending approvals" to screen readers.

#### T-04: Search command dialog exists but is undiscoverable (LOW)
`SearchCommand.tsx` exists but its trigger mechanism is unclear in the teacher flow.

### Parent Role (Mobile-Primary)

#### PR-01: Child selector changes view without warning (HIGH)
The parent dashboard navbar has a child selector dropdown. Changing the selected child immediately reloads all dashboard content without warning — violates WCAG 3.2.2 (On Input) expectation of predictability.

#### PR-02: Approval flow lacks batch actions (MEDIUM)
Parents approving multiple trip/store permissions must do them one at a time. No "approve all" option.

#### PR-03: Notification widget is visual-only (MEDIUM)
NotificationsWidget updates are not announced to screen readers.

### Admin Role (Desktop-Primary)

#### A-01: Sidebar permission-based filtering may confuse roles (HIGH)
The admin sidebar shows different items based on permissions. A `church_admin` sees fewer items than a `super_admin`, but the order may shift when permissions change. This violates consistent navigation (WCAG 3.2.3).

#### A-02: Data tables have no keyboard navigation shortcuts (HIGH)
Admin list pages (students, classes, churches, users) have tables with action buttons per row. No way to quickly jump to a specific row or use keyboard shortcuts for common actions (edit, delete, view).

#### A-03: Form validation is inconsistent (MEDIUM)
Some admin forms use react-hook-form (with proper FormMessage), others use manual useState validation (toast-only errors). The user experience of error handling differs by form.

#### A-04: Bulk operations are limited (MEDIUM)
No bulk select/edit/delete on any admin list page. Admins managing large churches must edit students one at a time.

#### A-05: Admin layout uses fixed h-screen (MEDIUM)
`AdminLayout.tsx:332` uses `flex h-screen overflow-hidden` which doesn't account for mobile Safari address bar.

---

## UX Heuristic Analysis (Nielsen's 10)

| # | Heuristic | Score | Key Issues |
|---|-----------|-------|------------|
| 1 | Visibility of system status | 4/10 | Toast-only feedback, no loading announcements, no progress indicators for multi-step flows |
| 2 | Match between system and real world | 7/10 | Good i18n support, church terminology is correct |
| 3 | User control and freedom | 5/10 | ConfirmDialog for destructive actions, but no undo, no draft saving |
| 4 | Consistency and standards | 5/10 | Inconsistent error handling patterns, inconsistent navigation across roles |
| 5 | Error prevention | 6/10 | ConfirmDialog for deletes, role hierarchy enforcement, but no draft auto-save |
| 6 | Recognition rather than recall | 5/10 | No breadcrumbs on deep pages, filter state not in URL |
| 7 | Flexibility and efficiency | 4/10 | No keyboard shortcuts, no bulk operations, no global search |
| 8 | Aesthetic and minimalist design | 7/10 | Clean UI with shadcn/ui, but information density could improve |
| 9 | Error recovery | 3/10 | Toast errors disappear, no inline field errors on many forms, no error details |
| 10 | Help and documentation | 3/10 | No onboarding, no contextual help, no tooltips on complex features |

**Average: 4.9/10**

---

## Mobile UX Specific Issues

| # | Issue | Roles Affected | Severity |
|---|-------|---------------|----------|
| M1 | 100vh layout breaks on iOS Safari | All | MEDIUM |
| M2 | Safe area inset classes are no-ops | Teacher | MEDIUM |
| M3 | Button touch targets < 44px | All | HIGH |
| M4 | No pull-to-refresh support | Student, Teacher | LOW |
| M5 | Student pages lack persistent mobile nav | Student | HIGH |
| M6 | Admin layout not optimized for mobile | Admin | MEDIUM |

---

## Recommended Priority Order

1. **CRITICAL** — Fix keyboard blockers: div role="button" (T-01), skip links (CX-02 in a11y)
2. **HIGH** — Page titles, icon aria-labels, touch targets, autocomplete on login
3. **HIGH** — Color contrast fixes, form error handling consistency
4. **MEDIUM** — RTL fixes, reduced motion, safe area, 100dvh
5. **LOW** — Empty states, keyboard shortcuts, bulk operations
