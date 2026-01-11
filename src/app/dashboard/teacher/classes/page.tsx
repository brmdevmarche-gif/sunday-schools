import { getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";

import { getTeacherClassesWithDetails } from "./actions";
import { ClassCard } from "@/components/teacher";
import { TeacherBottomNav, TeacherBottomNavSpacer } from "@/components/teacher";
import { EmptyState } from "@/components/ui/empty-state";
import { getTeacherDashboardData } from "../actions";

export const dynamic = "force-dynamic";

export default async function MyClassesPage() {
  const t = await getTranslations("teacher.classes");

  // Fetch classes and dashboard data in parallel
  const [classes, dashboardData] = await Promise.all([
    getTeacherClassesWithDetails(),
    getTeacherDashboardData(),
  ]);

  const pendingCount = dashboardData?.stats.pendingCount || 0;
  const unreadAnnouncements = dashboardData?.unreadAnnouncementsCount || 0;
  const isOrganizingTrips = dashboardData?.isOrganizingTrips || false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold">{t("title")}</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {classes.length === 0 ? (
          <EmptyState
            icon="BookOpen"
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                id={classItem.id}
                name={classItem.name}
                churchName={classItem.churchName}
                studentCount={classItem.studentCount}
                lastAttendanceDate={classItem.lastAttendanceDate}
                attendanceTakenThisWeek={classItem.attendanceTakenThisWeek}
              />
            ))}
          </div>
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
