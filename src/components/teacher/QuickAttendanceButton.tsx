"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight, ChevronDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export interface ClassSummary {
  id: string;
  name: string;
  churchName?: string;
}

export interface QuickAttendanceButtonProps {
  /** List of classes the teacher is assigned to */
  classes: ClassSummary[];
  /** Custom label (defaults to "Take Attendance") */
  label?: string;
  /** Show loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * QuickAttendanceButton - Primary CTA for taking attendance.
 * Shows a dropdown if teacher has multiple classes, or navigates directly if single class.
 *
 * @example
 * ```tsx
 * <QuickAttendanceButton
 *   classes={[{ id: "1", name: "Grade 5", churchName: "St. Mark" }]}
 *   label="Take Attendance"
 * />
 * ```
 */
function QuickAttendanceButton({
  classes,
  label = "Take Attendance",
  loading = false,
  className,
}: QuickAttendanceButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleClassSelect = React.useCallback(
    (classId: string) => {
      setIsNavigating(true);
      router.push(`/dashboard/teacher/attendance?classId=${classId}`);
    },
    [router]
  );

  const handleSingleClick = React.useCallback(() => {
    if (classes.length === 1) {
      handleClassSelect(classes[0].id);
    }
  }, [classes, handleClassSelect]);

  if (loading) {
    return <QuickAttendanceButtonSkeleton className={className} />;
  }

  // No classes assigned
  if (classes.length === 0) {
    return (
      <Button
        data-slot="quick-attendance-button"
        variant="outline"
        size="lg"
        disabled
        className={cn(
          "w-full h-14 text-base font-medium gap-3",
          className
        )}
      >
        <ClipboardList className="h-5 w-5" aria-hidden="true" />
        <span>No Classes Assigned</span>
      </Button>
    );
  }

  // Single class - direct navigation
  if (classes.length === 1) {
    return (
      <Button
        data-slot="quick-attendance-button"
        size="lg"
        onClick={handleSingleClick}
        disabled={isNavigating}
        className={cn(
          "w-full h-14 text-base font-medium gap-3 shadow-md",
          "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
          "transition-all duration-200",
          className
        )}
      >
        {isNavigating ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
        )}
        <span className="flex-1 text-start">{label}</span>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </Button>
    );
  }

  // Multiple classes - dropdown selector
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-slot="quick-attendance-button"
          size="lg"
          disabled={isNavigating}
          className={cn(
            "w-full h-14 text-base font-medium gap-3 shadow-md",
            "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
            "transition-all duration-200",
            className
          )}
        >
          {isNavigating ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="flex-1 text-start">{label}</span>
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {classes.map((cls) => (
          <DropdownMenuItem
            key={cls.id}
            onClick={() => handleClassSelect(cls.id)}
            className="cursor-pointer py-3"
          >
            <div className="flex flex-col">
              <span className="font-medium">{cls.name}</span>
              {cls.churchName && (
                <span className="text-xs text-muted-foreground">
                  {cls.churchName}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * QuickAttendanceButtonSkeleton - Loading state for QuickAttendanceButton
 */
function QuickAttendanceButtonSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      data-slot="quick-attendance-button-skeleton"
      className={cn("w-full h-14 rounded-md", className)}
    />
  );
}

export { QuickAttendanceButton, QuickAttendanceButtonSkeleton };
