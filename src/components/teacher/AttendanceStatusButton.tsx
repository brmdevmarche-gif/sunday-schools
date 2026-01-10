"use client";

import * as React from "react";
import { Check, X, AlertTriangle, Clock } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export type AttendanceStatus = "present" | "absent" | "excused" | "late";

const attendanceStatusButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5",
    "min-h-[44px] min-w-[44px] px-3",
    "rounded-lg font-medium text-sm",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95",
  ],
  {
    variants: {
      status: {
        present: "",
        absent: "",
        excused: "",
        late: "",
      },
      selected: {
        true: "shadow-md",
        false: "bg-muted/50 hover:bg-muted text-muted-foreground",
      },
    },
    compoundVariants: [
      {
        status: "present",
        selected: true,
        className: "bg-green-600 text-white hover:bg-green-700",
      },
      {
        status: "absent",
        selected: true,
        className: "bg-red-600 text-white hover:bg-red-700",
      },
      {
        status: "excused",
        selected: true,
        className: "bg-amber-500 text-white hover:bg-amber-600",
      },
      {
        status: "late",
        selected: true,
        className: "bg-orange-500 text-white hover:bg-orange-600",
      },
    ],
    defaultVariants: {
      selected: false,
    },
  }
);

const statusConfig: Record<
  AttendanceStatus,
  { icon: typeof Check; label: string; shortLabel: string }
> = {
  present: { icon: Check, label: "Present", shortLabel: "P" },
  absent: { icon: X, label: "Absent", shortLabel: "A" },
  excused: { icon: AlertTriangle, label: "Excused", shortLabel: "E" },
  late: { icon: Clock, label: "Late", shortLabel: "L" },
};

export interface AttendanceStatusButtonProps
  extends VariantProps<typeof attendanceStatusButtonVariants> {
  /** The status this button represents */
  status: AttendanceStatus;
  /** Whether this status is currently selected */
  selected?: boolean;
  /** Called when the button is clicked */
  onSelect: (status: AttendanceStatus) => void;
  /** Show icon only (compact mode) */
  iconOnly?: boolean;
  /** Show short label instead of full label */
  shortLabel?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * AttendanceStatusButton - A button for selecting attendance status.
 * Large touch targets (44px+) with clear visual states.
 *
 * @example
 * ```tsx
 * <AttendanceStatusButton
 *   status="present"
 *   selected={currentStatus === "present"}
 *   onSelect={setStatus}
 * />
 * ```
 */
function AttendanceStatusButton({
  status,
  selected = false,
  onSelect,
  iconOnly = false,
  shortLabel = false,
  className,
  disabled,
}: AttendanceStatusButtonProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const handleClick = React.useCallback(() => {
    onSelect(status);
  }, [onSelect, status]);

  const label = shortLabel ? config.shortLabel : config.label;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={config.label}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        attendanceStatusButtonVariants({ status, selected }),
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}

export interface AttendanceStatusGroupProps {
  /** Current selected status */
  value: AttendanceStatus | null;
  /** Called when status changes */
  onChange: (status: AttendanceStatus) => void;
  /** Show icons only */
  iconOnly?: boolean;
  /** Show short labels */
  shortLabel?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * AttendanceStatusGroup - A group of status buttons for attendance marking.
 *
 * @example
 * ```tsx
 * <AttendanceStatusGroup
 *   value={status}
 *   onChange={setStatus}
 * />
 * ```
 */
function AttendanceStatusGroup({
  value,
  onChange,
  iconOnly = false,
  shortLabel = false,
  disabled = false,
  className,
}: AttendanceStatusGroupProps) {
  const statuses: AttendanceStatus[] = ["present", "absent", "excused", "late"];

  return (
    <div
      role="radiogroup"
      aria-label="Attendance status"
      className={cn("flex gap-1", className)}
    >
      {statuses.map((status) => (
        <AttendanceStatusButton
          key={status}
          status={status}
          selected={value === status}
          onSelect={onChange}
          iconOnly={iconOnly}
          shortLabel={shortLabel}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export {
  AttendanceStatusButton,
  AttendanceStatusGroup,
  attendanceStatusButtonVariants,
  statusConfig,
};
