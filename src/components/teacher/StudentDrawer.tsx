"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Star, BarChart3, Trophy, User, Coins, Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentProfileTab } from "./StudentProfileTab";
import { StudentPointsTab } from "./StudentPointsTab";
import { StudentAttendanceTab } from "./StudentAttendanceTab";

export interface StudentDetails {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  userCode?: string | null;
  className: string;
  churchName: string;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  notes?: string | null;
  pointsBalance: number;
  attendanceRate: number;
  activitiesCount: number;
}

export interface StudentDrawerProps {
  /** Student data to display */
  student: StudentDetails | null;
  /** Whether the drawer is open */
  open: boolean;
  /** Called when drawer open state changes */
  onOpenChange: (open: boolean) => void;
  /** Initial tab to show */
  initialTab?: "profile" | "points" | "attendance";
  /** Loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * StudentDrawer - Slide-up drawer showing student details.
 * Opens as bottom sheet on mobile, side drawer on desktop.
 */
function StudentDrawer({
  student,
  open,
  onOpenChange,
  initialTab = "profile",
  loading = false,
  className,
}: StudentDrawerProps) {
  const t = useTranslations("teacher.studentDrawer");
  const [activeTab, setActiveTab] = React.useState(initialTab);

  // Reset tab when student changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [student?.id, initialTab]);

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

  // Determine side based on screen size (bottom for mobile, right for desktop)
  // We use a media query approach with CSS, but Sheet needs a static side prop
  // For now, use bottom sheet for all sizes for simplicity
  const sheetSide = "bottom";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
        className={cn(
          "h-[85vh] max-h-[85vh] rounded-t-2xl p-0",
          className
        )}
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {loading ? (
          <StudentDrawerSkeleton />
        ) : student ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <SheetHeader className="px-4 pb-4 border-b">
              <div className="flex items-center gap-4">
                <OptimizedAvatar
                  src={student.avatarUrl}
                  alt={student.fullName}
                  fallback={getInitials(student.fullName)}
                  size="lg"
                  className="h-16 w-16"
                />
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg truncate">
                    {student.fullName}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground truncate">
                    {student.className}
                  </p>
                  {student.userCode && (
                    <Badge variant="secondary" className="mt-1 font-mono text-xs">
                      {student.userCode}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="flex items-center justify-around mt-4 pt-4 border-t">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Star className="h-4 w-4" aria-hidden="true" />
                    <span className="font-bold">{student.pointsBalance}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("points")}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={cn("flex items-center gap-1", getAttendanceColor(student.attendanceRate))}>
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    <span className="font-bold">{student.attendanceRate}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("attendance")}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <Trophy className="h-4 w-4" aria-hidden="true" />
                    <span className="font-bold">{student.activitiesCount}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("activities")}
                  </span>
                </div>
              </div>
            </SheetHeader>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="w-full justify-around rounded-none border-b bg-transparent h-12">
                <TabsTrigger
                  value="profile"
                  className="flex-1 gap-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("profile")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="points"
                  className="flex-1 gap-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Coins className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("points")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="flex-1 gap-1.5 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("attendance")}</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="profile" className="m-0 p-4">
                  <StudentProfileTab student={student} />
                </TabsContent>
                <TabsContent value="points" className="m-0 p-4">
                  <StudentPointsTab studentId={student.id} />
                </TabsContent>
                <TabsContent value="attendance" className="m-0 p-4">
                  <StudentAttendanceTab studentId={student.id} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/**
 * StudentDrawerSkeleton - Loading state for StudentDrawer
 */
function StudentDrawerSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex justify-around pt-4 border-t">
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-12 w-16" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export { StudentDrawer, StudentDrawerSkeleton };
