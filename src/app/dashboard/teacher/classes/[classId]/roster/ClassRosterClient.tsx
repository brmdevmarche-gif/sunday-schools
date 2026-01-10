"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Star, BarChart3, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { StudentDrawer } from "@/components/teacher";
import { useStudentDrawer } from "@/hooks/useStudentDrawer";

interface Student {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  userCode?: string | null;
  pointsBalance: number;
  attendanceRate: number;
}

interface ClassRosterClientProps {
  students: Student[];
}

export function ClassRosterClient({ students }: ClassRosterClientProps) {
  const t = useTranslations("teacher.classes");
  const [searchQuery, setSearchQuery] = React.useState("");
  const { student, isOpen, isLoading, openDrawer, setIsOpen } = useStudentDrawer();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 dark:text-green-400";
    if (rate >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const filteredStudents = React.useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(query) ||
        s.userCode?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const handleStudentClick = (studentId: string) => {
    openDrawer(studentId);
  };

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          placeholder={t("searchStudents")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rtl:pl-3 rtl:pr-9"
          aria-label={t("searchStudents")}
        />
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.map((studentItem) => (
          <Card
            key={studentItem.id}
            className={cn(
              "group transition-all hover:shadow-md cursor-pointer",
              "active:scale-[0.99]"
            )}
            role="button"
            tabIndex={0}
            aria-label={`${t("viewStudent")}: ${studentItem.fullName}`}
            onClick={() => handleStudentClick(studentItem.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleStudentClick(studentItem.id);
              }
            }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              {/* Avatar */}
              <OptimizedAvatar
                src={studentItem.avatarUrl}
                alt={studentItem.fullName}
                fallback={getInitials(studentItem.fullName)}
                size="md"
                className="h-12 w-12"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{studentItem.fullName}</h3>
                {studentItem.userCode && (
                  <p className="text-sm text-muted-foreground font-mono">
                    {studentItem.userCode}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-sm">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                  {studentItem.pointsBalance}
                </Badge>
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    getAttendanceColor(studentItem.attendanceRate)
                  )}
                >
                  <BarChart3 className="h-3 w-3" aria-hidden="true" />
                  {studentItem.attendanceRate}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Drawer */}
      <StudentDrawer
        student={student}
        open={isOpen}
        onOpenChange={setIsOpen}
        loading={isLoading}
      />
    </>
  );
}
