"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Zap, Megaphone, Bus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  /** If true, only show if condition is met */
  conditional?: boolean;
}

export interface TeacherBottomNavProps {
  /** Number of pending actions for badge */
  pendingCount?: number;
  /** Number of unread announcements for badge */
  unreadAnnouncementsCount?: number;
  /** Whether teacher is organizing any trips (shows/hides trips tab) */
  isOrganizingTrips?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * TeacherBottomNav - Fixed bottom navigation for teacher mobile view.
 * Shows up to 5 navigation items with optional badges.
 *
 * @example
 * ```tsx
 * <TeacherBottomNav
 *   pendingCount={5}
 *   unreadAnnouncementsCount={2}
 *   isOrganizingTrips={true}
 * />
 * ```
 */
function TeacherBottomNav({
  pendingCount = 0,
  unreadAnnouncementsCount = 0,
  isOrganizingTrips = false,
  className,
}: TeacherBottomNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = React.useMemo(() => {
    const items: NavItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard/teacher",
        icon: Home,
      },
      {
        id: "classes",
        label: "My Classes",
        href: "/dashboard/teacher/classes",
        icon: BookOpen,
      },
      {
        id: "action-required",
        label: "Action",
        href: "/dashboard/teacher/action-required",
        icon: Zap,
        badge: pendingCount > 0 ? pendingCount : undefined,
      },
      {
        id: "announcements",
        label: "Announce",
        href: "/dashboard/teacher/announcements",
        icon: Megaphone,
        badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : undefined,
      },
    ];

    // Conditionally add trips tab
    if (isOrganizingTrips) {
      items.push({
        id: "trips",
        label: "My Trips",
        href: "/dashboard/teacher/trips",
        icon: Bus,
        conditional: true,
      });
    }

    return items;
  }, [pendingCount, unreadAnnouncementsCount, isOrganizingTrips]);

  const isActive = (href: string) => {
    if (href === "/dashboard/teacher") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      data-slot="teacher-bottom-nav"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "safe-area-inset-bottom",
        className
      )}
      role="navigation"
      aria-label="Teacher navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 py-2",
                "min-h-[44px] min-w-[44px]", // Touch target
                "rounded-lg transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon with optional badge */}
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "scale-110"
                  )}
                  aria-hidden="true"
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className={cn(
                      "absolute -top-2 -right-2 h-4 min-w-4 px-1",
                      "flex items-center justify-center",
                      "text-[10px] font-bold",
                      "animate-in fade-in-0 zoom-in-50"
                    )}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>

              {/* Active indicator line */}
              {active && (
                <span
                  className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * TeacherBottomNavSpacer - Adds padding to prevent content from being hidden by fixed nav
 */
function TeacherBottomNavSpacer({ className }: { className?: string }) {
  return (
    <div
      data-slot="teacher-bottom-nav-spacer"
      className={cn("h-16", className)}
      aria-hidden="true"
    />
  );
}

export { TeacherBottomNav, TeacherBottomNavSpacer };
