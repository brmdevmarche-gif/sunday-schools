"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Star, ChevronRight, ChevronLeft, Users } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  points_balance?: number;
  class_id?: string;
  class_name?: string;
}

interface TeacherClass {
  id: string;
  name: string;
  students_count?: number;
}

interface StudentSelectionGateProps {
  /** All students from teacher's classes */
  students: Student[];
  /** Teacher's classes for filtering */
  classes: TeacherClass[];
  /** The base path to navigate to with student selected (e.g., "/store") */
  basePath: string;
  /** Title for the selection card */
  title: string;
  /** Description for the selection card */
  description?: string;
  /** Icon to display (from lucide-react) */
  icon?: React.ReactNode;
}

/**
 * StudentSelectionGate - Requires teacher to select a student before proceeding.
 * Shows a searchable list of students from their classes.
 */
export function StudentSelectionGate({
  students,
  classes,
  basePath,
  title,
  description,
  icon,
}: StudentSelectionGateProps) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStudentSelect = (studentId: string) => {
    router.push(`${basePath}?for=${studentId}`);
  };

  // Filter students based on search and class
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesClass =
      selectedClass === "all" || student.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Group students by class for display
  const groupedByClass = filteredStudents.reduce(
    (acc, student) => {
      const classId = student.class_id || "unassigned";
      if (!acc[classId]) {
        acc[classId] = {
          className:
            student.class_name || t("teacher.students.unassigned"),
          students: [],
        };
      }
      acc[classId].students.push(student);
      return acc;
    },
    {} as Record<string, { className: string; students: Student[] }>
  );

  if (students.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <EmptyState
          icon="Users"
          title={t("teacher.students.noStudents")}
          description={t("teacher.students.noStudentsDescription")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          {icon && (
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {icon}
            </div>
          )}
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("teacher.students.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {classes.length > 1 && (
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue
                    placeholder={t("teacher.students.filterByClass")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("teacher.students.allClasses")}
                  </SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("teacher.students.noMatchingStudents")}</p>
            </div>
          ) : selectedClass === "all" && classes.length > 1 ? (
            // Grouped by class view
            <div className="space-y-6 max-h-[400px] overflow-y-auto">
              {Object.entries(groupedByClass).map(([classId, data]) => (
                <div key={classId}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{data.className}</Badge>
                    <span className="text-xs text-muted-foreground">
                      ({data.students.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {data.students.map((student) => (
                      <StudentRow
                        key={student.id}
                        student={student}
                        onSelect={handleStudentSelect}
                        ChevronIcon={ChevronIcon}
                        getInitials={getInitials}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat list view
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredStudents.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onSelect={handleStudentSelect}
                  ChevronIcon={ChevronIcon}
                  getInitials={getInitials}
                  t={t}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentRow({
  student,
  onSelect,
  ChevronIcon,
  getInitials,
  t,
}: {
  student: Student;
  onSelect: (id: string) => void;
  ChevronIcon: React.ElementType;
  getInitials: (name: string) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <button
      onClick={() => onSelect(student.id)}
      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <OptimizedAvatar
          src={student.avatar_url}
          alt={student.full_name}
          fallback={getInitials(student.full_name)}
          size="sm"
          className="h-10 w-10"
        />
        <div className="text-start">
          <p className="font-medium">{student.full_name}</p>
          {student.points_balance !== undefined && (
            <span className="flex items-center gap-1 text-sm text-amber-600">
              <Star className="h-3 w-3 fill-current" />
              {student.points_balance} {t("common.pts")}
            </span>
          )}
        </div>
      </div>
      <ChevronIcon className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
