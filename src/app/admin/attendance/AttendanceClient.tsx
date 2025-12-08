"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, AlertCircle, Clock, Save, Calendar } from "lucide-react";
import type { AttendanceStatus } from "@/lib/types/sunday-school";
import { markAttendanceAction, getClassAttendanceAction, bulkMarkAttendanceAction } from "./actions";
import { createClient } from "@/lib/supabase/client";

interface ClassInfo {
  id: string;
  name: string;
  church_id: string;
  churches: { name: string } | null;
}

interface AttendanceClientProps {
  classes: ClassInfo[];
  userRole: string;
}

interface Student {
  id: string;
  full_name: string | null;
  email: string;
}

interface AttendanceRecord {
  user_id: string;
  status: AttendanceStatus;
  notes: string;
}

export default function AttendanceClient({ classes, userRole }: AttendanceClientProps) {
  const t = useTranslations();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
      loadExistingAttendance(selectedClassId, selectedDate);
    } else {
      setStudents([]);
      setAttendance(new Map());
    }
  }, [selectedClassId, selectedDate]);

  async function loadStudents(classId: string) {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("class_assignments")
        .select(`
          user_id,
          users!class_assignments_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq("class_id", classId)
        .eq("assignment_type", "student")
        .eq("is_active", true);

      if (error) throw error;

      const studentList = data
        ?.map((a) => (a.users as unknown as Student))
        .filter(Boolean) || [];

      setStudents(studentList);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error(t("attendance.failedToLoadStudents"));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadExistingAttendance(classId: string, date: string) {
    try {
      const result = await getClassAttendanceAction(classId, date);

      if (result.success && result.data) {
        const attendanceMap = new Map<string, AttendanceRecord>();

        result.data.forEach((record: {user_id: string; status: AttendanceStatus; notes: string | null}) => {
          attendanceMap.set(record.user_id, {
            user_id: record.user_id,
            status: record.status,
            notes: record.notes || "",
          });
        });

        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  }

  function handleStatusChange(userId: string, status: AttendanceStatus) {
    const existing = attendance.get(userId);
    setAttendance(new Map(attendance.set(userId, {
      user_id: userId,
      status,
      notes: existing?.notes || "",
    })));
  }

  function handleNotesChange(userId: string, notes: string) {
    const existing = attendance.get(userId);
    if (existing) {
      setAttendance(new Map(attendance.set(userId, {
        ...existing,
        notes,
      })));
    }
  }

  async function handleSave() {
    if (!selectedClassId || attendance.size === 0) {
      toast.error(t("attendance.noRecordsToSave"));
      return;
    }

    setIsSaving(true);
    try {
      const records = Array.from(attendance.values()).map((record) => ({
        class_id: selectedClassId,
        user_id: record.user_id,
        attendance_date: selectedDate,
        status: record.status,
        notes: record.notes || undefined,
      }));

      await bulkMarkAttendanceAction(records);
      toast.success(t("attendance.savedSuccessfully"));
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(t("attendance.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  function handleMarkAll(status: AttendanceStatus) {
    const newAttendance = new Map(attendance);
    students.forEach((student) => {
      const existing = newAttendance.get(student.id);
      newAttendance.set(student.id, {
        user_id: student.id,
        status,
        notes: existing?.notes || "",
      });
    });
    setAttendance(newAttendance);
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const stats = {
    total: students.length,
    marked: attendance.size,
    present: Array.from(attendance.values()).filter((a) => a.status === "present").length,
    absent: Array.from(attendance.values()).filter((a) => a.status === "absent").length,
    excused: Array.from(attendance.values()).filter((a) => a.status === "excused").length,
    late: Array.from(attendance.values()).filter((a) => a.status === "late").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("attendance.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("attendance.description")}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("attendance.selectClassAndDate")}</CardTitle>
          <CardDescription>{t("attendance.selectClassDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("classes.class")}</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("attendance.selectClass")} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.churches && `- ${cls.churches.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("common.date")}</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {selectedClassId && (
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t("attendance.totalStudents")}: {stats.total}</Badge>
                <Badge variant="outline">{t("attendance.marked")}: {stats.marked}/{stats.total}</Badge>
              </div>
              {stats.marked > 0 && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">{t("attendance.present")}: {stats.present}</Badge>
                  <Badge variant="destructive">{t("attendance.absent")}: {stats.absent}</Badge>
                  <Badge className="bg-yellow-500">{t("attendance.excused")}: {stats.excused}</Badge>
                  <Badge className="bg-orange-500">{t("attendance.late")}: {stats.late}</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedClassId && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("attendance.quickActions")}</CardTitle>
            <CardDescription>{t("attendance.quickActionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("present")}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {t("attendance.markAllPresent")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("absent")}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {t("attendance.markAllAbsent")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("excused")}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                {t("attendance.markAllExcused")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("late")}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                {t("attendance.markAllLate")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Roster */}
      {selectedClassId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("attendance.studentRoster")}</CardTitle>
                <CardDescription>
                  {selectedClass?.name} - {new Date(selectedDate).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button onClick={handleSave} disabled={isSaving || attendance.size === 0} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("attendance.noStudents")}
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => {
                  const record = attendance.get(student.id);
                  const status = record?.status;

                  return (
                    <div
                      key={student.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.full_name || student.email}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={status === "present" ? "default" : "outline"}
                            onClick={() => handleStatusChange(student.id, "present")}
                            className={status === "present" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "absent" ? "destructive" : "outline"}
                            onClick={() => handleStatusChange(student.id, "absent")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "excused" ? "default" : "outline"}
                            onClick={() => handleStatusChange(student.id, "excused")}
                            className={status === "excused" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "late" ? "default" : "outline"}
                            onClick={() => handleStatusChange(student.id, "late")}
                            className={status === "late" ? "bg-orange-500 hover:bg-orange-600" : ""}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {status && (
                        <Input
                          placeholder={t("attendance.addNotes")}
                          value={record?.notes || ""}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedClassId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("attendance.selectClassToStart")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
