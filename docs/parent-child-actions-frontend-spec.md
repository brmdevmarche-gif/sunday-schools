# Front-End Specification: Parent Child Selection & Actions

**Version:** 1.0
**Date:** January 2026
**Author:** Sally (UX Expert)

---

## Overview

This specification details the implementation of parent-initiated actions on behalf of their children, specifically:
1. **Store Ordering** - Parents order items from the store for a selected child
2. **Trip Booking** - Parents register a child for trips

The design follows existing patterns from the Knasty Portal codebase and extends the parent dashboard with child context switching.

---

## User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| P-01 | Parent | Select which child to act for | I can manage multiple children easily |
| P-02 | Parent | Order store items for my child | My child can receive rewards I choose |
| P-03 | Parent | Book trips for my child | I can register them without their login |
| P-04 | Parent | See my child's point balance | I know what they can afford |
| P-05 | Parent | Switch between children quickly | Managing multiple children is efficient |

---

## Information Architecture

```
/dashboard (Parent Home)
    └── Child Cards Grid
            └── [Click] → Child Action Sheet
                    ├── View Profile → /dashboard/children/[id]
                    ├── Order from Store → /store?for=[childId]
                    ├── Book a Trip → /trips?for=[childId]
                    └── View Attendance → /dashboard/children/[id]?tab=attendance

/store?for=[childId]
    ├── Child Context Banner (sticky)
    ├── Product Grid
    └── Cart Sheet → Checkout → Order Confirmation

/trips?for=[childId]
    ├── Child Context Banner (sticky)
    ├── Trip List/Grid
    └── Registration Dialog → Confirmation
```

---

## Component Specifications

### 1. ChildActionSheet

**Location:** `src/components/parents/ChildActionSheet.tsx`

**Purpose:** Bottom sheet (mobile) or dialog (desktop) showing actions for a selected child.

**Props:**
```typescript
interface ChildActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ParentChild | null;
}
```

**Visual Design:**
```
┌─────────────────────────────────┐
│            ━━━━━━               │  ← Sheet handle
│                                 │
│         [Avatar 64px]           │
│       Marina Magdi              │  ← Child name (bold)
│   Grade 3 • St. Mark • 450 pts  │  ← Info line (muted)
│                                 │
│  ───────────────────────────    │
│                                 │
│  👤 View Profile           ›    │  ← Action row
│  🛍️ Order from Store       ›    │
│  🚌 Book a Trip            ›    │
│  📅 View Attendance        ›    │
│                                 │
│  ┌─────────────────────────┐    │
│  │        Cancel           │    │  ← Outline button
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Implementation:**
```tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/hooks/use-media-query";
import { User, ShoppingBag, Bus, Calendar, ChevronRight } from "lucide-react";
import type { ParentChild } from "@/lib/types/modules/parents";

interface ChildActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ParentChild | null;
}

export function ChildActionSheet({ open, onOpenChange, child }: ChildActionSheetProps) {
  const router = useRouter();
  const t = useTranslations("parents");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!child) return null;

  const actions = [
    {
      icon: User,
      label: t("actions.viewProfile"),
      href: `/dashboard/children/${child.id}`,
      color: "text-blue-500",
    },
    {
      icon: ShoppingBag,
      label: t("actions.orderFromStore"),
      href: `/store?for=${child.id}`,
      color: "text-green-500",
    },
    {
      icon: Bus,
      label: t("actions.bookTrip"),
      href: `/trips?for=${child.id}`,
      color: "text-blue-500",
    },
    {
      icon: Calendar,
      label: t("actions.viewAttendance"),
      href: `/dashboard/children/${child.id}?tab=attendance`,
      color: "text-purple-500",
    },
  ];

  const handleAction = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const content = (
    <div className="flex flex-col items-center py-4">
      <OptimizedAvatar
        src={child.avatar_url}
        fallback={child.full_name}
        size="lg"
        className="h-16 w-16"
      />
      <h3 className="mt-3 text-lg font-bold">{child.full_name}</h3>
      <p className="text-sm text-muted-foreground">
        {child.class_name} • {child.church_name} • {child.points_balance} {t("points")}
      </p>

      <div className="mt-6 w-full space-y-2">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant="ghost"
            className="w-full justify-between h-12 px-4"
            onClick={() => handleAction(action.href)}
          >
            <span className="flex items-center gap-3">
              <action.icon className={`h-5 w-5 ${action.color}`} />
              {action.label}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={() => onOpenChange(false)}
      >
        {t("common.cancel")}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">{t("actions.title")}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="sr-only">{t("actions.title")}</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
```

---

### 2. ChildContextBanner

**Location:** `src/components/parents/ChildContextBanner.tsx`

**Purpose:** Sticky banner showing which child the parent is acting for, with ability to switch.

**Props:**
```typescript
interface ChildContextBannerProps {
  child: ParentChild;
  allChildren: ParentChild[];
  onChildChange: (childId: string) => void;
  contextLabel: string; // "Ordering for" or "Booking for"
}
```

**Visual Design:**
```
┌──────────────────────────────────────────────────────┐
│  [Avatar] Ordering for Marina Magdi    [Change]      │
│           450 points available                       │
└──────────────────────────────────────────────────────┘
```

**Implementation:**
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ParentChild } from "@/lib/types/modules/parents";

interface ChildContextBannerProps {
  child: ParentChild;
  allChildren: ParentChild[];
  onChildChange: (childId: string) => void;
  contextLabel: string;
}

export function ChildContextBanner({
  child,
  allChildren,
  onChildChange,
  contextLabel,
}: ChildContextBannerProps) {
  const t = useTranslations("parents");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChildren = allChildren.filter((c) =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (childId: string) => {
    onChildChange(childId);
    setSwitcherOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <div className="sticky top-14 z-40 border-b bg-primary/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OptimizedAvatar
              src={child.avatar_url}
              fallback={child.full_name}
              size="sm"
              className="h-8 w-8"
            />
            <div>
              <p className="text-sm font-medium">
                {contextLabel} <span className="font-bold">{child.full_name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {child.points_balance} {t("pointsAvailable")}
              </p>
            </div>
          </div>
          {allChildren.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSwitcherOpen(true)}
            >
              {t("actions.change")}
            </Button>
          )}
        </div>
      </div>

      <Sheet open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>{t("selectChild")}</SheetTitle>
          </SheetHeader>

          {allChildren.length > 5 && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchChildren")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          <div className="mt-4 space-y-2 overflow-y-auto max-h-[50vh]">
            {filteredChildren.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <OptimizedAvatar
                    src={c.avatar_url}
                    fallback={c.full_name}
                    size="sm"
                  />
                  <div className="text-left">
                    <p className="font-medium">{c.full_name}</p>
                    <p className="text-sm text-muted-foreground">{c.class_name}</p>
                  </div>
                </div>
                {c.id === child.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

---

### 3. Enhanced Store Page

**Location:** `src/app/store/page.tsx` (modify existing)

**Changes Required:**
1. Accept `for` query parameter for child context
2. Show ChildContextBanner when `for` param exists
3. Use child's points for cart validation
4. Submit orders with child's user_id

**URL Pattern:** `/store?for=[childId]`

**Server Component Updates:**
```typescript
// src/app/store/page.tsx
interface StorePageProps {
  searchParams: Promise<{ for?: string }>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const childId = params.for;

  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If childId provided, verify parent-child relationship
  let targetChild: ParentChild | null = null;
  let allChildren: ParentChild[] = [];

  if (childId && user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "parent") {
      // Get all children for this parent
      const { data: children } = await supabase
        .from("user_relationships")
        .select(`
          student:users!student_id(
            id,
            full_name,
            avatar_url,
            church:churches(name),
            class:class_assignments(class:classes(name))
          )
        `)
        .eq("parent_id", user.id)
        .eq("is_active", true);

      if (children) {
        allChildren = children.map(/* transform to ParentChild */);
        targetChild = allChildren.find(c => c.id === childId) || null;
      }

      // Get child's points balance
      if (targetChild) {
        const { data: points } = await supabase
          .from("student_points_balance")
          .select("total_points")
          .eq("user_id", childId)
          .single();
        targetChild.points_balance = points?.total_points || 0;
      }
    }
  }

  // Get store items
  const { data: items } = await getStoreItemsAction();

  return (
    <StoreClient
      items={items}
      targetChild={targetChild}
      allChildren={allChildren}
      currentUserId={user?.id}
    />
  );
}
```

**Client Component Updates:**
```typescript
// src/app/store/StoreClient.tsx (modifications)
interface StoreClientProps {
  items: StoreItem[];
  targetChild?: ParentChild | null;
  allChildren?: ParentChild[];
  currentUserId?: string;
}

export default function StoreClient({
  items,
  targetChild,
  allChildren = [],
  currentUserId,
}: StoreClientProps) {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = useState<ParentChild | null>(
    targetChild || null
  );

  // Points to use for validation
  const availablePoints = selectedChild?.points_balance || userPoints;

  const handleChildChange = (childId: string) => {
    const newChild = allChildren.find(c => c.id === childId);
    setSelectedChild(newChild || null);
    router.push(`/store?for=${childId}`);
  };

  const handleCheckout = async () => {
    // If ordering for child, use child's ID
    const orderUserId = selectedChild?.id || currentUserId;

    await createOrderAction({
      user_id: orderUserId,
      items: cartItems,
      ordered_by: currentUserId, // Track who placed the order
    });
  };

  return (
    <div>
      {selectedChild && (
        <ChildContextBanner
          child={selectedChild}
          allChildren={allChildren}
          onChildChange={handleChildChange}
          contextLabel={t("orderingFor")}
        />
      )}

      {/* Rest of store UI */}
    </div>
  );
}
```

---

### 4. Enhanced Trips Page

**Location:** `src/app/trips/page.tsx` (modify existing)

**Changes Required:**
1. Accept `for` query parameter
2. Show ChildContextBanner
3. Show appropriate price tier for child
4. Submit registrations with child's user_id

**URL Pattern:** `/trips?for=[childId]`

**Trip Registration Dialog:**
```tsx
interface TripRegistrationDialogProps {
  trip: Trip;
  child: ParentChild;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

function TripRegistrationDialog({
  trip,
  child,
  open,
  onOpenChange,
  onConfirm,
}: TripRegistrationDialogProps) {
  const t = useTranslations("trips");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmRegistration")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("registeringChildForTrip", { child: child.full_name, trip: trip.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Trip Summary Card */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <img
                  src={trip.image_url || "/placeholder-trip.jpg"}
                  alt={trip.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-medium">{trip.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {trip.price} {t("egp")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Child Info */}
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <OptimizedAvatar src={child.avatar_url} fallback={child.full_name} size="sm" />
            <div>
              <p className="text-sm font-medium">{child.full_name}</p>
              <p className="text-xs text-muted-foreground">{child.class_name}</p>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label htmlFor="confirm" className="text-sm">
              {t("confirmParticipation")}
            </label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!agreed || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("registerChild", { name: child.full_name })
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Server Actions

### Store Actions (new/modified)

```typescript
// src/app/store/actions.ts

export async function createOrderForChildAction(input: {
  childId: string;
  items: Array<{ itemId: string; quantity: number }>;
}): Promise<ActionResult<{ orderId: string }>> {
  const supabase = await createClient();

  // Verify parent-child relationship
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: relationship } = await supabase
    .from("user_relationships")
    .select("id")
    .eq("parent_id", user.id)
    .eq("student_id", input.childId)
    .eq("is_active", true)
    .single();

  if (!relationship) throw new Error("Not authorized");

  // Verify child has sufficient points
  const { data: balance } = await supabase
    .from("student_points_balance")
    .select("total_points")
    .eq("user_id", input.childId)
    .single();

  const totalCost = /* calculate from items */;
  if ((balance?.total_points || 0) < totalCost) {
    throw new Error("Insufficient points");
  }

  // Create order
  const adminClient = createAdminClient();
  const { data: order, error } = await adminClient
    .from("store_orders")
    .insert({
      user_id: input.childId,
      ordered_by_parent_id: user.id,
      status: "pending",
      total_points: totalCost,
    })
    .select()
    .single();

  if (error) throw error;

  // Insert order items and deduct points...

  return { success: true, data: { orderId: order.id } };
}
```

### Trip Actions (new/modified)

```typescript
// src/app/trips/actions.ts

export async function registerChildForTripAction(input: {
  childId: string;
  tripId: string;
  notes?: string;
}): Promise<ActionResult<{ participantId: string }>> {
  const supabase = await createClient();

  // Verify parent-child relationship
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: relationship } = await supabase
    .from("user_relationships")
    .select("id")
    .eq("parent_id", user.id)
    .eq("student_id", input.childId)
    .eq("is_active", true)
    .single();

  if (!relationship) throw new Error("Not authorized");

  // Get trip details
  const { data: trip } = await supabase
    .from("trips")
    .select("*, requires_parent_approval")
    .eq("id", input.tripId)
    .single();

  if (!trip) throw new Error("Trip not found");

  // Check capacity
  const { count } = await supabase
    .from("trip_participants")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", input.tripId)
    .neq("status", "cancelled");

  if (trip.capacity && count && count >= trip.capacity) {
    throw new Error("Trip is full");
  }

  // Register child
  const adminClient = createAdminClient();
  const { data: participant, error } = await adminClient
    .from("trip_participants")
    .insert({
      trip_id: input.tripId,
      user_id: input.childId,
      registered_by: user.id,
      status: "pending",
      // If parent registered, auto-approve parent approval
      parent_approval: "approved",
      parent_approved_by: user.id,
      parent_approved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return { success: true, data: { participantId: participant.id } };
}
```

---

## Database Schema Changes

### store_orders table update

```sql
-- Add parent tracking to store orders
ALTER TABLE public.store_orders
ADD COLUMN IF NOT EXISTS ordered_by_parent_id UUID REFERENCES public.users(id);

COMMENT ON COLUMN public.store_orders.ordered_by_parent_id IS
  'Parent who placed the order on behalf of the child';
```

### trip_participants table update

```sql
-- Already has parent approval fields from migration 41
-- Add registered_by for audit
ALTER TABLE public.trip_participants
ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES public.users(id);

COMMENT ON COLUMN public.trip_participants.registered_by IS
  'User who registered (could be parent, admin, or student themselves)';
```

---

## i18n Messages

### English (messages/en.json)

```json
{
  "parents": {
    "actions": {
      "title": "Child Actions",
      "viewProfile": "View Profile",
      "orderFromStore": "Order from Store",
      "bookTrip": "Book a Trip",
      "viewAttendance": "View Attendance",
      "change": "Change"
    },
    "orderingFor": "Ordering for",
    "bookingFor": "Booking for",
    "pointsAvailable": "points available",
    "selectChild": "Select Child",
    "searchChildren": "Search children...",
    "insufficientPoints": "Not enough points",
    "insufficientPointsDescription": "{name} only has {available} points but this order requires {required} points."
  },
  "trips": {
    "confirmRegistration": "Confirm Registration",
    "registeringChildForTrip": "You are registering {child} for {trip}.",
    "confirmParticipation": "I confirm that my child can participate in this trip.",
    "registerChild": "Register {name}",
    "registrationSuccess": "Registration successful",
    "registrationPending": "Registration pending approval"
  }
}
```

### Arabic (messages/ar.json)

```json
{
  "parents": {
    "actions": {
      "title": "إجراءات الطفل",
      "viewProfile": "عرض الملف الشخصي",
      "orderFromStore": "الطلب من المتجر",
      "bookTrip": "حجز رحلة",
      "viewAttendance": "عرض الحضور",
      "change": "تغيير"
    },
    "orderingFor": "الطلب لـ",
    "bookingFor": "الحجز لـ",
    "pointsAvailable": "نقطة متاحة",
    "selectChild": "اختر طفلاً",
    "searchChildren": "البحث عن الأطفال...",
    "insufficientPoints": "نقاط غير كافية",
    "insufficientPointsDescription": "{name} لديه {available} نقطة فقط لكن هذا الطلب يتطلب {required} نقطة."
  },
  "trips": {
    "confirmRegistration": "تأكيد التسجيل",
    "registeringChildForTrip": "أنت تسجل {child} في {trip}.",
    "confirmParticipation": "أؤكد أن طفلي يستطيع المشاركة في هذه الرحلة.",
    "registerChild": "تسجيل {name}",
    "registrationSuccess": "تم التسجيل بنجاح",
    "registrationPending": "التسجيل قيد الانتظار"
  }
}
```

---

## File Structure

```
src/
├── app/
│   ├── store/
│   │   ├── page.tsx (modified)
│   │   ├── StoreClient.tsx (modified)
│   │   └── actions.ts (modified)
│   └── trips/
│       ├── page.tsx (modified)
│       ├── TripsClient.tsx (modified)
│       └── actions.ts (modified)
├── components/
│   └── parents/
│       ├── ChildActionSheet.tsx (new)
│       ├── ChildContextBanner.tsx (new)
│       └── TripRegistrationDialog.tsx (new)
├── hooks/
│   └── use-media-query.ts (new if not exists)
└── lib/
    └── types/
        └── modules/
            └── parents.ts (extend)
```

---

## State Management

### URL-Based Context
- Child selection persists via URL query parameter `?for=[childId]`
- Allows deep linking and back button support
- Refreshes show correct context

### Local State
- Cart items in `useState` with child context
- Dialog/sheet open states
- Form inputs

### No Global State Required
- Each page fetches child data from URL param
- Parent relationship verified server-side

---

## Security Considerations

1. **Relationship Verification**: Every action verifies parent-child relationship via RLS
2. **Point Validation**: Orders validated against child's actual balance
3. **Audit Trail**: `ordered_by_parent_id` and `registered_by` fields track who performed actions
4. **Read-Only Points**: Parents cannot modify child's points
5. **Active Relationship**: Only `is_active = true` relationships are honored

---

## Accessibility Requirements

| Element | Requirement |
|---------|-------------|
| Action Sheet | role="dialog", aria-modal="true" |
| Child Cards | role="button", keyboard navigable |
| Context Banner | Announced on page load via aria-live |
| Form Inputs | Associated labels, error messages |
| Loading States | aria-busy="true" on container |

---

## Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Parent with 1 child | No "Change" button shown |
| Parent with 3 children | Switcher shows all 3 |
| Order with insufficient points | Disabled checkout, warning shown |
| Trip at capacity | "Full" badge, disabled register button |
| Invalid child ID in URL | Redirect to /dashboard |
| Non-parent accessing ?for= | Ignore param, show normal store |

---

## Implementation Priority

1. **Phase 1**: ChildActionSheet + basic navigation
2. **Phase 2**: ChildContextBanner + Store integration
3. **Phase 3**: Trip booking integration
4. **Phase 4**: Cart with point validation
5. **Phase 5**: Order confirmation + notifications

---

*Specification created by Sally, UX Expert*
*For Knasty Portal - January 2026*
