"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, TrendingUp, Users, Calendar, PieChart } from "lucide-react";
import { toast } from "sonner";
import { getClassAttendanceAction } from "../actions";

interface ClassInfo {
  id: string;
  name: string;
  churches: { name: string } | null;
}

interface AttendanceStatsClientProps {
  classes: ClassInfo[];
  userRole: string;
}

interface StudentStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalDays: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  attendanceRate: number;
}

export default function AttendanceStatsClient({
  classes,
  userRole,
}: AttendanceStatsClientProps) {
  const t = useTranslations();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Set default start date to 30 days ago
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  async function loadStatistics() {
    if (!selectedClassId) {
      toast.error(t("attendance.selectClassFirst"));
      return;
    }

    setIsLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const studentMap = new Map<string, StudentStats>();

      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split("T")[0];
        const result = await getClassAttendanceAction(
          selectedClassId,
          dateString
        );

        if (result.success && result.data) {
          result.data.forEach((record: any) => {
            const userId = record.user_id;

            if (!studentMap.has(userId)) {
              studentMap.set(userId, {
                userId,
                userName: record.user.full_name || record.user.email,
                userEmail: record.user.email,
                totalDays: 0,
                present: 0,
                absent: 0,
                excused: 0,
                late: 0,
                attendanceRate: 0,
              });
            }

            const stats = studentMap.get(userId)!;
            stats.totalDays++;

            if (record.status === "present") stats.present++;
            else if (record.status === "absent") stats.absent++;
            else if (record.status === "excused") stats.excused++;
            else if (record.status === "late") stats.late++;
          });
        }
      }

      // Calculate attendance rates
      const statsArray = Array.from(studentMap.values()).map((stat) => ({
        ...stat,
        attendanceRate:
          stat.totalDays > 0
            ? Math.round(((stat.present + stat.late) / stat.totalDays) * 100)
            : 0,
      }));

      // Sort by attendance rate (lowest first)
      statsArray.sort((a, b) => a.attendanceRate - b.attendanceRate);

      setStudentStats(statsArray);
    } catch (error) {
      console.error("Error loading statistics:", error);
      toast.error(t("attendance.failedToLoadStats"));
    } finally {
      setIsLoading(false);
    }
  }

  const overallStats = {
    totalStudents: studentStats.length,
    averageAttendance:
      studentStats.length > 0
        ? Math.round(
            studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) /
              studentStats.length
          )
        : 0,
    totalRecords: studentStats.reduce((sum, s) => sum + s.totalDays, 0),
    totalPresent: studentStats.reduce((sum, s) => sum + s.present, 0),
    totalAbsent: studentStats.reduce((sum, s) => sum + s.absent, 0),
    totalExcused: studentStats.reduce((sum, s) => sum + s.excused, 0),
    totalLate: studentStats.reduce((sum, s) => sum + s.late, 0),
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  function getAttendanceColor(rate: number): string {
    if (rate >= 90) return "bg-green-500";
    if (rate >= 75) return "bg-yellow-500";
    if (rate >= 60) return "bg-orange-500";
    return "bg-red-500";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("attendance.statistics")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("attendance.statsDescription")}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            {t("attendance.selectPeriod")}
          </CardTitle>
          <CardDescription>
            {t("attendance.selectPeriodDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("classes.class")}</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
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
              <Label>{t("attendance.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("attendance.endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <Button
            onClick={loadStatistics}
            disabled={!selectedClassId || isLoading}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {isLoading ? t("common.loading") : t("attendance.generateStats")}
          </Button>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      {studentStats.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("attendance.totalStudents")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {overallStats.totalStudents}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t("attendance.averageAttendance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {overallStats.averageAttendance}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("attendance.totalRecords")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {overallStats.totalRecords}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  {t("attendance.statusBreakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap text-sm">
                  <Badge className="bg-green-500">
                    P: {overallStats.totalPresent}
                  </Badge>
                  <Badge variant="destructive">
                    A: {overallStats.totalAbsent}
                  </Badge>
                  <Badge className="bg-yellow-500">
                    E: {overallStats.totalExcused}
                  </Badge>
                  <Badge className="bg-orange-500">
                    L: {overallStats.totalLate}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>{t("attendance.studentStatistics")}</CardTitle>
              <CardDescription>
                {t("attendance.studentStatsFor")} {selectedClass?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentStats.map((stat) => (
                  <div
                    key={stat.userId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stat.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat.userEmail}
                        </p>
                      </div>
                      <Badge
                        className={getAttendanceColor(stat.attendanceRate)}
                      >
                        {stat.attendanceRate}%
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("attendance.attendanceRate")}
                        </span>
                        <span className="font-medium">
                          {stat.attendanceRate}%
                        </span>
                      </div>
                      <Progress value={stat.attendanceRate} className="h-2" />
                    </div>

                    <div className="flex gap-2 flex-wrap text-sm">
                      <Badge variant="outline">
                        {t("attendance.total")}: {stat.totalDays}
                      </Badge>
                      <Badge className="bg-green-500">
                        {t("attendance.present")}: {stat.present}
                      </Badge>
                      <Badge variant="destructive">
                        {t("attendance.absent")}: {stat.absent}
                      </Badge>
                      <Badge className="bg-yellow-500">
                        {t("attendance.excused")}: {stat.excused}
                      </Badge>
                      <Badge className="bg-orange-500">
                        {t("attendance.late")}: {stat.late}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {studentStats.length === 0 && !isLoading && selectedClassId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("attendance.noStatsFound")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
