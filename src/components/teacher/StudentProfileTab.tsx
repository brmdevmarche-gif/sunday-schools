"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Phone, Mail, MapPin, FileText, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentDetails } from "./StudentDrawer";

interface StudentProfileTabProps {
  student: StudentDetails;
  className?: string;
}

/**
 * StudentProfileTab - Profile information tab for StudentDrawer
 */
function StudentProfileTab({ student, className }: StudentProfileTabProps) {
  const t = useTranslations("teacher.studentDrawer");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Parent/Guardian Info */}
      {(student.parentName || student.parentPhone || student.parentEmail) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              {t("parentGuardian")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.parentName && (
              <p className="text-sm font-medium">{student.parentName}</p>
            )}
            {student.parentPhone && (
              <a
                href={`tel:${student.parentPhone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span dir="ltr">{student.parentPhone}</span>
              </a>
            )}
            {student.parentEmail && (
              <a
                href={`mailto:${student.parentEmail}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {student.parentEmail}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Church/Class Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {t("classInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">{t("class")}:</span>{" "}
            <span className="font-medium">{student.className}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">{t("church")}:</span>{" "}
            <span className="font-medium">{student.churchName}</span>
          </p>
          {student.userCode && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("userCode")}:</span>{" "}
              <span className="font-mono font-medium">{student.userCode}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {student.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t("notes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {student.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty state if no parent info and no notes */}
      {!student.parentName &&
        !student.parentPhone &&
        !student.parentEmail &&
        !student.notes && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noProfileInfo")}</p>
          </div>
        )}
    </div>
  );
}

export { StudentProfileTab };
