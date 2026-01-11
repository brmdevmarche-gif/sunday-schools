import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Zap } from "lucide-react";

import { getTeacherDashboardData } from "./actions";
import {
  StatCard,
  StatCardSkeleton,
  ActionRequiredCard,
  ActionRequiredSection,
  QuickAttendanceButton,
  TeacherBottomNav,
  TeacherBottomNavSpacer,
  TeacherHeader,
} from "@/components/teacher";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user is a teacher
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    // Not a teacher, redirect to appropriate dashboard
    redirect("/dashboard");
  }

  // Get teacher dashboard data
  const dashboardData = await getTeacherDashboardData();

  if (!dashboardData) {
    redirect("/dashboard");
  }

  const { teacher, stats, classes, actionRequired, isOrganizingTrips, unreadAnnouncementsCount } =
    dashboardData;

  // Group action required items by type
  const tripActions = actionRequired.filter((a) => a.type === "trip");
  const competitionActions = actionRequired.filter((a) => a.type === "competition");
  const activityActions = actionRequired.filter((a) => a.type === "activity");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header with Search and Profile */}
      <TeacherHeader
        title={t("teacher.dashboard.title") || "Dashboard"}
        teacherName={teacher.name}
        teacherAvatar={teacher.avatarUrl}
      />

      <main className="container px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
          <h1 className="text-2xl font-bold">
            {t("teacher.dashboard.welcome", { name: teacher.name }) ||
              `Welcome, ${teacher.name}!`}{" "}
            <span aria-hidden="true">👋</span>
          </h1>
          {teacher.church && (
            <p className="text-muted-foreground mt-1">{teacher.church}</p>
          )}
        </div>

        {/* Stats Grid */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            {t("teacher.dashboard.statsTitle") || "Your Statistics"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              icon="BookOpen"
              value={stats.classesCount}
              label={t("teacher.dashboard.classes") || "Classes"}
              href="/dashboard/teacher/classes"
              variant="default"
            />
            <StatCard
              icon="Zap"
              value={stats.pendingCount}
              label={t("teacher.dashboard.pending") || "Pending"}
              href="/dashboard/teacher/action-required"
              variant={stats.pendingCount > 0 ? "highlight" : "default"}
            />
            <StatCard
              icon="Users"
              value={stats.studentsCount}
              label={t("teacher.dashboard.students") || "Students"}
              href="/dashboard/teacher/classes"
              variant="default"
            />
            <StatCard
              icon="BarChart3"
              value={`${stats.attendanceRate}%`}
              label={t("teacher.dashboard.attendance") || "Attendance"}
              href="/admin/attendance/stats"
              variant="default"
            />
          </div>
        </section>

        {/* Quick Attendance Button */}
        <section aria-labelledby="quick-action-heading">
          <h2 id="quick-action-heading" className="sr-only">
            {t("teacher.dashboard.quickAction") || "Quick Action"}
          </h2>
          <QuickAttendanceButton
            classes={classes.map((c) => ({
              id: c.id,
              name: c.name,
              churchName: c.churchName,
            }))}
            label={t("teacher.dashboard.takeAttendance") || "Take Attendance"}
          />
        </section>

        {/* Action Required Section */}
        <section aria-labelledby="action-required-heading">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <h2 id="action-required-heading" className="text-lg font-semibold">
              {t("teacher.dashboard.actionRequired") || "Action Required"}
              {stats.pendingCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({stats.pendingCount})
                </span>
              )}
            </h2>
          </div>

          {actionRequired.length === 0 ? (
            <EmptyState
              icon="PartyPopper"
              title={t("teacher.dashboard.allCaughtUp") || "All caught up!"}
              description={
                t("teacher.dashboard.noPendingActions") ||
                "No pending actions at this time."
              }
            />
          ) : (
            <div className="space-y-6">
              {/* Trip Approvals */}
              {tripActions.length > 0 && (
                <ActionRequiredSection
                  type="trip"
                  label={t("teacher.dashboard.trips") || "Trips"}
                  count={tripActions.reduce((sum, a) => sum + a.count, 0)}
                >
                  {tripActions.map((action) => (
                    <ActionRequiredCard
                      key={action.id}
                      type={action.type}
                      title={action.title}
                      count={action.count}
                      subtitle={action.subtitle}
                      href={action.href}
                    />
                  ))}
                </ActionRequiredSection>
              )}

              {/* Competition Reviews */}
              {competitionActions.length > 0 && (
                <ActionRequiredSection
                  type="competition"
                  label={t("teacher.dashboard.competitions") || "Competitions"}
                  count={competitionActions.reduce((sum, a) => sum + a.count, 0)}
                >
                  {competitionActions.map((action) => (
                    <ActionRequiredCard
                      key={action.id}
                      type={action.type}
                      title={action.title}
                      count={action.count}
                      subtitle={action.subtitle}
                      href={action.href}
                    />
                  ))}
                </ActionRequiredSection>
              )}

              {/* Activity Submissions */}
              {activityActions.length > 0 && (
                <ActionRequiredSection
                  type="activity"
                  label={t("teacher.dashboard.activities") || "Activities"}
                  count={activityActions.reduce((sum, a) => sum + a.count, 0)}
                >
                  {activityActions.map((action) => (
                    <ActionRequiredCard
                      key={action.id}
                      type={action.type}
                      title={action.title}
                      count={action.count}
                      subtitle={action.subtitle}
                      href={action.href}
                    />
                  ))}
                </ActionRequiredSection>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation Spacer */}
      <TeacherBottomNavSpacer />

      {/* Bottom Navigation */}
      <TeacherBottomNav
        pendingCount={stats.pendingCount}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
        isOrganizingTrips={isOrganizingTrips}
      />
    </div>
  );
}
