import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Users } from "lucide-react";

import { getClassStudents, getClassInfo } from "../../actions";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TeacherBottomNav,
  TeacherBottomNavSpacer,
} from "@/components/teacher";
import { getTeacherDashboardData } from "../../../actions";
import { ClassRosterClient } from "./ClassRosterClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassRosterPage({ params }: PageProps) {
  const { classId } = await params;
  const t = await getTranslations("teacher.classes");

  // Fetch data in parallel
  const [classInfo, students, dashboardData] = await Promise.all([
    getClassInfo(classId),
    getClassStudents(classId),
    getTeacherDashboardData(),
  ]);

  if (!classInfo) {
    notFound();
  }

  const pendingCount = dashboardData?.stats.pendingCount || 0;
  const unreadAnnouncements = dashboardData?.unreadAnnouncementsCount || 0;
  const isOrganizingTrips = dashboardData?.isOrganizingTrips || false;

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
              {t("roster")} - {students.length} {t("students")}
            </p>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-4">
        {students.length === 0 ? (
          <EmptyState
            icon="Users"
            title={t("noStudentsTitle")}
            description={t("noStudentsDescription")}
          />
        ) : (
          <ClassRosterClient students={students} />
        )}
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
