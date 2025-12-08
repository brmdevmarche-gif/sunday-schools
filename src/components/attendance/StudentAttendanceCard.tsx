"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { AttendanceStatusButtons } from "./AttendanceStatusButtons";
import type { AttendanceStatus } from "@/lib/types/sunday-school";

interface Student {
  id: string;
  full_name: string | null;
  email: string;
}

interface AttendanceRecord {
  status: AttendanceStatus;
  notes: string;
}

interface StudentAttendanceCardProps {
  student: Student;
  record?: AttendanceRecord;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onNotesChange: (studentId: string, notes: string) => void;
  disabled?: boolean;
}

export function StudentAttendanceCard({
  student,
  record,
  onStatusChange,
  onNotesChange,
  disabled = false,
}: StudentAttendanceCardProps) {
  const t = useTranslations();

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{student.full_name || student.email}</p>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <AttendanceStatusButtons
          status={record?.status}
          onStatusChange={(status) => onStatusChange(student.id, status)}
          disabled={disabled}
        />
      </div>
      {record?.status && (
        <Input
          placeholder={t("attendance.addNotes")}
          value={record.notes || ""}
          onChange={(e) => onNotesChange(student.id, e.target.value)}
          className="text-sm"
          disabled={disabled}
        />
      )}
    </div>
  );
}
