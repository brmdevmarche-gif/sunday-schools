"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Star,
  Flame,
  Trophy,
  GraduationCap,
  MapPin,
  Bus,
  BookOpen,
  FileText,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import type { ChildProfileData, ChildBadge } from "@/lib/types";

interface ChildProfileClientProps {
  childData: ChildProfileData;
}

export function ChildProfileClient({ childData }: ChildProfileClientProps) {
  const t = useTranslations("parents.childProfile");
  const { child, activity_summary, streaks, badges, attendance_summary } = childData;

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const totalAttendance = attendance_summary.present + attendance_summary.absent + attendance_summary.late;
  const attendanceRate =
    totalAttendance > 0
      ? Math.round((attendance_summary.present / totalAttendance) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/parents">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("title")}
        </Button>
      </Link>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <OptimizedAvatar
              src={child.avatar_url}
              alt={child.full_name || "Child"}
              fallback={getInitials(child.full_name)}
              size="xl"
              className="h-24 w-24 border-4 border-primary/10"
              fallbackClassName="text-2xl bg-primary/10 text-primary"
            />

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">
                {child.full_name || "Unnamed"}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-muted-foreground">
                {child.class_name && (
                  <Badge variant="secondary" className="gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {child.class_name}
                  </Badge>
                )}
                {child.church_name && (
                  <span className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {child.church_name}
                  </span>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-bold text-lg">
                    {child.points_balance}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("pointsBalance")}
                  </span>
                </div>
                {streaks.reading && streaks.reading.current_streak > 0 && (
                  <div className="flex items-center gap-2 text-orange-500">
                    <Flame className="h-5 w-5" />
                    <span className="font-bold">
                      {streaks.reading.current_streak}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t("currentStreak")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="activities">{t("activities")}</TabsTrigger>
          <TabsTrigger value="achievements">{t("achievements")}</TabsTrigger>
          <TabsTrigger value="attendance">{t("attendance")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <Bus className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activity_summary.trips.total}</p>
                    <p className="text-sm text-muted-foreground">{t("trips")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-500/10">
                    <Trophy className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {activity_summary.competitions.total}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("competitions")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/10">
                    <BookOpen className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activity_summary.readings.total}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("readings")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <FileText className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {activity_summary.spiritual_notes.total}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("spiritualNotes")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("attendanceRecord")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("attendance")}
                  </span>
                  <span className="font-bold text-lg">{attendanceRate}%</span>
                </div>
                <Progress value={attendanceRate} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {t("present")}: {attendance_summary.present}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    {t("absent")}: {attendance_summary.absent}
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <Clock className="h-4 w-4" />
                    {t("late")}: {attendance_summary.late}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>{t("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t("noRecentActivity")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t("badges")}
                <Badge variant="secondary">{badges.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No badges earned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center p-4 rounded-lg border bg-card text-center"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        {badge.icon}
                      </div>
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("attendanceRecord")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {attendance_summary.present}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("present")}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10">
                    <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    <p className="text-2xl font-bold text-red-600">
                      {attendance_summary.absent}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("absent")}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-500/10">
                    <Clock className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                    <p className="text-2xl font-bold text-amber-600">
                      {attendance_summary.late}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("late")}</p>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{t("attendance")}</span>
                    <span className="text-2xl font-bold">{attendanceRate}%</span>
                  </div>
                  <Progress value={attendanceRate} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
