"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

interface AttendanceStats {
  total: number;
  marked: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
}

interface AttendanceStatsBarProps {
  stats: AttendanceStats;
  showDetailed?: boolean;
}

export function AttendanceStatsBar({ stats, showDetailed = true }: AttendanceStatsBarProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {t("attendance.totalStudents")}: {stats.total}
        </Badge>
        <Badge variant="outline">
          {t("attendance.marked")}: {stats.marked}/{stats.total}
        </Badge>
      </div>
      {showDetailed && stats.marked > 0 && (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500">
            {t("attendance.present")}: {stats.present}
          </Badge>
          <Badge variant="destructive">
            {t("attendance.absent")}: {stats.absent}
          </Badge>
          <Badge className="bg-yellow-500">
            {t("attendance.excused")}: {stats.excused}
          </Badge>
          <Badge className="bg-orange-500">
            {t("attendance.late")}: {stats.late}
          </Badge>
        </div>
      )}
    </div>
  );
}
