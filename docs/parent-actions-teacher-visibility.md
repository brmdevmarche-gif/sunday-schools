# Teacher Visibility: Parent-Initiated Actions

**Version:** 1.0
**Date:** January 2026

---

## Overview

When parents perform actions on behalf of their children (store orders, trip registrations), these actions must be clearly marked so teachers and admins can distinguish them from student-initiated actions.

---

## Visual Indicators

### 1. Badge Component: "Added by Parent"

```
┌─────────────────────────────────────────────────┐
│  BADGE VARIANTS                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Default (Purple):                              │
│  ┌──────────────────┐                           │
│  │ 👪 Added by Parent│  bg-purple-100           │
│  └──────────────────┘   text-purple-700         │
│                         border-purple-200       │
│                                                 │
│  Compact (Icon only):                           │
│  ┌────┐                                         │
│  │ 👪 │  With tooltip: "Added by Parent"        │
│  └────┘                                         │
│                                                 │
│  With Parent Name:                              │
│  ┌────────────────────────────┐                 │
│  │ 👪 Added by Sarah Magdi    │                 │
│  └────────────────────────────┘                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. Color Coding

| Action Type | Student-Initiated | Parent-Initiated |
|-------------|-------------------|------------------|
| Store Order | Default styling | Purple accent badge |
| Trip Registration | Default styling | Purple accent badge |
| Trip Approval | N/A | Purple badge (always parent) |

---

## Screen Wireframes: Teacher View

### Store Orders List (Teacher/Admin View)

```
┌─────────────────────────────────────────────────────────────────┐
│  Store Orders                                      Filter ▼     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Order #1234              Jan 10, 2026 • 2:30 PM          │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  👦 Mark Magdi                     🟡 Pending             │  │
│  │     Grade 5 • St. Mark                                    │  │
│  │                                                           │  │
│  │  Items: Notebook, Pencil Set                              │  │
│  │  Total: 75 points                                         │  │
│  │                                                           │  │
│  │  ┌──────────────────┐                                     │  │
│  │  │ 👪 Added by Parent│  ← PARENT INDICATOR                │  │
│  │  │   Sarah Magdi    │                                     │  │
│  │  └──────────────────┘                                     │  │
│  │                                                           │  │
│  │  [View Details]  [Fulfill]  [Reject]                      │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Order #1233              Jan 10, 2026 • 1:15 PM          │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  👧 Marina Magdi                   🟢 Fulfilled           │  │
│  │     Grade 3 • St. Mark                                    │  │
│  │                                                           │  │
│  │  Items: Water Bottle                                      │  │
│  │  Total: 50 points                                         │  │
│  │                                                           │  │
│  │  (No parent badge = student ordered themselves)           │  │
│  │                                                           │  │
│  │  [View Details]                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Order Details View (Teacher/Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│  ‹ Back    Order #1234                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Order Information                                        │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  Status:           🟡 Pending                             │  │
│  │  Order Date:       Jan 10, 2026 • 2:30 PM                 │  │
│  │  Total Points:     75                                     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Student                                                  │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  👦 Mark Magdi                                            │  │
│  │     Grade 5 • St. Mark Church                             │  │
│  │     Points Balance: 280 → 205 (after order)               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👪 Ordered by Parent                                     │  │  ← HIGHLIGHT
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  Sarah Magdi                                              │  │
│  │  Parent of Mark Magdi                                     │  │
│  │  Ordered on: Jan 10, 2026 • 2:30 PM                       │  │
│  │                                                           │  │
│  │  ℹ️ This order was placed by the student's parent         │  │
│  │     through their parent dashboard.                       │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Items                                                    │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  [img] Notebook (A5)              x1        50 pts        │  │
│  │  [img] Pencil Set                 x1        25 pts        │  │
│  │                                   ─────────────────       │  │
│  │                                   Total:    75 pts        │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │     Reject      │  │     Fulfill     │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Trip Participants List (Teacher/Admin View)

```
┌─────────────────────────────────────────────────────────────────┐
│  Monastery Trip - Participants                    Export ⬇️     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  32 registered • 28 confirmed • 4 pending                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  #  Student          Class     Status     Registered   │    │
│  │  ─────────────────────────────────────────────────────  │    │
│  │                                                         │    │
│  │  1  Marina Magdi     Grade 3   ✅ Confirmed  Self       │    │
│  │                                                         │    │
│  │  2  Mark Magdi       Grade 5   🟡 Pending    👪 Parent  │← TAG│
│  │                                              Sarah M.   │    │
│  │                                                         │    │
│  │  3  John Samuel      Grade 4   ✅ Confirmed  Self       │    │
│  │                                                         │    │
│  │  4  Mary Hanna       Grade 3   ✅ Confirmed  👪 Parent  │← TAG│
│  │                                              Hanna F.   │    │
│  │                                                         │    │
│  │  5  Peter Youssef    Grade 5   ❌ Rejected   Self       │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Legend: 👪 = Registered by parent                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Trip Participant Detail (Teacher/Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│  ‹ Back    Participant Details                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  👦 Mark Magdi                                            │  │
│  │     Grade 5 • St. Mark Church                             │  │
│  │                                                           │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  Trip:              Monastery Trip                        │  │
│  │  Dates:             Feb 15-17, 2026                       │  │
│  │  Price Tier:        Standard (EGP 500)                    │  │
│  │  Status:            🟡 Pending Confirmation               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👪 Registration Details                                  │  │  ← HIGHLIGHT
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  Registered by:     Sarah Magdi (Parent)                  │  │
│  │  Relationship:      Mother                                │  │
│  │  Registration Date: Jan 10, 2026 • 3:45 PM                │  │
│  │                                                           │  │
│  │  Parent Approval:   ✅ Auto-approved                      │  │
│  │                     (Parent registered directly)          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Payment Status                                           │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  Amount Due:        EGP 500                               │  │
│  │  Status:            🟡 Unpaid                             │  │
│  │                                                           │  │
│  │  [Mark as Paid]                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │  Cancel Reg.    │  │     Confirm     │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filter Options for Teachers

### Orders Filter

```
┌─────────────────────────────────────┐
│  Filter Orders                      │
├─────────────────────────────────────┤
│                                     │
│  Status:                            │
│  ○ All                              │
│  ○ Pending                          │
│  ○ Fulfilled                        │
│  ○ Rejected                         │
│                                     │
│  Ordered By:                        │
│  ○ All                              │
│  ○ Student (Self)                   │
│  ○ Parent             ← NEW FILTER  │
│                                     │
│  Date Range:                        │
│  [From] ─────── [To]                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       Apply Filters         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Trip Participants Filter

```
┌─────────────────────────────────────┐
│  Filter Participants                │
├─────────────────────────────────────┤
│                                     │
│  Status:                            │
│  ☑ Confirmed                        │
│  ☑ Pending                          │
│  ☐ Cancelled                        │
│                                     │
│  Registered By:                     │
│  ○ All                              │
│  ○ Student (Self)                   │
│  ○ Parent             ← NEW FILTER  │
│  ○ Admin                            │
│                                     │
│  Class:                             │
│  [Select class...        ▼]        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       Apply Filters         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## Component Implementation

### ParentActionBadge Component

```tsx
// src/components/ui/parent-action-badge.tsx

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface ParentActionBadgeProps {
  parentName?: string;
  compact?: boolean;
  className?: string;
}

export function ParentActionBadge({
  parentName,
  compact = false,
  className
}: ParentActionBadgeProps) {
  const t = useTranslations("common");

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className={cn(
              "bg-purple-50 text-purple-700 border-purple-200",
              className
            )}
          >
            <Users className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {parentName
            ? t("addedByParentName", { name: parentName })
            : t("addedByParent")
          }
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-purple-50 text-purple-700 border-purple-200",
        className
      )}
    >
      <Users className="h-3 w-3 mr-1" />
      {parentName
        ? t("addedByParentName", { name: parentName })
        : t("addedByParent")
      }
    </Badge>
  );
}
```

### Usage in Order Card

```tsx
// In store order list component

<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Order #{order.id}</CardTitle>
        <CardDescription>{order.created_at}</CardDescription>
      </div>
      <Badge variant={getStatusVariant(order.status)}>
        {order.status}
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={order.student.avatar_url} />
        <AvatarFallback>{getInitials(order.student.full_name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{order.student.full_name}</p>
        <p className="text-sm text-muted-foreground">{order.student.class_name}</p>
      </div>
    </div>

    {/* Parent Action Badge - shown when parent ordered */}
    {order.ordered_by_parent_id && (
      <div className="mt-3">
        <ParentActionBadge parentName={order.parent?.full_name} />
      </div>
    )}
  </CardContent>
</Card>
```

### Usage in Trip Participants Table

```tsx
// In trip participants table

<TableRow>
  <TableCell>{index + 1}</TableCell>
  <TableCell>
    <div className="flex items-center gap-2">
      <Avatar size="sm">...</Avatar>
      <span>{participant.student.full_name}</span>
    </div>
  </TableCell>
  <TableCell>{participant.student.class_name}</TableCell>
  <TableCell>
    <Badge variant={getStatusVariant(participant.status)}>
      {participant.status}
    </Badge>
  </TableCell>
  <TableCell>
    {participant.registered_by === participant.user_id ? (
      <span className="text-muted-foreground">Self</span>
    ) : participant.registered_by_parent ? (
      <ParentActionBadge
        parentName={participant.parent?.full_name}
        compact
      />
    ) : (
      <span className="text-muted-foreground">Admin</span>
    )}
  </TableCell>
</TableRow>
```

---

## Database Queries

### Get Orders with Parent Info

```typescript
// src/app/admin/orders/actions.ts

export async function getOrdersWithParentInfo() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_orders")
    .select(`
      *,
      student:users!user_id(
        id,
        full_name,
        avatar_url,
        class_assignments(
          class:classes(name)
        )
      ),
      parent:users!ordered_by_parent_id(
        id,
        full_name
      ),
      items:store_order_items(
        quantity,
        item:store_items(name, points_cost)
      )
    `)
    .order("created_at", { ascending: false });

  return data;
}
```

### Get Trip Participants with Registration Info

```typescript
// src/app/admin/trips/[id]/actions.ts

export async function getTripParticipantsWithRegistrationInfo(tripId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trip_participants")
    .select(`
      *,
      student:users!user_id(
        id,
        full_name,
        avatar_url,
        class_assignments(
          class:classes(name)
        )
      ),
      registered_by_user:users!registered_by(
        id,
        full_name,
        role
      ),
      parent_approver:users!parent_approved_by(
        id,
        full_name
      )
    `)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  // Transform to add helper flags
  return data?.map(p => ({
    ...p,
    registered_by_parent: p.registered_by_user?.role === 'parent',
    registered_by_admin: ['super_admin', 'church_admin', 'teacher'].includes(p.registered_by_user?.role),
    registered_by_self: p.registered_by === p.user_id,
  }));
}
```

---

## i18n Messages

### English

```json
{
  "common": {
    "addedByParent": "Added by Parent",
    "addedByParentName": "Added by {name}",
    "registeredByParent": "Registered by Parent",
    "orderedByParent": "Ordered by Parent",
    "self": "Self",
    "parentAction": "Parent Action"
  },
  "orders": {
    "filterByOrderedBy": "Ordered By",
    "orderedBySelf": "Student (Self)",
    "orderedByParent": "Parent",
    "parentOrderNote": "This order was placed by the student's parent through their parent dashboard."
  },
  "trips": {
    "filterByRegisteredBy": "Registered By",
    "registeredBySelf": "Student (Self)",
    "registeredByParent": "Parent",
    "registeredByAdmin": "Admin",
    "parentRegistrationNote": "This registration was made by the student's parent. Parent approval was automatically granted."
  }
}
```

### Arabic

```json
{
  "common": {
    "addedByParent": "أضافه ولي الأمر",
    "addedByParentName": "أضافه {name}",
    "registeredByParent": "سجله ولي الأمر",
    "orderedByParent": "طلبه ولي الأمر",
    "self": "ذاتي",
    "parentAction": "إجراء ولي الأمر"
  },
  "orders": {
    "filterByOrderedBy": "طُلب بواسطة",
    "orderedBySelf": "الطالب (ذاتي)",
    "orderedByParent": "ولي الأمر",
    "parentOrderNote": "تم تقديم هذا الطلب من قبل ولي أمر الطالب من خلال لوحة تحكم الوالدين."
  },
  "trips": {
    "filterByRegisteredBy": "سُجل بواسطة",
    "registeredBySelf": "الطالب (ذاتي)",
    "registeredByParent": "ولي الأمر",
    "registeredByAdmin": "المسؤول",
    "parentRegistrationNote": "تم هذا التسجيل من قبل ولي أمر الطالب. تمت الموافقة تلقائياً."
  }
}
```

---

## Summary

| Action | Indicator Location | Badge Text | Color |
|--------|-------------------|------------|-------|
| Store Order | Order card, Order details | "Added by Parent" + name | Purple |
| Trip Registration | Participants table, Participant details | "👪 Parent" + name | Purple |
| Trip Approval | Approval history | "Approved by Parent" | Purple |

### Teacher Benefits

1. **Quick Identification** - Purple badges stand out in lists
2. **Filtering** - Can filter to see only parent-initiated actions
3. **Accountability** - Parent name is recorded and displayed
4. **Context** - Helpful notes explain what parent actions mean

---

*Specification by Sally, UX Expert*
*For Knasty Portal - January 2026*
