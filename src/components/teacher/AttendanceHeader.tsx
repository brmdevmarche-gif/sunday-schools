"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar, CheckCheck, Check, X, AlertTriangle, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus } from "./AttendanceStatusButton";

export interface AttendanceStats {
  total: number;
  marked: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
}

export interface AttendanceHeaderProps {
  /** Class name */
  className: string;
  /** Selected date */
  date: Date;
  /** Called when date changes */
  onDateChange?: (date: Date) => void;
  /** Attendance statistics */
  stats: AttendanceStats;
  /** Called when "Mark All Present" is clicked */
  onMarkAllPresent: () => void;
  /** Whether all students are already marked present */
  allMarkedPresent?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  classNameProp?: string;
}

/**
 * AttendanceHeader - Header section for the attendance page.
 * Shows class name, date, progress counter, and stats summary.
 *
 * @example
 * ```tsx
 * <AttendanceHeader
 *   className="Grade 5 - St. Mark"
 *   date={new Date()}
 *   stats={{ total: 15, marked: 12, present: 10, absent: 1, excused: 1, late: 0 }}
 *   onMarkAllPresent={() => markAll("present")}
 * />
 * ```
 */
function AttendanceHeader({
  className,
  date,
  onDateChange,
  stats,
  onMarkAllPresent,
  allMarkedPresent = false,
  disabled = false,
  classNameProp,
}: AttendanceHeaderProps) {
  const t = useTranslations("teacher.attendance");

  const formatDate = (d: Date) => {
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const statItems: {
    key: AttendanceStatus;
    icon: typeof Check;
    count: number;
    color: string;
    bgColor: string;
  }[] = [
    {
      key: "present",
      icon: Check,
      count: stats.present,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      key: "absent",
      icon: X,
      count: stats.absent,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      key: "excused",
      icon: AlertTriangle,
      count: stats.excused,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      key: "late",
      icon: Clock,
      count: stats.late,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div
      data-slot="attendance-header"
      className={cn("space-y-4", classNameProp)}
    >
      {/* Class Name & Date */}
      <div>
        <h2 className="text-lg font-semibold">{className}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span>{formatDate(date)}</span>
        </div>
      </div>

      {/* Mark All Present Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onMarkAllPresent}
        disabled={disabled || allMarkedPresent}
        className={cn(
          "w-full h-10",
          allMarkedPresent && "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
        )}
      >
        <CheckCheck className="h-4 w-4 mr-2" aria-hidden="true" />
        {allMarkedPresent ? t("allMarkedPresent") : t("markAllPresent")}
      </Button>

      {/* Progress Counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t("progressCounter", { marked: stats.marked, total: stats.total })}
        </span>
        <Badge
          variant={stats.marked === stats.total ? "default" : "secondary"}
          className={cn(
            stats.marked === stats.total && "bg-green-600"
          )}
        >
          {Math.round((stats.marked / stats.total) * 100)}%
        </Badge>
      </div>

      {/* Stats Summary */}
      <div className="flex justify-between gap-2">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg",
                item.bgColor
              )}
            >
              <div className={cn("flex items-center gap-1", item.color)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="font-semibold">{item.count}</span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {t(item.key)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * AttendanceHeaderSkeleton - Loading state for AttendanceHeader
 */
function AttendanceHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div data-slot="attendance-header-skeleton" className={cn("space-y-4", className)}>
      <div>
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-36 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="h-10 bg-muted animate-pulse rounded" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-5 w-12 bg-muted animate-pulse rounded-full" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export { AttendanceHeader, AttendanceHeaderSkeleton };
