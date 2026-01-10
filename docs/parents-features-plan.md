# Parents Features - Implementation Plan

**Version:** 1.0
**Date:** January 2026

---

## Executive Summary

This document outlines the plan for implementing parent-facing features in the Knasty Portal. The goal is to give parents visibility into their children's activities, enable trip approvals, and provide communication channels.

---

## Current State Analysis

### What Already Exists

| Feature | Status | Location |
|---------|--------|----------|
| Parent role in RBAC | Done | `users.role = 'parent'` |
| Parent-student linking table | Done | `user_relationships` table |
| Trip approval data model | Done | `trip_participants.parent_approval` |
| Announcements parent targeting | Done | Announcements RLS policies |
| Link parent/student admin UI | Done | Admin users page |

### What's Missing

| Feature | Priority | Effort |
|---------|----------|--------|
| Parent Dashboard | P0 | Medium |
| Trip Approval Interface | P0 | Medium |
| Child Overview (points, activities) | P1 | Low |
| Notification System | P1 | High |
| Attendance Viewing | P2 | Low |
| Payment Management | P2 | Medium |

---

## Feature Specifications

### Phase 1: Parent Dashboard (P0)

#### 1.1 Parent Home Page
**Route:** `/dashboard` (when user.role === 'parent')

**Features:**
- List of linked children with quick stats
- Pending approvals count badge
- Recent announcements widget
- Quick links to child profiles

**Components:**
```
src/app/dashboard/ParentDashboard.tsx
  ├── ChildrenOverview (list of children cards)
  ├── PendingApprovalsWidget
  ├── AnnouncementsWidget (existing, reused)
  └── QuickLinksSection
```

#### 1.2 Child Profile View
**Route:** `/dashboard/children/[childId]`

**Features:**
- Child's basic info and avatar
- Points balance and history
- Attendance summary (last 30 days)
- Current activities/competitions
- Recent spiritual notes
- Trip registrations

**Components:**
```
src/app/dashboard/children/[childId]/page.tsx
  ├── ChildHeader (name, class, church)
  ├── PointsSummaryCard
  ├── AttendanceSummary
  ├── ActiveActivitiesSection
  └── TripRegistrationsSection
```

### Phase 2: Trip Approval System (P0)

#### 2.1 Trip Approval Page
**Route:** `/dashboard/approvals`

**Features:**
- List all pending trip approvals for children
- Trip details view (dates, price, destinations)
- Approve/Reject buttons with confirmation
- Approval history

**Server Actions:**
```typescript
// src/app/dashboard/approvals/actions.ts
getPendingApprovalsAction(parentId: string)
approveTripAction(participantId: string, approved: boolean)
getApprovalHistoryAction(parentId: string)
```

**Database Changes:**
- Add `approved_by` to store parent who approved (vs admin)
- Add `approval_notes` for rejection reasons

#### 2.2 Trip Details Modal
When parent clicks on a trip to approve:
- Full trip description
- What to bring
- Transportation details
- Price tier based on child's status
- Emergency contact requirements

### Phase 3: Notification System (P1)

#### 3.1 Database Schema
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50), -- trip_approval, announcement, attendance, etc.
  title VARCHAR(200),
  body TEXT,
  data JSONB, -- Additional context (trip_id, child_id, etc.)
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2 Notification Types
| Type | Trigger | Recipient |
|------|---------|-----------|
| `trip_approval_needed` | Child registers for trip | Parent |
| `trip_status_changed` | Admin approves/rejects | Parent & Child |
| `payment_reminder` | 3 days before trip | Parent |
| `announcement` | New announcement | Based on targeting |
| `attendance_marked` | Child marked absent | Parent |

#### 3.3 Notification Components
```
src/components/notifications/
  ├── NotificationBell.tsx (navbar icon with count)
  ├── NotificationDropdown.tsx (quick view)
  ├── NotificationList.tsx (full page)
  └── NotificationItem.tsx (single notification)
```

### Phase 4: Child Activity Monitoring (P1)

#### 4.1 Activity Participation View
- See which activities child is participating in
- View competition submissions and scores
- See spiritual notes (approved ones)
- Reading schedule progress

#### 4.2 Gamification View (Read-Only)
- Child's badges earned
- Streak information
- Leaderboard position

### Phase 5: Attendance & Payments (P2)

#### 5.1 Attendance History
- Calendar view of attendance
- Statistics (present %, late %, etc.)
- Filter by date range
- Export to PDF

#### 5.2 Payment Management
- Outstanding payments summary
- Payment history
- Mark paid (if enabled by church)
- Generate payment receipt

---

## Technical Implementation

### Database Migrations

```sql
-- Migration: 41_create_parent_features.sql

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200),
  body TEXT,
  body_ar TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- 2. RLS Policies for parent data access
CREATE POLICY "Parents can view their children's data"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.parent_id = auth.uid()
      AND ur.student_id = users.id
      AND ur.is_active = true
    )
  );

-- Similar policies for:
-- - student_points_balance
-- - activity_participants
-- - trip_participants
-- - attendance_records
-- - spiritual_notes (approved only)
-- - user_readings
```

### Types

```typescript
// src/lib/types/modules/parents.ts

export interface ParentChild {
  id: string;
  full_name: string;
  avatar_url?: string;
  class_name?: string;
  church_name?: string;
  points_balance: number;
  pending_approvals_count: number;
}

export interface PendingApproval {
  id: string; // participant id
  trip_id: string;
  trip_name: string;
  child_id: string;
  child_name: string;
  start_date: string;
  end_date: string;
  price: number;
  requires_payment: boolean;
  registered_at: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  title_ar?: string;
  body?: string;
  body_ar?: string;
  data: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export type NotificationType =
  | 'trip_approval_needed'
  | 'trip_status_changed'
  | 'payment_reminder'
  | 'announcement'
  | 'attendance_marked'
  | 'badge_earned';
```

### Server Actions

```typescript
// src/app/dashboard/parents/actions.ts

export async function getParentChildrenAction(): Promise<ActionResult<ParentChild[]>>
export async function getChildDetailsAction(childId: string): Promise<ActionResult<ChildDetails>>
export async function getPendingApprovalsAction(): Promise<ActionResult<PendingApproval[]>>
export async function approveTripParticipationAction(participantId: string, approved: boolean, notes?: string): Promise<ActionResult<void>>
export async function getNotificationsAction(unreadOnly?: boolean): Promise<ActionResult<Notification[]>>
export async function markNotificationReadAction(notificationId: string): Promise<ActionResult<void>>
export async function markAllNotificationsReadAction(): Promise<ActionResult<void>>
```

### Component Structure

```
src/app/dashboard/
├── page.tsx (routes based on role)
├── ParentDashboard.tsx
├── children/
│   └── [childId]/
│       ├── page.tsx
│       └── ChildDetailsClient.tsx
├── approvals/
│   ├── page.tsx
│   └── ApprovalsClient.tsx
└── notifications/
    ├── page.tsx
    └── NotificationsClient.tsx

src/components/parents/
├── ChildCard.tsx
├── PendingApprovalCard.tsx
├── TripApprovalDialog.tsx
├── ChildPointsSummary.tsx
└── ChildAttendanceCalendar.tsx

src/components/notifications/
├── NotificationBell.tsx
├── NotificationDropdown.tsx
├── NotificationList.tsx
└── NotificationItem.tsx
```

---

## i18n Messages

```json
{
  "parents": {
    "title": "Parent Dashboard",
    "children": {
      "title": "My Children",
      "viewProfile": "View Profile",
      "noChildren": "No children linked to your account"
    },
    "approvals": {
      "title": "Pending Approvals",
      "approve": "Approve",
      "reject": "Reject",
      "noApprovals": "No pending approvals",
      "approvalSuccess": "Trip approved successfully",
      "rejectionSuccess": "Trip rejected"
    },
    "notifications": {
      "title": "Notifications",
      "markAllRead": "Mark all as read",
      "noNotifications": "No notifications"
    }
  }
}
```

---

## Implementation Order

### Sprint 1: Foundation
1. Create parent dashboard page with role routing
2. Add server action to get linked children
3. Create ChildCard component
4. Basic parent home view

### Sprint 2: Trip Approvals
1. Create pending approvals page
2. Add approve/reject actions
3. Build TripApprovalDialog
4. Update trip RLS policies

### Sprint 3: Child Details
1. Create child profile page
2. Add points summary component
3. Add attendance view
4. Add activities section

### Sprint 4: Notifications
1. Create notifications table
2. Build notification components
3. Add notification triggers
4. Integrate notification bell

### Sprint 5: Polish
1. Add email notifications
2. Payment management
3. Export features
4. Mobile optimization

---

## RLS Considerations

Parents need read access to their children's data across multiple tables:
- `users` (child profile)
- `student_points_balance`
- `activity_participants`
- `trip_participants`
- `attendance_records`
- `spiritual_notes` (approved only)
- `user_readings`
- `competition_submissions`

Each table needs a policy like:
```sql
CREATE POLICY "Parents can view their children's records"
  ON public.{table_name} FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_relationships ur
      WHERE ur.parent_id = auth.uid()
      AND ur.student_id = {table_name}.user_id
      AND ur.is_active = true
    )
  );
```

---

## Security Notes

1. **Data Isolation**: Parents can ONLY see data for their linked children
2. **Approval Audit**: Track who approved and when
3. **Session Management**: Parent sessions should timeout appropriately
4. **Data Minimization**: Only show necessary child information

---

## Dependencies

- Existing `user_relationships` table
- Existing trip approval fields
- Existing announcements system
- Role-based dashboard routing

---

## Future Enhancements

1. **Push Notifications**: Mobile app push notifications
2. **SMS Alerts**: Critical notifications via SMS
3. **Multi-Child View**: Compare attendance/points across children
4. **Payment Integration**: Online payment for trips
5. **Chat System**: Parent-teacher communication
6. **Calendar Sync**: Export events to Google/Apple Calendar

---

*Plan created for Knasty Portal Parents Features*
