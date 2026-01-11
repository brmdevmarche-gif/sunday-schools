import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import {
  TeacherBottomNav,
  TeacherBottomNavSpacer,
} from "@/components/teacher";
import { getTeacherDashboardData } from "../../actions";
import { getTripDetails } from "../actions";
import { TripDetailsClient } from "./TripDetailsClient";

export const dynamic = "force-dynamic";

interface TripDetailsPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripDetailsPage({ params }: TripDetailsPageProps) {
  const { tripId } = await params;
  const t = await getTranslations("teacher.myTrips");

  // Fetch data in parallel
  const [dashboardData, tripDetails] = await Promise.all([
    getTeacherDashboardData(),
    getTripDetails(tripId),
  ]);

  if (!tripDetails) {
    notFound();
  }

  const pendingCount = dashboardData?.stats.pendingCount || 0;
  const unreadAnnouncements = dashboardData?.unreadAnnouncementsCount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Link
            href="/dashboard/teacher/trips"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={t("back")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {tripDetails.trip.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <TripDetailsClient tripDetails={tripDetails} />
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
