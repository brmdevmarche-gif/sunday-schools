"use client";

import { Button } from "@/components/ui/button";
import { Check, X, AlertCircle, Clock } from "lucide-react";
import type { AttendanceStatus } from "@/lib/types";

interface AttendanceStatusButtonsProps {
  status?: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
}

export function AttendanceStatusButtons({
  status,
  onStatusChange,
  size = "sm",
  disabled = false,
}: AttendanceStatusButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        size={size}
        variant={status === "present" ? "default" : "outline"}
        onClick={() => onStatusChange("present")}
        disabled={disabled}
        className={
          status === "present" ? "bg-green-500 hover:bg-green-600" : ""
        }
        title="Present"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size={size}
        variant={status === "absent" ? "destructive" : "outline"}
        onClick={() => onStatusChange("absent")}
        disabled={disabled}
        title="Absent"
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        size={size}
        variant={status === "excused" ? "default" : "outline"}
        onClick={() => onStatusChange("excused")}
        disabled={disabled}
        className={
          status === "excused" ? "bg-yellow-500 hover:bg-yellow-600" : ""
        }
        title="Excused"
      >
        <AlertCircle className="h-4 w-4" />
      </Button>
      <Button
        size={size}
        variant={status === "late" ? "default" : "outline"}
        onClick={() => onStatusChange("late")}
        disabled={disabled}
        className={status === "late" ? "bg-orange-500 hover:bg-orange-600" : ""}
        title="Late"
      >
        <Clock className="h-4 w-4" />
      </Button>
    </div>
  );
}
