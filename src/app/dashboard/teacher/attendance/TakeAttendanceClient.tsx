"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Save, Loader2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AttendanceHeader,
  AttendanceStudentRow,
  StudentDrawer,
  type AttendanceStatus,
  type AttendanceStats,
} from "@/components/teacher";
import { useStudentDrawer } from "@/hooks/useStudentDrawer";
import {
  type ClassAttendanceData,
  type SaveAttendanceInput,
  saveAttendance,
} from "./actions";

interface TakeAttendanceClientProps {
  initialData: ClassAttendanceData;
}

interface AttendanceState {
  [studentId: string]: {
    status: AttendanceStatus | null;
    notes: string;
  };
}

export function TakeAttendanceClient({ initialData }: TakeAttendanceClientProps) {
  const t = useTranslations("teacher.attendance");
  const router = useRouter();
  const { student, isOpen, isLoading, openDrawer, setIsOpen } = useStudentDrawer();

  // Initialize state from initial data
  const [attendanceState, setAttendanceState] = React.useState<AttendanceState>(() => {
    const state: AttendanceState = {};
    for (const record of initialData.records) {
      state[record.studentId] = {
        status: record.status,
        notes: record.notes,
      };
    }
    return state;
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Track if there are unsaved changes
  const hasChanges = React.useMemo(() => {
    for (const record of initialData.records) {
      const current = attendanceState[record.studentId];
      if (current?.status !== record.status || current?.notes !== record.notes) {
        return true;
      }
    }
    return false;
  }, [attendanceState, initialData.records]);

  // Calculate stats
  const stats: AttendanceStats = React.useMemo(() => {
    let marked = 0;
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;

    for (const studentId of Object.keys(attendanceState)) {
      const status = attendanceState[studentId]?.status;
      if (status) {
        marked++;
        switch (status) {
          case "present":
            present++;
            break;
          case "absent":
            absent++;
            break;
          case "excused":
            excused++;
            break;
          case "late":
            late++;
            break;
        }
      }
    }

    return {
      total: initialData.records.length,
      marked,
      present,
      absent,
      excused,
      late,
    };
  }, [attendanceState, initialData.records.length]);

  const handleStatusChange = React.useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendanceState((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status,
        },
      }));
      setSaveError(null);
    },
    []
  );

  const handleNotesChange = React.useCallback(
    (studentId: string, notes: string) => {
      setAttendanceState((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          notes,
        },
      }));
    },
    []
  );

  const handleMarkAllPresent = React.useCallback(() => {
    setAttendanceState((prev) => {
      const newState = { ...prev };
      for (const record of initialData.records) {
        newState[record.studentId] = {
          ...newState[record.studentId],
          status: "present",
        };
      }
      return newState;
    });
    setSaveError(null);
  }, [initialData.records]);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    const records: SaveAttendanceInput["records"] = [];
    for (const studentId of Object.keys(attendanceState)) {
      const record = attendanceState[studentId];
      if (record?.status) {
        records.push({
          studentId,
          status: record.status,
          notes: record.notes || undefined,
        });
      }
    }

    const input: SaveAttendanceInput = {
      classId: initialData.classId,
      date: initialData.date,
      records,
    };

    const result = await saveAttendance(input);

    setIsSaving(false);

    if (result.success) {
      router.push("/dashboard/teacher");
    } else {
      setSaveError(result.error || t("saveError"));
    }
  }, [attendanceState, initialData.classId, initialData.date, router, t]);

  const allMarkedPresent = stats.marked === stats.total && stats.present === stats.total;

  return (
    <>
      <div className="space-y-4">
        {/* Header with stats */}
        <AttendanceHeader
          className={initialData.className}
          date={new Date(initialData.date)}
          stats={stats}
          onMarkAllPresent={handleMarkAllPresent}
          allMarkedPresent={allMarkedPresent}
          disabled={isSaving}
        />

        {/* Error message */}
        {saveError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Student List */}
        <div className="space-y-2">
          {initialData.records.map((record) => (
            <AttendanceStudentRow
              key={record.studentId}
              studentId={record.studentId}
              studentName={record.studentName}
              avatarUrl={record.avatarUrl}
              status={attendanceState[record.studentId]?.status || null}
              notes={attendanceState[record.studentId]?.notes || ""}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              onStudentClick={openDrawer}
              disabled={isSaving}
            />
          ))}
        </div>

        {/* Sticky Save Button */}
        <div className="sticky bottom-20 pt-4">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving || stats.marked === 0}
            className={cn(
              "w-full h-14 text-base font-medium shadow-lg",
              stats.marked === stats.total && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {t("saveAttendance")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Student Drawer */}
      <StudentDrawer
        student={student}
        open={isOpen}
        onOpenChange={setIsOpen}
        loading={isLoading}
      />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unsavedChangesTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsavedChangesDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push("/dashboard/teacher")}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("discardChanges")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
