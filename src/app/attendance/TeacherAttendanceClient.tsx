"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Check,
  X,
  AlertCircle,
  Clock,
  Save,
  Calendar,
  LogOut,
  Home,
  Menu,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";
import {
  getClassAttendanceAction,
  bulkMarkAttendanceAction,
  getClassStudentsAction,
} from "../admin/attendance/actions";
import { signOut } from "@/lib/auth";

interface ClassInfo {
  id: string;
  name: string;
  church_id: string;
  churches: { name: string } | null;
}

interface TeacherAttendanceClientProps {
  classes: ClassInfo[];
  userRole: string;
  userName: string;
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

export default function TeacherAttendanceClient({
  classes,
  userRole,
  userName,
}: TeacherAttendanceClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classPopoverOpen, setClassPopoverOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Auto-select first class if only one class
  useEffect(() => {
    if (classes.length === 1 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

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
      const result = await getClassStudentsAction(classId);

      if (result.success && result.data) {
        setStudents(result.data);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error(t("attendance.failedToLoadStudents"));
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadExistingAttendance(classId: string, date: string) {
    try {
      const result = await getClassAttendanceAction(classId, date);

      if (result.success && result.data) {
        const attendanceMap = new Map<string, AttendanceRecord>();

        result.data.forEach(
          (record: {
            user_id: string;
            status: AttendanceStatus;
            notes: string | null;
          }) => {
            attendanceMap.set(record.user_id, {
              user_id: record.user_id,
              status: record.status,
              notes: record.notes || "",
            });
          }
        );

        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  }

  function handleStatusChange(userId: string, status: AttendanceStatus) {
    const existing = attendance.get(userId);
    setAttendance(
      new Map(
        attendance.set(userId, {
          user_id: userId,
          status,
          notes: existing?.notes || "",
        })
      )
    );
  }

  function handleNotesChange(userId: string, notes: string) {
    const existing = attendance.get(userId);
    if (existing) {
      setAttendance(
        new Map(
          attendance.set(userId, {
            ...existing,
            notes,
          })
        )
      );
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

  async function handleLogout() {
    try {
      await signOut();
      toast.success(t("nav.logout"));
      router.push("/login");
    } catch {
      toast.error(t("errors.serverError"));
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const stats = {
    total: students.length,
    marked: attendance.size,
    present: Array.from(attendance.values()).filter(
      (a) => a.status === "present"
    ).length,
    absent: Array.from(attendance.values()).filter((a) => a.status === "absent")
      .length,
    excused: Array.from(attendance.values()).filter(
      (a) => a.status === "excused"
    ).length,
    late: Array.from(attendance.values()).filter((a) => a.status === "late")
      .length,
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              {t("attendance.quickAttendance")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.dashboard")}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="gap-2"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMenu && (
          <div className="border-t bg-card">
            <div className="container mx-auto px-4 py-3 space-y-2">
              <div className="text-sm text-muted-foreground">
                {t("common.welcome")}, {userName}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Class and Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t("attendance.selectClassAndDate")}</CardTitle>
            <CardDescription>
              {t("attendance.teacherSelectDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("classes.class")}</Label>
                <Popover open={classPopoverOpen} onOpenChange={setClassPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={classPopoverOpen}
                      className="w-full justify-between font-normal h-12 text-base"
                    >
                      {selectedClassId
                        ? classes.find((cls) => cls.id === selectedClassId)?.name +
                          (classes.find((cls) => cls.id === selectedClassId)?.churches
                            ? ` - ${classes.find((cls) => cls.id === selectedClassId)?.churches?.name}`
                            : "")
                        : t("attendance.selectClass")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("common.search")} />
                      <CommandList>
                        <CommandEmpty>{t("common.noResults")}</CommandEmpty>
                        <CommandGroup>
                          {classes.map((cls) => (
                            <CommandItem
                              key={cls.id}
                              value={`${cls.name} ${cls.churches?.name || ""}`}
                              onSelect={() => {
                                setSelectedClassId(cls.id);
                                setClassPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClassId === cls.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {cls.name} {cls.churches && `- ${cls.churches.name}`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t("common.date")}</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="h-12 text-base"
                  />
                  <Calendar className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {selectedClassId && (
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge variant="outline" className="text-base py-1 px-3">
                  {t("attendance.totalStudents")}: {stats.total}
                </Badge>
                <Badge variant="outline" className="text-base py-1 px-3">
                  {t("attendance.marked")}: {stats.marked}/{stats.total}
                </Badge>
                {stats.marked > 0 && (
                  <>
                    <Badge className="bg-green-500 text-base py-1 px-3">
                      {t("attendance.present")}: {stats.present}
                    </Badge>
                    <Badge
                      variant="destructive"
                      className="text-base py-1 px-3"
                    >
                      {t("attendance.absent")}: {stats.absent}
                    </Badge>
                    <Badge className="bg-yellow-500 text-base py-1 px-3">
                      {t("attendance.excused")}: {stats.excused}
                    </Badge>
                    <Badge className="bg-orange-500 text-base py-1 px-3">
                      {t("attendance.late")}: {stats.late}
                    </Badge>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {selectedClassId && students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("attendance.quickActions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleMarkAll("present")}
                  className="gap-2 h-14 bg-green-50 hover:bg-green-100 border-green-200"
                >
                  <Check className="h-5 w-5" />
                  {t("attendance.allPresent")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleMarkAll("absent")}
                  className="gap-2 h-14 bg-red-50 hover:bg-red-100 border-red-200"
                >
                  <X className="h-5 w-5" />
                  {t("attendance.allAbsent")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleMarkAll("excused")}
                  className="gap-2 h-14 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                >
                  <AlertCircle className="h-5 w-5" />
                  {t("attendance.allExcused")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleMarkAll("late")}
                  className="gap-2 h-14 bg-orange-50 hover:bg-orange-100 border-orange-200"
                >
                  <Clock className="h-5 w-5" />
                  {t("attendance.allLate")}
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
                    {selectedClass?.name} -{" "}
                    {new Date(selectedDate).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || attendance.size === 0}
                  className="gap-2 h-12 px-6 text-base"
                  size="lg"
                >
                  <Save className="h-5 w-5" />
                  {isSaving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t("common.loading")}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("attendance.noStudents")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student, index) => {
                    const record = attendance.get(student.id);
                    const status = record?.status;

                    return (
                      <div
                        key={student.id}
                        className={`border-2 rounded-xl p-4 space-y-3 transition-all ${
                          status === "present"
                            ? "border-green-200 bg-green-500/10"
                            : status === "absent"
                            ? "border-red-200 bg-red-500/10"
                            : status === "excused"
                            ? "border-yellow-200 bg-yellow-500/10"
                            : status === "late"
                            ? "border-orange-200 bg-orange-500/10"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-base">
                              {index + 1}. {student.full_name || student.email}
                            </p>
                            {student.full_name && (
                              <p className="text-sm text-muted-foreground">
                                {student.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Button
                            size="lg"
                            variant={
                              status === "present" ? "default" : "outline"
                            }
                            onClick={() =>
                              handleStatusChange(student.id, "present")
                            }
                            className={`gap-2 h-12 ${
                              status === "present"
                                ? "bg-green-500 hover:bg-green-600"
                                : ""
                            }`}
                          >
                            <Check className="h-5 w-5" />
                            <span className="hidden sm:inline">
                              {t("attendance.present")}
                            </span>
                          </Button>
                          <Button
                            size="lg"
                            variant={
                              status === "absent" ? "destructive" : "outline"
                            }
                            onClick={() =>
                              handleStatusChange(student.id, "absent")
                            }
                            className="gap-2 h-12"
                          >
                            <X className="h-5 w-5" />
                            <span className="hidden sm:inline">
                              {t("attendance.absent")}
                            </span>
                          </Button>
                          <Button
                            size="lg"
                            variant={
                              status === "excused" ? "default" : "outline"
                            }
                            onClick={() =>
                              handleStatusChange(student.id, "excused")
                            }
                            className={`gap-2 h-12 ${
                              status === "excused"
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : ""
                            }`}
                          >
                            <AlertCircle className="h-5 w-5" />
                            <span className="hidden sm:inline">
                              {t("attendance.excused")}
                            </span>
                          </Button>
                          <Button
                            size="lg"
                            variant={status === "late" ? "default" : "outline"}
                            onClick={() =>
                              handleStatusChange(student.id, "late")
                            }
                            className={`gap-2 h-12 ${
                              status === "late"
                                ? "bg-orange-500 hover:bg-orange-600"
                                : ""
                            }`}
                          >
                            <Clock className="h-5 w-5" />
                            <span className="hidden sm:inline">
                              {t("attendance.late")}
                            </span>
                          </Button>
                        </div>

                        {status && (
                          <Input
                            placeholder={t("attendance.addNotes")}
                            value={record?.notes || ""}
                            onChange={(e) =>
                              handleNotesChange(student.id, e.target.value)
                            }
                            className="text-base h-11"
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

        {!selectedClassId && classes.length > 0 && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{t("attendance.selectClassToStart")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {classes.length === 0 && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{t("attendance.noClassesAssigned")}</p>
                <p className="text-sm mt-2">{t("attendance.contactAdmin")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Save Button for Mobile */}
      {selectedClassId && attendance.size > 0 && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="h-16 w-16 rounded-full shadow-lg"
          >
            <Save className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
