"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";

interface Student {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  points_balance?: number;
  class_id?: string;
  class_name?: string;
}

interface Class {
  id: string;
  name: string;
}

interface StudentSelectionGateProps {
  students: Student[];
  classes: Class[];
  basePath: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const classMap = useMemo(() => {
    const map = new Map<string, Class>();
    classes.forEach((cls) => map.set(cls.id, cls));
    return map;
  }, [classes]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filter by class
    if (selectedClassId) {
      filtered = filtered.filter((s) => s.class_id === selectedClassId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(query) ||
          s.class_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [students, selectedClassId, searchQuery]);

  function handleStudentSelect(studentId: string) {
    const url = new URL(basePath, window.location.origin);
    url.searchParams.set("for", studentId);
    router.push(url.pathname + url.search);
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-8">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.selectStudent")}</CardTitle>
          {students.length > 0 && (
            <CardDescription>
              {students.length} {students.length === 1 ? "student" : "students"} available
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.searchStudents")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {classes.length > 0 && (
              <div className="sm:w-48">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{t("common.allClasses")}</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Student List */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || selectedClassId
                ? t("common.noStudentsFound")
                : t("common.noStudentsAvailable")}
            </div>
          ) : (
            <div className="grid gap-2 max-h-[600px] overflow-y-auto">
              {filteredStudents.map((student) => (
                <Button
                  key={student.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-accent"
                  onClick={() => handleStudentSelect(student.id)}
                >
                  <div className="flex items-center gap-4 w-full">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback>
                        {student.full_name ? getInitials(student.full_name) : <Users className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{student.full_name}</div>
                      {student.class_name && (
                        <div className="text-sm text-muted-foreground">
                          {student.class_name}
                        </div>
                      )}
                    </div>
                    {student.points_balance !== undefined && (
                      <div className="text-sm font-medium text-amber-600">
                        {student.points_balance} {t("common.pts")}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
