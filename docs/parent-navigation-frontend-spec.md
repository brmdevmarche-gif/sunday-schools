# Front-End Specification: Parent Navigation & Child Activity Tracking

**Version:** 1.0
**Date:** January 2026
**Author:** Sally (UX Expert)

---

## Overview

This specification extends the parent dashboard experience with:
1. **Parent-Specific Navigation** - Dedicated sidebar navigation for parents
2. **Enhanced Child Activity Tracking** - View and monitor children's activities
3. **Persistent Child Context** - Seamless child selection across store/trips
4. **Parent-Centric Information Architecture** - Navigation optimized for parent workflows

This document builds upon the existing `parent-child-actions-frontend-spec.md` and `parents-features-plan.md`.

---

## User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| PN-01 | Parent | Have navigation tailored to my needs | I can quickly access relevant features |
| PN-02 | Parent | See all my children in the sidebar | I can quickly switch between children |
| PN-03 | Parent | Access pending approvals from nav | I don't miss important actions |
| PN-04 | Parent | View my children's activities | I know what they're participating in |
| PN-05 | Parent | See announcements relevant to my children | I stay informed about church events |
| PN-06 | Parent | View orders placed for my children | I can track store orders |
| PN-07 | Parent | View trip bookings for my children | I can manage registrations |

---

## Information Architecture

### Current State (Problem)
```
Shared Navigation (DashboardNavbar.tsx)
├── Dashboard
├── Trips          ← Student-focused
├── Store          ← Student-focused
├── My Orders      ← Student's own orders
├── Activities     ← Not relevant for parents
├── Lessons        ← Disabled, not relevant
├── Profile
├── Settings
└── Logout
```

### Proposed State (Solution)
```
Parent-Specific Navigation (ParentSidebar.tsx)
├── HOME
│   └── Dashboard           → /dashboard/parents
│
├── MY CHILDREN
│   ├── [Child 1 Avatar+Name] → /dashboard/parents/children/[id]
│   ├── [Child 2 Avatar+Name] → /dashboard/parents/children/[id]
│   └── Add Child           → Opens admin contact info
│
├── ACTIONS
│   ├── Pending Approvals (3) → /dashboard/parents/approvals
│   ├── Notifications (5)     → /dashboard/parents/notifications
│   └── Announcements         → /announcements (filtered for parent)
│
├── FOR MY CHILDREN
│   ├── Store               → /store (with child selector)
│   ├── Orders              → /dashboard/parents/orders
│   └── Trips               → /trips (with child selector)
│
├── ─────────────────────────
│
├── ACCOUNT
│   ├── Profile             → /dashboard/profile
│   └── Settings            → /dashboard/settings
│
└── Logout
```

---

## Component Specifications

### 1. ParentSidebar

**Location:** `src/components/parents/ParentSidebar.tsx`

**Purpose:** Dedicated navigation sidebar for parent users, replacing the shared DashboardNavbar when in parent context.

**Props:**
```typescript
interface ParentSidebarProps {
  children: ParentChild[];
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
  currentPath: string;
}
```

**Visual Design (Mobile - Sheet):**
```
┌─────────────────────────────────────┐
│  [Logo] Knasty                      │
│  Welcome, Ahmed                     │
├─────────────────────────────────────┤
│                                     │
│  HOME                               │
│  ├─ 🏠 Dashboard              ›     │
│                                     │
│  MY CHILDREN                        │
│  ├─ [👧] Marina               ›     │
│  │      Grade 3 • 450 pts           │
│  ├─ [👦] George               ›     │
│  │      Grade 1 • 230 pts           │
│  └─ ➕ Add Child              ›     │
│                                     │
│  ACTIONS                            │
│  ├─ ⚠️ Pending Approvals    (3)     │
│  ├─ 🔔 Notifications        (5)     │
│  └─ 📢 Announcements        (2)     │
│                                     │
│  FOR MY CHILDREN                    │
│  ├─ 🛒 Store                  ›     │
│  ├─ 🛍️ Orders                 ›     │
│  └─ 🚌 Trips                  ›     │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ACCOUNT                            │
│  ├─ 👤 Profile                ›     │
│  └─ ⚙️ Settings               ›     │
│                                     │
│  🚪 Logout                          │
└─────────────────────────────────────┘
```

**Implementation:**
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import {
  Menu,
  Home,
  Users,
  AlertCircle,
  Bell,
  Megaphone,
  ShoppingBag,
  ShoppingCart,
  Bus,
  User,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Plus,
  Star,
} from "lucide-react";
import type { ParentChild } from "@/lib/types";

interface ParentSidebarProps {
  parentName: string | null;
  children: ParentChild[];
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
  unreadAnnouncementsCount?: number;
}

export function ParentSidebar({
  parentName,
  children,
  pendingApprovalsCount,
  unreadNotificationsCount,
  unreadAnnouncementsCount = 0,
}: ParentSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = locale === "ar";

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t("auth.logoutSuccess"));
      router.push("/login");
    } catch {
      toast.error(t("auth.logoutFailed"));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => pathname === href;

  const NavLink = ({
    href,
    icon: Icon,
    label,
    badge,
    disabled,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    badge?: number;
    disabled?: boolean;
  }) => (
    <Link
      href={disabled ? "#" : href}
      onClick={() => !disabled && setIsOpen(false)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
        isActive(href)
          ? "bg-primary/10 text-primary"
          : disabled
            ? "opacity-50 cursor-not-allowed text-muted-foreground"
            : "hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </span>
      <span className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <Badge variant="destructive" className="text-xs px-2 py-0.5">
            {badge > 99 ? "99+" : badge}
          </Badge>
        )}
        {!disabled && <ChevronIcon className="h-4 w-4 text-muted-foreground" />}
      </span>
    </Link>
  );

  const ChildNavItem = ({ child }: { child: ParentChild }) => (
    <Link
      href={`/dashboard/parents/children/${child.id}`}
      onClick={() => setIsOpen(false)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
        pathname.includes(`/children/${child.id}`)
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <OptimizedAvatar
          src={child.avatar_url}
          alt={child.full_name}
          fallback={getInitials(child.full_name)}
          size="sm"
          className="h-8 w-8 border border-primary/20"
          fallbackClassName="text-xs bg-primary/20 text-primary"
        />
        <div className="flex flex-col">
          <span className="font-medium text-sm">{child.full_name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {child.class_name || t("parents.children.noClass")}
            <span className="text-amber-600 flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-current" />
              {child.points_balance}
            </span>
          </span>
        </div>
      </div>
      {child.pending_approvals_count > 0 && (
        <Badge variant="destructive" className="text-xs">
          {child.pending_approvals_count}
        </Badge>
      )}
    </Link>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("common.menu")}</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side={isRTL ? "right" : "left"}
        className="w-[300px] sm:w-[350px] overflow-y-auto"
      >
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="Knasty"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div className="text-start">
              <SheetTitle>{t("common.welcome")}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {parentName?.split(" ")[0] || t("parents.title")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <nav className="mt-6 space-y-6">
          {/* Home Section */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t("nav.home")}
            </p>
            <NavLink
              href="/dashboard/parents"
              icon={Home}
              label={t("nav.dashboard")}
            />
          </div>

          {/* My Children Section */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t("parents.children.title")}
            </p>
            <div className="space-y-1">
              {children.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  {t("parents.dashboard.noChildren")}
                </p>
              ) : (
                children.map((child) => (
                  <ChildNavItem key={child.id} child={child} />
                ))
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  toast.info(t("parents.addChildInfo"));
                }}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm">{t("parents.addChild")}</span>
              </button>
            </div>
          </div>

          {/* Actions Section */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t("parents.actions.title")}
            </p>
            <div className="space-y-1">
              <NavLink
                href="/dashboard/parents/approvals"
                icon={AlertCircle}
                label={t("parents.approvals.title")}
                badge={pendingApprovalsCount}
              />
              <NavLink
                href="/dashboard/parents/notifications"
                icon={Bell}
                label={t("parents.notifications.title")}
                badge={unreadNotificationsCount}
              />
              <NavLink
                href="/announcements"
                icon={Megaphone}
                label={t("studentHome.announcements")}
                badge={unreadAnnouncementsCount}
              />
            </div>
          </div>

          {/* For My Children Section */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t("parents.forMyChildren")}
            </p>
            <div className="space-y-1">
              <NavLink href="/store" icon={ShoppingBag} label={t("nav.store")} />
              <NavLink
                href="/dashboard/parents/orders"
                icon={ShoppingCart}
                label={t("store.orders")}
              />
              <NavLink href="/trips" icon={Bus} label={t("nav.trips")} />
            </div>
          </div>

          <Separator />

          {/* Account Section */}
          <div>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t("studentHome.account")}
            </p>
            <div className="space-y-1">
              <NavLink
                href="/dashboard/profile"
                icon={User}
                label={t("nav.profile")}
              />
              <NavLink
                href="/dashboard/settings"
                icon={Settings}
                label={t("nav.settings")}
              />
            </div>
          </div>

          <Separator />

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {t("auth.logout")}
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

---

### 2. ParentDashboardNavbar

**Location:** `src/app/dashboard/parents/ParentDashboardNavbar.tsx`

**Purpose:** Top navbar for parent dashboard that uses ParentSidebar instead of the shared DashboardNavbar.

**Props:**
```typescript
interface ParentDashboardNavbarProps {
  parentName: string | null;
  children: ParentChild[];
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
}
```

**Visual Design:**
```
┌────────────────────────────────────────────────────────────────┐
│  [☰]  [Logo] Knasty              [🔔 Badge]  [Avatar ▼]        │
└────────────────────────────────────────────────────────────────┘
```

**Implementation:**
```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { ParentSidebar } from "@/components/parents/ParentSidebar";
import { Bell } from "lucide-react";
import type { ParentChild } from "@/lib/types";

interface ParentDashboardNavbarProps {
  parentName: string | null;
  parentAvatar: string | null;
  children: ParentChild[];
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
}

export function ParentDashboardNavbar({
  parentName,
  parentAvatar,
  children,
  pendingApprovalsCount,
  unreadNotificationsCount,
}: ParentDashboardNavbarProps) {
  const t = useTranslations();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const totalBadgeCount = pendingApprovalsCount + unreadNotificationsCount;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
        isScrolled
          ? "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg border-b border-white/20 dark:border-gray-700/50"
          : "bg-background border-b"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-2">
            <ParentSidebar
              parentName={parentName}
              children={children}
              pendingApprovalsCount={pendingApprovalsCount}
              unreadNotificationsCount={unreadNotificationsCount}
            />
            <Link href="/dashboard/parents" className="flex items-center gap-2">
              <Image
                src="/Logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="font-bold text-lg hidden sm:inline">Knasty</span>
            </Link>
          </div>

          {/* Right: Notifications + Avatar */}
          <div className="flex items-center gap-2">
            {/* Quick Notifications Button */}
            <Link href="/dashboard/parents/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-5 text-center">
                    {totalBadgeCount > 99 ? "99+" : totalBadgeCount}
                  </span>
                )}
                <span className="sr-only">{t("parents.notifications.title")}</span>
              </Button>
            </Link>

            {/* Parent Avatar */}
            <Link href="/dashboard/profile">
              <OptimizedAvatar
                src={parentAvatar}
                alt={parentName || "Parent"}
                fallback={getInitials(parentName)}
                size="sm"
                className="h-8 w-8 border-2 border-primary/10 cursor-pointer hover:border-primary/30 transition-colors"
                fallbackClassName="text-xs bg-primary/10 text-primary"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

### 3. Enhanced ChildActionSheet

**Location:** `src/components/parents/ChildActionSheet.tsx` (update existing)

**Purpose:** Add more actions for viewing child's activities, badges, orders, and trip bookings.

**Updated Actions:**
```typescript
const actions = [
  // Existing
  { icon: User, label: t("actions.viewProfile"), href: `/dashboard/parents/children/${child.id}` },
  { icon: ShoppingBag, label: t("actions.orderFromStore"), href: `/store?for=${child.id}` },
  { icon: Bus, label: t("actions.bookTrip"), href: `/trips?for=${child.id}` },
  { icon: Calendar, label: t("actions.viewAttendance"), href: `/dashboard/parents/children/${child.id}?tab=attendance` },

  // New
  { icon: Activity, label: t("actions.viewActivities"), href: `/dashboard/parents/children/${child.id}?tab=activities` },
  { icon: Award, label: t("actions.viewBadges"), href: `/dashboard/parents/children/${child.id}?tab=achievements` },
  { icon: ShoppingCart, label: t("actions.viewOrders"), href: `/dashboard/parents/orders?child=${child.id}` },
  { icon: MapPin, label: t("actions.viewTripBookings"), href: `/dashboard/parents/trips?child=${child.id}` },
];
```

**Visual Design (Updated):**
```
┌─────────────────────────────────────┐
│              ━━━━━━                 │
│                                     │
│           [Avatar 64px]             │
│          Marina Magdi               │
│   Grade 3 • St. Mark • ⭐ 450 pts   │
│                                     │
│  ───────────────────────────────    │
│                                     │
│  PROFILE                            │
│  👤 View Profile               ›    │
│                                     │
│  ACTIVITIES                         │
│  📅 View Attendance            ›    │
│  🏃 View Activities            ›    │
│  🏆 View Badges                ›    │
│                                     │
│  ACTIONS                            │
│  🛍️ Order from Store           ›    │
│  🚌 Book a Trip                ›    │
│                                     │
│  HISTORY                            │
│  🛒 View Orders                ›    │
│  📍 View Trip Bookings         ›    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │          Close              │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

### 4. ParentOrdersPage

**Location:** `src/app/dashboard/parents/orders/page.tsx`

**Purpose:** Show all store orders placed by the parent for their children.

**URL Pattern:** `/dashboard/parents/orders?child=[childId]` (optional filter)

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    My Children's Orders                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Filter: All Children ▼]  [Status: All ▼]                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [👧] Marina • Order #1234                    Jan 5, 2026   ││
│  │  3 items • 150 points                         [Pending]     ││
│  │                                                             ││
│  │  🧸 Teddy Bear (1)                                          ││
│  │  📚 Storybook (2)                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [👦] George • Order #1198                    Jan 3, 2026   ││
│  │  1 item • 75 points                           [Delivered]   ││
│  │                                                             ││
│  │  🎮 Board Game (1)                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
```tsx
// src/app/dashboard/parents/orders/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParentOrdersClient } from "./ParentOrdersClient";

export default async function ParentOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify parent role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") {
    redirect("/dashboard");
  }

  // Get parent's children
  const { data: relationships } = await supabase
    .from("user_relationships")
    .select(`
      student:users!student_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("parent_id", user.id)
    .eq("is_active", true);

  const children = relationships?.map((r) => r.student) || [];
  const childIds = children.map((c) => c.id);

  // Get orders for all children or filtered child
  let ordersQuery = supabase
    .from("store_orders")
    .select(`
      *,
      user:users!user_id(id, full_name, avatar_url),
      items:store_order_items(
        quantity,
        points_cost,
        item:store_items(name, name_ar, image_url)
      )
    `)
    .in("user_id", childIds)
    .order("created_at", { ascending: false });

  if (params.child) {
    ordersQuery = ordersQuery.eq("user_id", params.child);
  }

  const { data: orders } = await ordersQuery;

  return (
    <ParentOrdersClient
      orders={orders || []}
      children={children}
      selectedChildId={params.child}
    />
  );
}
```

---

### 5. ParentTripsPage

**Location:** `src/app/dashboard/parents/trips/page.tsx`

**Purpose:** Show all trip bookings for parent's children.

**URL Pattern:** `/dashboard/parents/trips?child=[childId]` (optional filter)

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    My Children's Trips                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Filter: All Children ▼]  [Status: All ▼]                      │
│                                                                 │
│  UPCOMING                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [🏕️ Image]                                                 ││
│  │  Summer Camp 2026                                           ││
│  │  📍 Alexandria • 🗓️ July 15-22                              ││
│  │                                                             ││
│  │  [👧] Marina           [Confirmed ✓]                        ││
│  │  [👦] George           [Pending Approval]                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  PAST                                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [🏖️ Image]                                                 ││
│  │  Beach Day Trip                                             ││
│  │  📍 Ain Sokhna • 🗓️ Dec 20, 2025                            ││
│  │                                                             ││
│  │  [👧] Marina           [Attended ✓]                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. Enhanced Store Page with Child Selector

**Location:** `src/app/store/page.tsx` (modify existing)

**Purpose:** When a parent visits `/store`, show a child selector header before the store content.

**Visual Design (Parent View):**
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]           Store                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  👧 Shopping for: Marina Magdi              [Change]        ││
│  │     ⭐ 450 points available                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Search...]                        [Filter ▼]                  │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │            │
│  │ Toy     │  │ Book    │  │ Game    │  │ Snack   │            │
│  │ ⭐ 50   │  │ ⭐ 30   │  │ ⭐ 75   │  │ ⭐ 10   │            │
│  │ [Add]   │  │ [Add]   │  │ [Add]   │  │ [Add]   │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**If no child selected (parent visits /store directly):**
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]           Store                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  👨‍👩‍👧‍👦 Select a child to shop for:                            ││
│  │                                                             ││
│  │  ┌───────────────────┐  ┌───────────────────┐               ││
│  │  │ [👧]              │  │ [👦]              │               ││
│  │  │ Marina            │  │ George            │               ││
│  │  │ ⭐ 450 pts        │  │ ⭐ 230 pts        │               ││
│  │  │ [Select]          │  │ [Select]          │               ││
│  │  └───────────────────┘  └───────────────────┘               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── app/
│   └── dashboard/
│       └── parents/
│           ├── page.tsx (existing - Parent Dashboard)
│           ├── ParentDashboardClient.tsx (existing - update)
│           ├── ParentDashboardNavbar.tsx (new)
│           ├── orders/
│           │   ├── page.tsx (new)
│           │   └── ParentOrdersClient.tsx (new)
│           ├── trips/
│           │   ├── page.tsx (new)
│           │   └── ParentTripsClient.tsx (new)
│           ├── approvals/
│           │   └── page.tsx (existing)
│           └── notifications/
│               └── page.tsx (existing)
│
├── components/
│   └── parents/
│       ├── ParentSidebar.tsx (new)
│       ├── ChildActionSheet.tsx (update)
│       ├── ChildCard.tsx (existing)
│       ├── ChildContextBanner.tsx (existing)
│       ├── OrderCard.tsx (new)
│       └── TripBookingCard.tsx (new)
│
└── messages/
    ├── en.json (update)
    └── ar.json (update)
```

---

## i18n Messages

### English (messages/en.json) - Additions

```json
{
  "parents": {
    "title": "Parent Dashboard",
    "forMyChildren": "For My Children",
    "addChild": "Add Child",
    "addChildInfo": "Please contact your church administrator to link a child to your account.",

    "actions": {
      "title": "Actions",
      "viewProfile": "View Profile",
      "orderFromStore": "Order from Store",
      "bookTrip": "Book a Trip",
      "viewAttendance": "View Attendance",
      "viewActivities": "View Activities",
      "viewBadges": "View Badges & Achievements",
      "viewOrders": "View Orders",
      "viewTripBookings": "View Trip Bookings",
      "change": "Change"
    },

    "orders": {
      "title": "My Children's Orders",
      "noOrders": "No orders found",
      "filterByChild": "Filter by child",
      "allChildren": "All Children",
      "orderNumber": "Order #{number}",
      "items": "{count} items",
      "points": "{count} points"
    },

    "trips": {
      "title": "My Children's Trips",
      "noTrips": "No trip bookings found",
      "upcoming": "Upcoming",
      "past": "Past",
      "confirmed": "Confirmed",
      "pending": "Pending Approval",
      "attended": "Attended",
      "cancelled": "Cancelled"
    },

    "store": {
      "selectChildPrompt": "Select a child to shop for:",
      "shoppingFor": "Shopping for:",
      "pointsAvailable": "{points} points available"
    }
  },

  "nav": {
    "home": "Home",
    "dashboard": "Dashboard",
    "store": "Store",
    "trips": "Trips"
  }
}
```

### Arabic (messages/ar.json) - Additions

```json
{
  "parents": {
    "title": "لوحة تحكم ولي الأمر",
    "forMyChildren": "لأطفالي",
    "addChild": "إضافة طفل",
    "addChildInfo": "يرجى التواصل مع مسؤول الكنيسة لربط طفل بحسابك.",

    "actions": {
      "title": "الإجراءات",
      "viewProfile": "عرض الملف الشخصي",
      "orderFromStore": "الطلب من المتجر",
      "bookTrip": "حجز رحلة",
      "viewAttendance": "عرض الحضور",
      "viewActivities": "عرض الأنشطة",
      "viewBadges": "عرض الشارات والإنجازات",
      "viewOrders": "عرض الطلبات",
      "viewTripBookings": "عرض حجوزات الرحلات",
      "change": "تغيير"
    },

    "orders": {
      "title": "طلبات أطفالي",
      "noOrders": "لا توجد طلبات",
      "filterByChild": "تصفية حسب الطفل",
      "allChildren": "جميع الأطفال",
      "orderNumber": "طلب رقم {number}#",
      "items": "{count} عناصر",
      "points": "{count} نقطة"
    },

    "trips": {
      "title": "رحلات أطفالي",
      "noTrips": "لا توجد حجوزات رحلات",
      "upcoming": "القادمة",
      "past": "السابقة",
      "confirmed": "مؤكد",
      "pending": "في انتظار الموافقة",
      "attended": "تم الحضور",
      "cancelled": "ملغي"
    },

    "store": {
      "selectChildPrompt": "اختر طفلاً للتسوق له:",
      "shoppingFor": "التسوق لـ:",
      "pointsAvailable": "{points} نقطة متاحة"
    }
  },

  "nav": {
    "home": "الرئيسية",
    "dashboard": "لوحة التحكم",
    "store": "المتجر",
    "trips": "الرحلات"
  }
}
```

---

## Server Actions

### New Actions Required

```typescript
// src/app/dashboard/parents/orders/actions.ts

export async function getParentChildrenOrdersAction(
  childId?: string
): Promise<ActionResult<ParentOrder[]>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get parent's children IDs
  const { data: relationships } = await supabase
    .from("user_relationships")
    .select("student_id")
    .eq("parent_id", user.id)
    .eq("is_active", true);

  const childIds = relationships?.map((r) => r.student_id) || [];

  // Query orders
  let query = supabase
    .from("store_orders")
    .select(`
      *,
      user:users!user_id(id, full_name, avatar_url),
      items:store_order_items(
        quantity,
        points_cost,
        item:store_items(id, name, name_ar, image_url)
      )
    `)
    .in("user_id", childIds)
    .order("created_at", { ascending: false });

  if (childId && childIds.includes(childId)) {
    query = query.eq("user_id", childId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return { success: true, data };
}

// src/app/dashboard/parents/trips/actions.ts

export async function getParentChildrenTripsAction(
  childId?: string
): Promise<ActionResult<ParentTripBooking[]>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get parent's children IDs
  const { data: relationships } = await supabase
    .from("user_relationships")
    .select("student_id")
    .eq("parent_id", user.id)
    .eq("is_active", true);

  const childIds = relationships?.map((r) => r.student_id) || [];

  // Query trip participations
  let query = supabase
    .from("trip_participants")
    .select(`
      *,
      user:users!user_id(id, full_name, avatar_url),
      trip:trips!trip_id(
        id,
        name,
        name_ar,
        start_date,
        end_date,
        location,
        cover_image_url,
        status
      )
    `)
    .in("user_id", childIds)
    .order("created_at", { ascending: false });

  if (childId && childIds.includes(childId)) {
    query = query.eq("user_id", childId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return { success: true, data };
}
```

---

## Types

```typescript
// src/lib/types/modules/parents.ts (additions)

export interface ParentOrder {
  id: string;
  user_id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  total_points: number;
  created_at: string;
  items: ParentOrderItem[];
}

export interface ParentOrderItem {
  quantity: number;
  points_cost: number;
  item: {
    id: string;
    name: string;
    name_ar?: string;
    image_url?: string;
  };
}

export interface ParentTripBooking {
  id: string;
  user_id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  trip: {
    id: string;
    name: string;
    name_ar?: string;
    start_date: string;
    end_date: string;
    location?: string;
    cover_image_url?: string;
    status: string;
  };
  status: "pending" | "confirmed" | "attended" | "cancelled";
  parent_approval: "pending" | "approved" | "rejected";
  payment_status: "pending" | "paid" | "refunded";
  created_at: string;
}
```

---

## Implementation Priority

### Phase 1: Parent Navigation (Current Focus)
1. Create `ParentSidebar` component
2. Create `ParentDashboardNavbar` component
3. Update `ParentDashboardClient` to use new navbar
4. Add i18n messages

### Phase 2: Orders & Trips Pages
1. Create `/dashboard/parents/orders` page
2. Create `/dashboard/parents/trips` page
3. Add server actions for querying data
4. Create `OrderCard` and `TripBookingCard` components

### Phase 3: Enhanced Store Flow
1. Detect parent role on store page
2. Show child selector for parents
3. Integrate `ChildContextBanner` prominently
4. Update cart/checkout with child context

### Phase 4: Enhanced Child Actions
1. Update `ChildActionSheet` with more actions
2. Group actions by category
3. Add activity and badges quick access

---

## Accessibility Requirements

| Element | Requirement |
|---------|-------------|
| Sidebar | `role="navigation"`, keyboard navigable |
| Child Cards | `role="button"`, focus visible |
| Badges | `aria-label` for screen readers |
| Action Sheet | `role="dialog"`, aria-modal |
| Filter Dropdowns | `role="listbox"`, keyboard navigable |

---

## Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Parent with no children | Show "No children" message + "Add Child" button |
| Parent with 1 child | No switcher, direct navigation |
| Parent with 5+ children | Show scrollable children list |
| Store access without child context | Show child selection prompt |
| RTL language (Arabic) | Sidebar from right, chevrons flipped |
| Mobile view | Sidebar as slide-out sheet |
| Desktop view | Same sidebar behavior (consistent) |

---

## Security Considerations

1. **Role Verification**: All parent pages verify `role === 'parent'`
2. **Child Relationship**: All data access verified through `user_relationships`
3. **Active Relationship**: Only `is_active = true` relationships honored
4. **Read-Only Access**: Parents cannot modify children's data (only view)
5. **Audit Trail**: Parent actions tracked in `ordered_by_parent_id`, `registered_by`

---

*Specification created by Sally, UX Expert*
*Knasty Portal - January 2026*
