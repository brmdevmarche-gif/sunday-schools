import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import {
  TeacherBottomNav,
  TeacherBottomNavSpacer,
} from "@/components/teacher";
import { getTeacherDashboardData } from "../actions";
import {
  getClassAttendance,
  getTeacherClassesForAttendance,
} from "./actions";
import { TakeAttendanceClient } from "./TakeAttendanceClient";
import { ClassSelectorClient } from "./ClassSelectorClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ classId?: string; date?: string }>;
}

export default async function TakeAttendancePage({ searchParams }: PageProps) {
  const { classId, date } = await searchParams;
  const t = await getTranslations("teacher.attendance");

  // Get dashboard data for bottom nav
  const dashboardData = await getTeacherDashboardData();
  const pendingCount = dashboardData?.stats.pendingCount || 0;
  const unreadAnnouncements = dashboardData?.unreadAnnouncementsCount || 0;
  const isOrganizingTrips = dashboardData?.isOrganizingTrips || false;

  // If no classId, show class selector
  if (!classId) {
    const classes = await getTeacherClassesForAttendance();

    // If only one class, redirect to it
    if (classes.length === 1) {
      redirect(`/dashboard/teacher/attendance?classId=${classes[0].id}`);
    }

    // If no classes, show empty state
    if (classes.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center gap-4 px-4">
              <Link
                href="/dashboard/teacher"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
                aria-label={t("back")}
              >
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
              </Link>
              <h1 className="text-lg font-semibold">{t("takeAttendance")}</h1>
            </div>
          </header>

          <main className="container px-4 py-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("noClasses")}</p>
            </div>
          </main>

          <TeacherBottomNav
            pendingCount={pendingCount}
            unreadAnnouncementsCount={unreadAnnouncements}
            isOrganizingTrips={isOrganizingTrips}
          />
          <TeacherBottomNavSpacer />
        </div>
      );
    }

    // Show class selector
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center gap-4 px-4">
            <Link
              href="/dashboard/teacher"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label={t("back")}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Link>
            <h1 className="text-lg font-semibold">{t("selectClass")}</h1>
          </div>
        </header>

        <main className="container px-4 py-6">
          <ClassSelectorClient classes={classes} />
        </main>

        <TeacherBottomNav
          pendingCount={pendingCount}
          unreadAnnouncementsCount={unreadAnnouncements}
          isOrganizingTrips={isOrganizingTrips}
        />
        <TeacherBottomNavSpacer />
      </div>
    );
  }

  // Get attendance data for the selected class
  const attendanceData = await getClassAttendance(classId, date);

  if (!attendanceData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Link
            href="/dashboard/teacher"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={t("back")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
          <h1 className="text-lg font-semibold">{t("takeAttendance")}</h1>
        </div>
      </header>

      <main className="container px-4 py-6">
        <TakeAttendanceClient initialData={attendanceData} />
      </main>

      <TeacherBottomNav
        pendingCount={pendingCount}
        unreadAnnouncementsCount={unreadAnnouncements}
        isOrganizingTrips={isOrganizingTrips}
      />
      <TeacherBottomNavSpacer />
    </div>
  );
}
