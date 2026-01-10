"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Check,
  X,
  AlertTriangle,
  Clock,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "excused" | "late";
  notes?: string;
}

interface AttendanceData {
  rate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  records: AttendanceRecord[];
}

interface StudentAttendanceTabProps {
  studentId: string;
  className?: string;
}

const statusConfig = {
  present: {
    icon: Check,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "present",
  },
  absent: {
    icon: X,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "absent",
  },
  excused: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "excused",
  },
  late: {
    icon: Clock,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "late",
  },
};

/**
 * StudentAttendanceTab - Attendance information tab for StudentDrawer
 */
function StudentAttendanceTab({
  studentId,
  className,
}: StudentAttendanceTabProps) {
  const t = useTranslations("teacher.studentDrawer");
  const [loading, setLoading] = React.useState(true);
  const [attendanceData, setAttendanceData] =
    React.useState<AttendanceData | null>(null);

  React.useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/teacher/students/${studentId}/attendance`
        );
        if (response.ok) {
          const data = await response.json();
          setAttendanceData(data);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [studentId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 dark:text-green-400";
    if (rate >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-24" />
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
    );
  }

  // Use placeholder data if API not available
  const data = attendanceData || {
    rate: 0,
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    excusedDays: 0,
    records: [],
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Attendance Rate Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("attendanceRate")}</p>
              <p className={cn("text-3xl font-bold", getAttendanceColor(data.rate))}>
                {data.rate}%
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BarChart3
                className={cn("h-8 w-8", getAttendanceColor(data.rate))}
                aria-hidden="true"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("last30Days")} • {data.totalDays} {t("totalDays")}
          </p>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="text-center">
          <CardContent className="py-2 px-1">
            <div className="flex items-center justify-center text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span className="font-bold ml-1">{data.presentDays}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("present")}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-2 px-1">
            <div className="flex items-center justify-center text-red-600 dark:text-red-400">
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="font-bold ml-1">{data.absentDays}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("absent")}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-2 px-1">
            <div className="flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="font-bold ml-1">{data.lateDays}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("late")}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-2 px-1">
            <div className="flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span className="font-bold ml-1">{data.excusedDays}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("excused")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <div>
        <h4 className="text-sm font-medium mb-3">{t("recentRecords")}</h4>
        {data.records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noAttendanceRecords")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.records.map((record) => {
              const config = statusConfig[record.status];
              const Icon = config.icon;
              return (
                <Card key={record.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        config.bgColor
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4", config.color)}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {formatDate(record.date)}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground truncate">
                          {record.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", config.color)}
                    >
                      {t(config.label)}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { StudentAttendanceTab };
