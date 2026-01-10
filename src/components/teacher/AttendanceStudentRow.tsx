"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  AttendanceStatusGroup,
  type AttendanceStatus,
} from "./AttendanceStatusButton";

export interface AttendanceStudentRowProps {
  /** Student ID */
  studentId: string;
  /** Student full name */
  studentName: string;
  /** Student avatar URL */
  avatarUrl?: string | null;
  /** Current attendance status */
  status: AttendanceStatus | null;
  /** Current notes for this record */
  notes?: string;
  /** Called when status changes */
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  /** Called when notes change */
  onNotesChange: (studentId: string, notes: string) => void;
  /** Called when student name/avatar is clicked */
  onStudentClick?: (studentId: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * AttendanceStudentRow - A row for marking a student's attendance.
 * Displays avatar, name, status buttons, and collapsible notes field.
 *
 * @example
 * ```tsx
 * <AttendanceStudentRow
 *   studentId="1"
 *   studentName="Ahmed Hassan"
 *   avatarUrl="/path/to/avatar.jpg"
 *   status="present"
 *   onStatusChange={(id, status) => updateStatus(id, status)}
 *   onNotesChange={(id, notes) => updateNotes(id, notes)}
 * />
 * ```
 */
function AttendanceStudentRow({
  studentId,
  studentName,
  avatarUrl,
  status,
  notes = "",
  onStatusChange,
  onNotesChange,
  onStudentClick,
  disabled = false,
  className,
}: AttendanceStudentRowProps) {
  const t = useTranslations("teacher.attendance");
  const [isNotesOpen, setIsNotesOpen] = React.useState(!!notes);
  const [localNotes, setLocalNotes] = React.useState(notes);

  // Update local notes when prop changes
  React.useEffect(() => {
    setLocalNotes(notes);
    if (notes) {
      setIsNotesOpen(true);
    }
  }, [notes]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStatusChange = React.useCallback(
    (newStatus: AttendanceStatus) => {
      onStatusChange(studentId, newStatus);
    },
    [studentId, onStatusChange]
  );

  const handleNotesBlur = React.useCallback(() => {
    if (localNotes !== notes) {
      onNotesChange(studentId, localNotes);
    }
  }, [studentId, localNotes, notes, onNotesChange]);

  const handleStudentClick = React.useCallback(() => {
    onStudentClick?.(studentId);
  }, [studentId, onStudentClick]);

  return (
    <Card
      data-slot="attendance-student-row"
      className={cn(
        "transition-all",
        status && "border-l-4",
        status === "present" && "border-l-green-500",
        status === "absent" && "border-l-red-500",
        status === "excused" && "border-l-amber-500",
        status === "late" && "border-l-orange-500",
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Student Avatar & Name */}
          <button
            type="button"
            onClick={handleStudentClick}
            disabled={!onStudentClick}
            className={cn(
              "flex items-center gap-3 min-w-0 flex-1",
              onStudentClick &&
                "hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            )}
          >
            <OptimizedAvatar
              src={avatarUrl}
              alt={studentName}
              fallback={getInitials(studentName)}
              size="sm"
              className="h-10 w-10 shrink-0"
            />
            <span className="font-medium text-sm truncate">{studentName}</span>
          </button>

          {/* Status Buttons */}
          <AttendanceStatusGroup
            value={status}
            onChange={handleStatusChange}
            iconOnly
            disabled={disabled}
          />

          {/* Notes Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={cn(
              "h-10 w-10 shrink-0",
              localNotes && "text-primary"
            )}
            aria-label={t("toggleNotes")}
            aria-expanded={isNotesOpen}
          >
            {isNotesOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Notes Field */}
        {isNotesOpen && (
          <div className="mt-3 pt-3 border-t">
            <Textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder={t("notesPlaceholder")}
              disabled={disabled}
              rows={2}
              className="text-sm resize-none"
              aria-label={t("notesLabel")}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * AttendanceStudentRowSkeleton - Loading state for AttendanceStudentRow
 */
function AttendanceStudentRowSkeleton({ className }: { className?: string }) {
  return (
    <Card data-slot="attendance-student-row-skeleton" className={className}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-11 w-11 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export { AttendanceStudentRow, AttendanceStudentRowSkeleton };
