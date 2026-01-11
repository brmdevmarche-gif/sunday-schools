import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Zap } from "lucide-react";

import { getPendingActions } from "./actions";
import { getTeacherDashboardData } from "../actions";
import { ActionRequiredContent } from "./ActionRequiredContent";
import { TeacherBottomNav, TeacherBottomNavSpacer } from "@/components/teacher";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

function ActionRequiredSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}

export default async function ActionRequiredPage() {
  const t = await getTranslations("teacher.actionRequired");

  const [pendingActions, dashboardData] = await Promise.all([
    getPendingActions(),
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
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{t("title")}</h1>
              {pendingActions.totalCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {pendingActions.totalCount} {t("pendingItems")}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Suspense fallback={<ActionRequiredSkeleton />}>
          <ActionRequiredContent pendingActions={pendingActions} />
        </Suspense>
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
