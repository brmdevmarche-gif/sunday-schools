"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Users,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const classCardVariants = cva(
  "group relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: "",
        warning: "border-amber-500/50 dark:border-amber-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ClassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof classCardVariants> {
  /** Unique class ID */
  id: string;
  /** Class name */
  name: string;
  /** Church name */
  churchName: string;
  /** Number of students in class */
  studentCount: number;
  /** Last attendance date (ISO string) */
  lastAttendanceDate?: string | null;
  /** Whether attendance was taken this week */
  attendanceTakenThisWeek?: boolean;
  /** Show loading skeleton */
  loading?: boolean;
}

/**
 * ClassCard - Displays class overview with quick action buttons.
 * Used in the My Classes hub for teachers.
 *
 * @example
 * ```tsx
 * <ClassCard
 *   id="class-123"
 *   name="Grade 5"
 *   churchName="St. Mark Church"
 *   studentCount={15}
 *   lastAttendanceDate="2026-01-10"
 *   attendanceTakenThisWeek={true}
 * />
 * ```
 */
function ClassCard({
  className,
  variant,
  id,
  name,
  churchName,
  studentCount,
  lastAttendanceDate,
  attendanceTakenThisWeek = false,
  loading = false,
  ...props
}: ClassCardProps) {
  const router = useRouter();
  const t = useTranslations("teacher.classes");

  // Determine variant based on attendance status
  const effectiveVariant = !attendanceTakenThisWeek ? "warning" : variant;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  const handleRoster = () => {
    router.push(`/dashboard/teacher/classes/${id}/roster`);
  };

  const handleAttendance = () => {
    router.push(`/dashboard/teacher/attendance/${id}`);
  };

  const handleStats = () => {
    router.push(`/dashboard/teacher/classes/${id}/stats`);
  };

  if (loading) {
    return <ClassCardSkeleton className={className} />;
  }

  return (
    <Card
      data-slot="class-card"
      className={cn(classCardVariants({ variant: effectiveVariant, className }))}
      {...props}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">{name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {churchName}
              </p>
            </div>
          </div>

          {/* Attendance status badge */}
          {attendanceTakenThisWeek ? (
            <Badge
              variant="secondary"
              className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
              {t("attendanceDone")}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
              {t("attendancePending")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" aria-hidden="true" />
            {studentCount} {t("students")}
          </span>
          {lastAttendanceDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {t("lastAttendance")}: {formatDate(lastAttendanceDate)}
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRoster}
            className="min-h-11 flex-1"
          >
            <Users className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("roster")}
          </Button>
          <Button
            variant={!attendanceTakenThisWeek ? "default" : "outline"}
            size="sm"
            onClick={handleAttendance}
            className="min-h-11 flex-1"
          >
            <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("attendance")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStats}
            className="min-h-11 flex-1"
          >
            <BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("stats")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ClassCardSkeleton - Loading state for ClassCard
 */
function ClassCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      data-slot="class-card-skeleton"
      className={cn("", className)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export { ClassCard, ClassCardSkeleton, classCardVariants };
