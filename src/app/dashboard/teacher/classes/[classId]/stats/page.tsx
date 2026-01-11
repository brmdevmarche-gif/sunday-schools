import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  Calendar,
} from "lucide-react";

import { getClassStats, getClassInfo } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TeacherBottomNav,
  TeacherBottomNavSpacer,
} from "@/components/teacher";
import { getTeacherDashboardData } from "../../../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassStatsPage({ params }: PageProps) {
  const { classId } = await params;
  const t = await getTranslations("teacher.classes");

  // Fetch data in parallel
  const [classInfo, stats, dashboardData] = await Promise.all([
    getClassInfo(classId),
    getClassStats(classId),
    getTeacherDashboardData(),
  ]);

  if (!classInfo || !stats) {
    notFound();
  }

  const pendingCount = dashboardData?.stats.pendingCount || 0;
  const unreadAnnouncements = dashboardData?.unreadAnnouncementsCount || 0;
  const isOrganizingTrips = dashboardData?.isOrganizingTrips || false;

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getAttendanceTextColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 dark:text-green-400";
    if (rate >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Link
            href="/dashboard/teacher/classes"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={t("backToClasses")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{classInfo.name}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {t("stats")} - {t("last30Days")}
            </p>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("students")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    stats.averageAttendance >= 80
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : stats.averageAttendance >= 60
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  <BarChart3 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageAttendance}%</p>
                  <p className="text-xs text-muted-foreground">
                    {t("avgAttendance")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-2">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Star className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPointsAwarded}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("pointsAwarded")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              {t("attendanceByDay")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.attendanceByDay.map((day) => (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="w-10 text-sm font-medium text-muted-foreground">
                    {day.day}
                  </span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getAttendanceColor(day.rate)}`}
                      style={{ width: `${day.rate}%` }}
                    />
                  </div>
                  <span
                    className={`w-12 text-right text-sm font-medium ${getAttendanceTextColor(
                      day.rate
                    )}`}
                  >
                    {day.rate}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top/Bottom Attendees */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
                {t("topAttendees")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topAttendees.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              ) : (
                <div className="space-y-2">
                  {stats.topAttendees.map((student, index) => (
                    <div
                      key={`top-${index}`}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm truncate max-w-[150px]">
                          {student.name}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${getAttendanceTextColor(
                          student.rate
                        )}`}
                      >
                        {student.rate}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-5 w-5 text-red-600" aria-hidden="true" />
                {t("bottomAttendees")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.bottomAttendees.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noData")}</p>
              ) : (
                <div className="space-y-2">
                  {stats.bottomAttendees.map((student, index) => (
                    <div
                      key={`bottom-${index}`}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm truncate max-w-[180px]">
                        {student.name}
                      </span>
                      <span
                        className={`text-sm font-medium ${getAttendanceTextColor(
                          student.rate
                        )}`}
                      >
                        {student.rate}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <TeacherBottomNav
        pendingCount={pendingCount}
        unreadAnnouncementsCount={unreadAnnouncements}
        isOrganizingTrips={isOrganizingTrips}
      />
      <TeacherBottomNavSpacer />
    </div>
  );
}
