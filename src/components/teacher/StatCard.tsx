"use client";

import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import {
  BookOpen,
  Zap,
  Users,
  BarChart3,
  Calendar,
  Bus,
  Megaphone,
  Award,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Icon map for serialization from server components
const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Zap,
  Users,
  BarChart3,
  Calendar,
  Bus,
  Megaphone,
  Award,
};

const statCardVariants = cva(
  "group relative flex flex-col items-center justify-center gap-1 rounded-xl border bg-card p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-border",
        highlight:
          "border-accent/50 bg-accent/5 dark:bg-accent/10",
        warning:
          "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconContainerVariants = cva(
  "flex h-10 w-10 items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary dark:bg-primary/20",
        highlight: "bg-accent/20 text-accent dark:bg-accent/30",
        warning: "bg-amber-500/20 text-amber-600 dark:bg-amber-500/30 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/** Icon name type for StatCard */
export type StatCardIconName = keyof typeof iconMap;

export interface StatCardProps
  extends React.HTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof statCardVariants> {
  /** Icon name (string) for server component compatibility */
  icon: StatCardIconName;
  /** The main value to display (number or string) */
  value: string | number;
  /** Label text below the value */
  label: string;
  /** Navigation URL when clicked */
  href: string;
  /** Show loading skeleton instead of content */
  loading?: boolean;
}

/**
 * StatCard - Displays a key metric with icon, value, and label.
 * Used on the Teacher Dashboard for quick stats overview.
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon="BookOpen"
 *   value={3}
 *   label="Classes"
 *   href="/dashboard/teacher/classes"
 *   variant="default"
 * />
 * ```
 */
function StatCard({
  className,
  variant,
  icon,
  value,
  label,
  href,
  loading = false,
  ...props
}: StatCardProps) {
  const Icon = iconMap[icon] || BookOpen;
  if (loading) {
    return (
      <div
        data-slot="stat-card"
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4",
          className
        )}
      >
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  return (
    <Link
      href={href}
      data-slot="stat-card"
      className={cn(statCardVariants({ variant, className }))}
      {...props}
    >
      {/* Icon container */}
      <div className={cn(iconContainerVariants({ variant }))}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      {/* Value */}
      <span className="text-2xl font-bold tracking-tight text-foreground">
        {value}
      </span>

      {/* Label */}
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </Link>
  );
}

/**
 * StatCardSkeleton - Loading state for StatCard
 */
function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="stat-card-skeleton"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4",
        className
      )}
    >
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-7 w-12" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export { StatCard, StatCardSkeleton, statCardVariants };
