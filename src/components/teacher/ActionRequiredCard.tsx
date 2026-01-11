"use client";

import * as React from "react";
import Link from "next/link";
import { Bus, Trophy, Activity, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const typeConfig = {
  trip: {
    icon: Bus,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  competition: {
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  activity: {
    icon: Activity,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
} as const;

export type ActionRequiredType = keyof typeof typeConfig;

export interface ActionRequiredCardProps
  extends React.HTMLAttributes<HTMLAnchorElement> {
  /** Type of action (determines icon and color) */
  type: ActionRequiredType;
  /** Title of the item requiring action */
  title: string;
  /** Number of pending items */
  count: number;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Navigation URL when clicked */
  href: string;
  /** Show loading skeleton */
  loading?: boolean;
}

/**
 * ActionRequiredCard - Displays a pending action item with type-based styling.
 * Used in the Action Required section of the Teacher Dashboard.
 *
 * @example
 * ```tsx
 * <ActionRequiredCard
 *   type="trip"
 *   title="Summer Camp"
 *   count={3}
 *   subtitle="pending approvals"
 *   href="/dashboard/teacher/action-required/trip/123"
 * />
 * ```
 */
function ActionRequiredCard({
  className,
  type,
  title,
  count,
  subtitle,
  href,
  loading = false,
  ...props
}: ActionRequiredCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  if (loading) {
    return <ActionRequiredCardSkeleton className={className} />;
  }

  return (
    <Link
      href={href}
      data-slot="action-required-card"
      className={cn(
        "group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.bgColor
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{title}</span>
          <Badge variant="secondary" className="shrink-0">
            {count}
          </Badge>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Arrow indicator */}
      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

/**
 * ActionRequiredCardSkeleton - Loading state for ActionRequiredCard
 */
function ActionRequiredCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="action-required-card-skeleton"
      className={cn(
        "flex items-center gap-4 rounded-lg border bg-card p-4",
        className
      )}
    >
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-5 shrink-0" />
    </div>
  );
}

/**
 * ActionRequiredSection - Groups action required cards by type
 */
interface ActionRequiredSectionProps {
  type: ActionRequiredType;
  label: string;
  count: number;
  children: React.ReactNode;
  className?: string;
}

function ActionRequiredSection({
  type,
  label,
  count,
  children,
  className,
}: ActionRequiredSectionProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div data-slot="action-required-section" className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Badge variant="outline" className="text-xs">
          {count}
        </Badge>
      </div>

      {/* Cards */}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export {
  ActionRequiredCard,
  ActionRequiredCardSkeleton,
  ActionRequiredSection,
  typeConfig as actionRequiredTypeConfig,
};
