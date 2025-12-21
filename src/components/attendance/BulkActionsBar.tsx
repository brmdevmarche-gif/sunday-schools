"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X, AlertCircle, Clock } from "lucide-react";
import type { AttendanceStatus } from "@/lib/types";

interface BulkActionsBarProps {
  onMarkAll: (status: AttendanceStatus) => void;
  disabled?: boolean;
}

export function BulkActionsBar({
  onMarkAll,
  disabled = false,
}: BulkActionsBarProps) {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("attendance.quickActions")}</CardTitle>
        <CardDescription>
          {t("attendance.quickActionsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAll("present")}
            disabled={disabled}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            {t("attendance.markAllPresent")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAll("absent")}
            disabled={disabled}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t("attendance.markAllAbsent")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAll("excused")}
            disabled={disabled}
            className="gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {t("attendance.markAllExcused")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAll("late")}
            disabled={disabled}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            {t("attendance.markAllLate")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
