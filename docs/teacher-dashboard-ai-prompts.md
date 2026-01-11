# Teacher Dashboard - AI UI Generation Prompts

> **Purpose:** Copy-paste ready prompts for v0, Lovable, or similar AI UI tools
> **Date:** January 10, 2026
> **Based on:** teacher-dashboard-front-end-spec.md

---

## Foundational Context (Include with ALL prompts)

```
## Project Context

You are building components for Knasty Portal, a church Sunday School management system.

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom theme tokens
- **Components**: Radix UI primitives + shadcn/ui patterns
- **Icons**: Lucide React
- **i18n**: next-intl (Arabic RTL + English LTR support)
- **State**: React hooks + server actions

### Design Tokens
- Primary: #2a3f54 (dark blue-gray)
- Secondary: #58b7bd (teal)
- Accent: #e3ab4a (golden amber)
- Success: emerald-500
- Warning: amber-500
- Destructive: red-500
- Border radius: 10px default (rounded-lg)
- Spacing: Tailwind default scale

### Component Conventions
- Use `cn()` utility for class merging (clsx + tailwind-merge)
- Add `data-slot="component-name"` for testing hooks
- All components must support dark mode via `dark:` prefixes
- Mobile-first responsive design (default → sm: → lg:)
- Touch targets minimum 44x44px
- All interactive elements need focus-visible states
```

---

## Prompt 1: Teacher Dashboard (Command Center)

### High-Level Goal

Create a mobile-first teacher dashboard page that serves as a command center, showing key stats, a primary action button for attendance, and a list of pending items requiring teacher action.

### Detailed Prompt

```
## Goal
Create a Teacher Dashboard page component for a Sunday School management app. This is the main landing page for teachers after login.

## Layout Structure (Mobile-First)

### Header (Fixed, 56px height)
- Left: Search icon button (opens search overlay)
- Center: App logo or "Dashboard" text
- Right: Language toggle (AR/EN) + Avatar dropdown

### Main Content (Scrollable)

1. **Welcome Banner**
   - "Welcome, [Teacher Name]!" with wave emoji
   - Subtitle: Church name
   - Light gradient background (primary to secondary, 10% opacity)

2. **Stats Grid (2x2 on mobile, 4x1 on desktop)**
   Create a StatCard component with:
   - Icon (Lucide) in a rounded colored background
   - Large number value
   - Small label text below
   - Hover: subtle lift + shadow
   - Click: navigates to related page

   Four cards:
   - Classes (BookOpen icon, primary color) - value: 3
   - Pending (Zap icon, amber/warning color) - value: 5
   - Students (Users icon, secondary color) - value: 47
   - Attendance (BarChart3 icon, success color) - value: "89%"

3. **Primary Action Button (Full width)**
   - Large button: "Take Attendance" with ClipboardList icon
   - Primary color, prominent shadow
   - Arrow icon on right indicating navigation

4. **Action Required Section**
   - Section header: "Action Required (5)" with Zap icon
   - List of ActionRequiredCard components:

   Each card shows:
   - Left icon based on type (Bus for trips, Trophy for competitions)
   - Title (e.g., "Summer Camp")
   - Subtitle (e.g., "3 pending approvals")
   - Right: "View" link/button
   - Card has subtle border, hover shadow

### Bottom Navigation (Fixed, 64px height)
5 items with icons + labels:
- Dashboard (Home) - active state
- My Classes (BookOpen)
- Action Required (Zap) - show badge with count "5"
- Announcements (Megaphone) - show badge with count "2"
- My Trips (Bus) - conditionally shown

## Component Structure

```tsx
// File: src/app/dashboard/teacher/page.tsx
// Components needed:
// - StatCard (src/components/teacher/StatCard.tsx)
// - ActionRequiredCard (src/components/teacher/ActionRequiredCard.tsx)
// - TeacherBottomNav (src/components/teacher/TeacherBottomNav.tsx)
```

## Data Types

```typescript
interface StatCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  href: string
  variant?: 'default' | 'highlight' | 'warning'
}

interface ActionRequiredItem {
  id: string
  type: 'trip' | 'competition' | 'activity'
  title: string
  count: number
  subtitle?: string
}

interface TeacherDashboardData {
  teacher: { name: string; church: string }
  stats: { classes: number; pending: number; students: number; attendanceRate: string }
  actionRequired: ActionRequiredItem[]
}
```

## Styling Requirements

- Cards: `bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow`
- Stats grid: `grid grid-cols-2 sm:grid-cols-4 gap-4`
- Welcome banner: gradient from primary/10 to transparent
- Bottom nav: `fixed bottom-0 left-0 right-0 bg-background border-t`
- Active nav item: primary color icon + text
- Badge on nav: `absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full min-w-5 h-5`

## Constraints

- DO NOT create a sidebar - this is mobile-first with bottom nav
- DO NOT use any state management library - use React useState/useEffect only
- DO use Lucide icons only (import from 'lucide-react')
- DO make all text translatable (use {t('key')} pattern for next-intl)
- DO support dark mode with dark: variants
- Touch targets must be at least 44x44px
```

---

## Prompt 2: My Classes Hub

### High-Level Goal

Create a page showing all classes assigned to the teacher, with cards that have inline quick actions for roster, attendance, and stats.

### Detailed Prompt

```
## Goal
Create a "My Classes" page showing all classes assigned to a teacher with quick action buttons on each card.

## Layout Structure (Mobile-First)

### Header
- Back button (ChevronLeft) returning to dashboard
- Title: "My Classes"
- Right: Search icon button

### Content

1. **Class Cards List**
   Full-width stacked on mobile, 2-column on tablet (sm:), 3-column on desktop (lg:)

   Each ClassCard contains:

   **Header Row:**
   - BookOpen icon in primary color circle
   - Class name (e.g., "Grade 5 - St. Mark")
   - Student count badge (e.g., "15 students")

   **Quick Actions Row (3 buttons):**
   - "Roster" button (Users icon) - outline variant
   - "Attend" button (ClipboardCheck icon) - outline variant
   - "Stats" button (BarChart3 icon) - outline variant
   All buttons same width, evenly distributed

   **Footer Row:**
   - If attendance taken today: "Last attendance: Today" + green Check icon
   - If NOT taken: "Attendance not taken" + amber AlertTriangle icon + pulsing dot

   **Card States:**
   - Default: subtle border, white background
   - Attention needed (no attendance): left border amber-500 (3px)
   - Hover: lift with shadow-md

2. **Empty State (if no classes)**
   - BookOpen icon (48px, muted color)
   - Title: "No Classes Assigned"
   - Description: "Contact your church administrator to be assigned to classes."

### Bottom Navigation
Same as dashboard (My Classes tab now active)

## Component Structure

```tsx
// File: src/app/dashboard/teacher/classes/page.tsx
// Components:
// - ClassCard (src/components/teacher/ClassCard.tsx)
// - EmptyState (reuse from src/components/ui/empty-state.tsx)
```

## Data Types

```typescript
interface ClassCardProps {
  id: string
  name: string
  churchName: string
  studentCount: number
  lastAttendanceDate?: Date
  attendanceTakenToday: boolean
  onRosterClick: () => void
  onAttendanceClick: () => void
  onStatsClick: () => void
}
```

## Styling

```css
/* Card grid */
.classes-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Card with attention state */
.class-card-attention {
  @apply border-l-4 border-l-amber-500;
}

/* Quick action buttons */
.quick-action-btn {
  @apply flex-1 h-10 text-sm;
}

/* Pulsing indicator for missed attendance */
.pulse-dot {
  @apply w-2 h-2 bg-amber-500 rounded-full animate-pulse;
}
```

## Constraints

- Quick action buttons must be large enough for touch (44px height minimum)
- Cards should NOT be fully clickable - only specific buttons trigger actions
- Attendance warning should be visually prominent but not alarming
- Support for 0-10+ classes without layout issues
```

---

## Prompt 3: Action Required Queue

### High-Level Goal

Create a unified queue page showing all pending items requiring teacher approval, with inline approve/reject actions.

### Detailed Prompt

```
## Goal
Create an "Action Required" page with a unified queue of pending approvals, organized by type with inline action buttons.

## Layout Structure (Mobile-First)

### Header
- Back button to dashboard
- Title: "Action Required"
- Right: Filter icon button (opens filter sheet)

### Filter Chips Row (Horizontal scroll)
- "All" chip (default selected)
- "Trips" chip with count
- "Competitions" chip with count
- "Activities" chip with count

Selected chip: filled primary color
Unselected: outline style

### Content: Grouped Lists

**Section: TRIPS (3)**
Section header with Bus icon, "TRIPS" label, count badge

ApprovalCard for each pending trip request:
```
┌─────────────────────────────────────┐
│ [Avatar] Ahmed Hassan    [i button] │
│ Summer Camp - Jul 15                │
│ Requested: 2 days ago               │
│                                     │
│ [✓ Approve]         [✗ Reject]      │
└─────────────────────────────────────┘
```

Card elements:
- Student avatar (32px) with fallback to initials
- Student name (clickable - opens student drawer)
- Info button (i) - also opens student drawer
- Item title + date
- Relative timestamp
- Two action buttons: Approve (success) and Reject (outline destructive)

**Special case: Parent-initiated request**
Show badge: "Parent requested" with Users icon before timestamp

**Section: COMPETITIONS (2)**
Section header with Trophy icon

CompetitionReviewCard:
```
┌─────────────────────────────────────┐
│ [Avatar] Mina Sobhy      [i button] │
│ Bible Quiz - Submission             │
│ Submitted: 1 hour ago               │
│                                     │
│      [Review Submission →]          │
└─────────────────────────────────────┘
```

Single button that navigates to review page

### Empty State (when all done)
- CheckCircle icon (48px, success color)
- Title: "All caught up!"
- Description: "No pending actions at this time."
- Confetti animation (subtle, optional)

### Bottom Navigation
Action Required tab active (with badge showing count)

## Component Structure

```tsx
// File: src/app/dashboard/teacher/action-required/page.tsx
// Components:
// - ApprovalCard (src/components/teacher/ApprovalCard.tsx)
// - FilterChips (inline or separate component)
```

## Data Types

```typescript
interface ApprovalCardProps {
  id: string
  type: 'trip' | 'competition' | 'activity'
  student: {
    id: string
    name: string
    avatarUrl?: string
    initials: string
  }
  itemTitle: string
  itemDate?: string
  requestedAt: Date
  parentInitiated?: boolean
  onApprove: () => Promise<void>
  onReject: () => void // Opens rejection modal
  onStudentClick: () => void // Opens student drawer
}
```

## Interactions

1. **Approve Button Click:**
   - Show loading spinner in button
   - On success: card animates out (slide right + fade)
   - Show success toast: "[Student] approved for [Item]"
   - Decrement badge count

2. **Reject Button Click:**
   - Open modal with optional reason selection
   - Reasons: "Trip is full", "Not eligible", "Other"
   - On confirm: card animates out (slide left + fade)
   - Show toast: "[Student] request rejected"

3. **Student Name/Info Click:**
   - Open StudentDrawer component (from right on desktop, bottom on mobile)

## Styling

```css
/* Filter chips */
.filter-chip {
  @apply px-4 py-2 rounded-full text-sm font-medium transition-colors;
}
.filter-chip-active {
  @apply bg-primary text-primary-foreground;
}
.filter-chip-inactive {
  @apply bg-transparent border hover:bg-muted;
}

/* Approval card */
.approval-card {
  @apply bg-card rounded-lg border p-4 space-y-3;
}

/* Action buttons row */
.approval-actions {
  @apply flex gap-3 pt-2;
}
.approve-btn {
  @apply flex-1 bg-emerald-500 hover:bg-emerald-600 text-white;
}
.reject-btn {
  @apply flex-1 border-destructive text-destructive hover:bg-destructive/10;
}

/* Parent badge */
.parent-badge {
  @apply inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded;
}

/* Card exit animation */
.card-exit-right {
  animation: slideOutRight 300ms ease-out forwards;
}
@keyframes slideOutRight {
  to { opacity: 0; transform: translateX(100px); }
}
```

## Constraints

- Approve/Reject must show loading state during async operation
- Card removal should be animated, not instant
- Empty state should feel celebratory (teacher completed their work!)
- Parent badge must be clearly visible but not overwhelming
- Student drawer is a separate component - just trigger open here
```

---

## Prompt 4: Student Drawer

### High-Level Goal

Create a slide-in drawer/sheet that shows student details, accessible from anywhere a student name appears.

### Detailed Prompt

```
## Goal
Create a StudentDrawer component that shows student profile, points, activities, and attendance in a tabbed interface within a slide-in drawer.

## Layout Structure

### Drawer Container
- Mobile: Bottom sheet (slides up from bottom, max 85vh)
- Desktop: Side drawer (slides from right, 400px width)
- Has drag handle on mobile for swipe-to-dismiss
- Backdrop overlay (black 50% opacity, click to close)

### Drawer Content

**Header Section:**
```
┌─────────────────────────────────────┐
│ ═══════════  (drag handle mobile)   │
├─────────────────────────────────────┤
│                              [X]    │
│  ┌────────┐                         │
│  │ Avatar │  Ahmed Hassan           │
│  │  64px  │  Grade 5 - St. Mark     │
│  └────────┘  ahmed.parent@email.com │
├─────────────────────────────────────┤
│ ┌──────────┐┌──────────┐┌──────────┐│
│ │ ⭐ 450   ││ 📊 92%   ││ 🏆 5     ││
│ │ Points   ││ Attend.  ││ Active.  ││
│ └──────────┘└──────────┘└──────────┘│
├─────────────────────────────────────┤
│ [Profile] [Points] [Activities]     │
├─────────────────────────────────────┤
│                                     │
│        Tab Content Area             │
│        (scrollable)                 │
│                                     │
├─────────────────────────────────────┤
│       [Adjust Points] (if allowed)  │
└─────────────────────────────────────┘
```

**Quick Stats Row:**
Three stat mini-cards in a row:
- Points: Star icon, point balance
- Attendance: BarChart icon, percentage
- Activities: Trophy icon, count

**Tabs:**
4 tabs using Radix Tabs component:
- Profile (default)
- Points
- Activities
- Attendance

**Tab Content - Profile:**
- Parent/Guardian name + phone (clickable to call)
- Emergency contact info
- Student notes (if any)
- Class enrollment date

**Tab Content - Points:**
- Current balance (large number)
- Points history list (recent transactions)
  - Each row: description, amount (+/-), date
  - Positive amounts in green, negative in red
- "Adjust Points" button at bottom (if teacher has permission)

**Tab Content - Activities:**
- Two sections: "Participating" and "Available"
- Activity cards with name, type badge, status

**Tab Content - Attendance:**
- Calendar month view (compact)
- Color-coded days:
  - Green dot: Present
  - Red dot: Absent
  - Yellow dot: Excused
  - Orange dot: Late
  - Gray: No class
- Month navigation arrows
- Legend below calendar

### Footer Action Button
- "Adjust Points" - only shown if `showAdjustPoints` prop is true
- Opens PointsAdjustmentDialog (separate component)

## Component Structure

```tsx
// File: src/components/teacher/StudentDrawer.tsx

interface StudentDrawerProps {
  student: StudentDetails | null
  open: boolean
  onClose: () => void
  initialTab?: 'profile' | 'points' | 'activities' | 'attendance'
  showAdjustPoints?: boolean
}

interface StudentDetails {
  id: string
  name: string
  avatarUrl?: string
  initials: string
  className: string
  email?: string

  // Quick stats
  pointsBalance: number
  attendanceRate: number
  activitiesCount: number

  // Profile tab
  parentName: string
  parentPhone: string
  emergencyContact?: string
  notes?: string
  enrolledAt: Date

  // Points tab
  pointsHistory: PointTransaction[]

  // Activities tab
  participatingActivities: Activity[]
  availableActivities: Activity[]

  // Attendance tab
  attendanceRecords: AttendanceRecord[]
}
```

## Implementation Details

Use Radix Sheet component as base:
```tsx
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Sheet open={open} onOpenChange={onClose}>
  <SheetContent
    side={isMobile ? "bottom" : "right"}
    className="sm:max-w-[400px] max-h-[85vh] sm:max-h-full"
  >
    {/* Content */}
  </SheetContent>
</Sheet>
```

## Styling

```css
/* Drawer on mobile */
.student-drawer-mobile {
  @apply rounded-t-2xl max-h-[85vh];
}

/* Drag handle */
.drag-handle {
  @apply w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto my-2;
}

/* Quick stats row */
.quick-stats {
  @apply grid grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg;
}
.quick-stat {
  @apply text-center;
}
.quick-stat-value {
  @apply text-lg font-bold;
}
.quick-stat-label {
  @apply text-xs text-muted-foreground;
}

/* Tabs styling */
.drawer-tabs-list {
  @apply w-full grid grid-cols-4;
}
.drawer-tab {
  @apply text-xs sm:text-sm py-2;
}

/* Attendance calendar */
.attendance-calendar {
  @apply grid grid-cols-7 gap-1 text-center text-xs;
}
.attendance-day {
  @apply w-8 h-8 rounded-full flex items-center justify-center;
}
.attendance-present { @apply bg-emerald-100 text-emerald-700; }
.attendance-absent { @apply bg-red-100 text-red-700; }
.attendance-excused { @apply bg-amber-100 text-amber-700; }
.attendance-late { @apply bg-orange-100 text-orange-700; }
```

## Accessibility

- Focus trap within drawer when open
- Escape key closes drawer
- Tabs navigable with arrow keys
- Screen reader announces drawer open/close
- All interactive elements have focus-visible states

## Constraints

- Drawer must NOT navigate away from current page
- Content should lazy-load (only fetch tab data when tab selected)
- Phone numbers should be tel: links on mobile
- Calendar should show current month by default
- Points adjustment opens a separate dialog, not inline
```

---

## Prompt 5: Take Attendance Page

### High-Level Goal

Create an attendance marking page with student list, status toggle buttons, bulk actions, and save functionality.

### Detailed Prompt

```
## Goal
Create a "Take Attendance" page where teachers can quickly mark attendance status for all students in a class.

## Layout Structure (Mobile-First)

### Header (Sticky)
- Back button (to dashboard or classes)
- Title: "Attendance"
- Right: Save button (checkmark icon) - disabled until changes made

### Class & Date Info Bar (Sticky below header)
- Class name: "Grade 5 - St. Mark"
- Date picker showing today's date (editable, but max = today)
- Date format: "Sunday, Jan 10, 2026"

### Bulk Actions Bar
- Full-width button: "Mark All Present"
- Dropdown for other bulk actions:
  - Mark All Absent
  - Mark All Excused
  - Mark All Late
  - Clear All

### Progress Indicator
- Text: "12 of 15 marked"
- Progress bar underneath (colored segments by status)

### Student List
Each student row:
```
┌─────────────────────────────────────────────┐
│ [Avatar] Ahmed Hassan              [Note]   │
│                                             │
│ [ ✓ ]  [ ✗ ]  [ ⚠ ]  [ 🕐 ]                 │
│ Present Absent Excused Late                 │
└─────────────────────────────────────────────┘
```

- Avatar (32px) with initials fallback
- Student name (tappable to open student drawer)
- Note icon button (if note exists, filled; else outline)
- 4 status buttons in a row:
  - Present (Check icon, green when selected)
  - Absent (X icon, red when selected)
  - Excused (AlertTriangle icon, yellow when selected)
  - Late (Clock icon, orange when selected)
- Only one status can be selected at a time
- Unselected state: outline/ghost style
- Selected state: filled with status color

### Stats Footer (Sticky at bottom, above nav)
- 4 mini stat badges in a row:
  - ✓ 12 (green)
  - ✗ 2 (red)
  - ⚠ 1 (yellow)
  - 🕐 0 (orange)

### Bottom Navigation
Dashboard tab (not classes or action required)

## Interactions

1. **Status Button Tap:**
   - Toggle selection (tap again to deselect)
   - Only one status per student
   - Update progress counter immediately
   - Enable Save button

2. **Note Button Tap:**
   - Open small modal/popover with textarea
   - Save note inline
   - Icon becomes filled when note exists

3. **Mark All Present:**
   - Confirm dialog: "Mark all 15 students as present?"
   - On confirm: all students get Present status
   - Animate status buttons

4. **Save Button:**
   - Show loading spinner
   - On success: Toast "Attendance saved for Grade 5"
   - Navigate back to dashboard or stay (based on more classes)

5. **Back without saving:**
   - If changes exist: Confirm dialog "Discard unsaved changes?"

## Component Structure

```tsx
// File: src/app/dashboard/teacher/attendance/page.tsx
// Components:
// - AttendanceStudentRow (inline or separate)
// - AttendanceStatusButtons (may exist already)
// - BulkActionsBar (may exist already)
// - AttendanceStatsFooter

interface AttendancePageProps {
  classId: string
  date?: string // defaults to today
}

interface StudentAttendance {
  studentId: string
  name: string
  avatarUrl?: string
  initials: string
  status: 'present' | 'absent' | 'excused' | 'late' | null
  note?: string
}
```

## Styling

```css
/* Status button group */
.status-buttons {
  @apply flex gap-2;
}

.status-btn {
  @apply flex-1 flex flex-col items-center justify-center
         h-14 rounded-lg border-2 transition-all;
}

.status-btn-label {
  @apply text-[10px] mt-1;
}

/* Status button states */
.status-btn-present-selected {
  @apply bg-emerald-500 border-emerald-500 text-white;
}
.status-btn-absent-selected {
  @apply bg-red-500 border-red-500 text-white;
}
.status-btn-excused-selected {
  @apply bg-amber-500 border-amber-500 text-white;
}
.status-btn-late-selected {
  @apply bg-orange-500 border-orange-500 text-white;
}

.status-btn-unselected {
  @apply bg-transparent border-muted-foreground/30 text-muted-foreground
         hover:border-muted-foreground;
}

/* Student row */
.student-row {
  @apply p-4 border-b last:border-b-0;
}

/* Progress bar with segments */
.progress-bar {
  @apply h-2 rounded-full overflow-hidden flex;
}
.progress-present { @apply bg-emerald-500; }
.progress-absent { @apply bg-red-500; }
.progress-excused { @apply bg-amber-500; }
.progress-late { @apply bg-orange-500; }
.progress-unmarked { @apply bg-muted; }

/* Stats footer */
.stats-footer {
  @apply fixed bottom-16 left-0 right-0 bg-background border-t p-2
         flex justify-center gap-4;
}
.stat-badge {
  @apply flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium;
}
```

## Accessibility

- Status buttons are a radio group (one selection per student)
- Keyboard: Arrow keys to navigate students, 1-4 to set status
- Screen reader: Announce "[Student name]: [Status]" on change
- Focus moves to next student after status selection (optional UX)

## Constraints

- DO NOT allow future dates in date picker
- DO NOT allow saving with 0 students marked (show warning)
- Status buttons must be large touch targets (minimum 44px height)
- List should virtualize if class has 50+ students
- Optimistic UI updates, sync in background
- Handle offline: queue save, sync when online
```

---

## Usage Instructions

### For v0 (Vercel)

1. Copy the **Foundational Context** section first
2. Paste the specific screen prompt
3. v0 works best with one component at a time - start with StatCard, then build up

### For Lovable.ai

1. Combine context + prompt into single input
2. Lovable handles full pages well - can paste entire page prompts
3. Follow up with refinement prompts for styling tweaks

### For Cursor/Copilot

1. Create the file structure first
2. Paste prompt as a comment block at top of file
3. Let AI generate implementation below

---

## Important Reminders

1. **All AI-generated code requires human review** - Check for:
   - Accessibility compliance
   - Type safety
   - Edge case handling
   - Security (no XSS, proper sanitization)

2. **Iterate, don't expect perfection** - Generate one component, refine, then move to next

3. **Test on real devices** - AI often misses mobile-specific issues

4. **Verify design tokens** - AI may use wrong colors or spacing

---

*Generated by Sally (UX Expert) - BMAD Framework*
*Based on: teacher-dashboard-front-end-spec.md*
