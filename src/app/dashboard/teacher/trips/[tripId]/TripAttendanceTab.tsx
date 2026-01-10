"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar, CheckCircle, AlertCircle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AttendanceStatusButton,
  AttendanceStudentRow,
  type AttendanceStatus,
} from "@/components/teacher";
import type { TripParticipantData } from "../actions";
import { saveTripAttendance } from "../actions";

interface TripAttendanceTabProps {
  tripId: string;
  participants: TripParticipantData[];
  canTakeAttendance: boolean;
  isTripToday: boolean;
}

interface AttendanceRecord {
  participantId: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  status: AttendanceStatus | null;
  notes: string;
}

export function TripAttendanceTab({
  tripId,
  participants,
  canTakeAttendance,
  isTripToday,
}: TripAttendanceTabProps) {
  const t = useTranslations("teacher.myTrips");
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Initialize attendance records from participants
  const [records, setRecords] = React.useState<AttendanceRecord[]>(() =>
    participants.map((p) => ({
      participantId: p.id,
      userId: p.userId,
      fullName: p.fullName,
      avatarUrl: p.avatarUrl,
      status: p.attendanceStatus,
      notes: p.attendanceNotes || "",
    }))
  );

  // Calculate stats
  const stats = React.useMemo(() => {
    const marked = records.filter((r) => r.status !== null).length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const excused = records.filter((r) => r.status === "excused").length;
    const late = records.filter((r) => r.status === "late").length;
    return { marked, present, absent, excused, late, total: records.length };
  }, [records]);

  const handleStatusChange = (participantId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.participantId === participantId ? { ...r, status } : r))
    );
    setHasChanges(true);
  };

  const handleNotesChange = (participantId: string, notes: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.participantId === participantId ? { ...r, notes } : r))
    );
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    setRecords((prev) =>
      prev.map((r) => (r.status === null ? { ...r, status: "present" } : r))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    const recordsToSave = records
      .filter((r) => r.status !== null)
      .map((r) => ({
        participantId: r.participantId,
        status: r.status!,
        notes: r.notes || undefined,
      }));

    if (recordsToSave.length === 0) {
      toast.error(t("noRecordsToSave"));
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveTripAttendance(tripId, recordsToSave);
      if (result.success) {
        toast.success(t("attendanceSaved"));
        setHasChanges(false);
      } else {
        toast.error(result.error || t("saveError"));
      }
    } catch {
      toast.error(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  // Show message if not trip day or no permission
  if (!canTakeAttendance) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t("cannotTakeAttendance")}
        description={t("noAttendancePermission")}
      />
    );
  }

  if (!isTripToday) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">{t("attendanceNotAvailable")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("attendanceOnTripDay")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (participants.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title={t("noApprovedParticipants")}
        description={t("noApprovedParticipantsDescription")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {t("attendanceProgress", {
            marked: stats.marked,
            total: stats.total,
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllPresent}
          disabled={stats.marked === stats.total}
        >
          {t("markAllPresent")}
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-3 text-sm">
        <span className="text-green-600 dark:text-green-400">
          {t("presentCount", { count: stats.present })}
        </span>
        <span className="text-red-600 dark:text-red-400">
          {t("absentCount", { count: stats.absent })}
        </span>
        <span className="text-amber-600 dark:text-amber-400">
          {t("excusedCount", { count: stats.excused })}
        </span>
        <span className="text-orange-600 dark:text-orange-400">
          {t("lateCount", { count: stats.late })}
        </span>
      </div>

      {/* Attendance List */}
      <div className="space-y-2">
        {records.map((record) => (
          <AttendanceStudentRow
            key={record.participantId}
            studentId={record.participantId}
            studentName={record.fullName}
            avatarUrl={record.avatarUrl}
            status={record.status}
            notes={record.notes}
            onStatusChange={(id, status) =>
              handleStatusChange(id, status)
            }
            onNotesChange={(id, notes) =>
              handleNotesChange(id, notes)
            }
          />
        ))}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-20 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 me-2" />
              {t("saveAttendance")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
