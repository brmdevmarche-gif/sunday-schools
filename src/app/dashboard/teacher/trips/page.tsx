import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import {
  TeacherBottomNav,
  TeacherBottomNavSpacer,
} from "@/components/teacher";
import { getTeacherDashboardData } from "../actions";
import { getTeacherTrips } from "./actions";
import { MyTripsClient } from "./MyTripsClient";

export const dynamic = "force-dynamic";

export default async function MyTripsPage() {
  const t = await getTranslations("teacher.myTrips");

  // Fetch data in parallel
  const [dashboardData, trips] = await Promise.all([
    getTeacherDashboardData(),
    getTeacherTrips(),
  ]);

  const pendingCount = dashboardData?.stats.pendingCount || 0;
  const unreadAnnouncements = dashboardData?.unreadAnnouncementsCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Link
            href="/dashboard/teacher"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={t("back")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-6">
        <MyTripsClient trips={trips} />
      </main>

      {/* Bottom Navigation */}
      <TeacherBottomNav
        pendingCount={pendingCount}
        unreadAnnouncementsCount={unreadAnnouncements}
        isOrganizingTrips={true}
      />
      <TeacherBottomNavSpacer />
    </div>
  );
}
