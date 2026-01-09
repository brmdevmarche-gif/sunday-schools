"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Trophy,
  Flame,
  ChevronRight,
} from "lucide-react";
import type { ReadingScheduleWithStats } from "@/lib/types";

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface ReadingsClientProps {
  schedules: ReadingScheduleWithStats[];
  userProfile: UserProfile;
}

export default function ReadingsClient({
  schedules,
  userProfile,
}: ReadingsClientProps) {
  const t = useTranslations();
  const router = useRouter();

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  function isCurrentSchedule(schedule: ReadingScheduleWithStats) {
    return (
      schedule.is_active &&
      new Date(schedule.start_date) <= now &&
      new Date(schedule.end_date) >= now
    );
  }

  const currentSchedules = schedules.filter(isCurrentSchedule);
  const pastSchedules = schedules.filter((s) => new Date(s.end_date) < now);
  const upcomingSchedules = schedules.filter((s) => new Date(s.start_date) > now);

  // Stats
  const totalCompletions = schedules.reduce(
    (sum, s) => sum + (s.my_progress?.completed || 0),
    0
  );
  const totalPoints = schedules.reduce(
    (sum, s) => sum + (s.my_progress?.completed || 0) * s.points_per_reading,
    0
  );

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/activities')}
              aria-label={t("common.back") || "Back"}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {t("readings.title") || "Daily Readings"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("readings.description") || "Follow along with Bible reading schedules"}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{totalCompletions}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("readings.daysCompleted") || "Days Completed"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{totalPoints}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("readings.pointsEarned") || "Points Earned"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{currentSchedules.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("readings.activeSchedules") || "Active Schedules"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">
              {t("readings.current") || "Current"} ({currentSchedules.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              {t("readings.upcoming") || "Upcoming"} ({upcomingSchedules.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              {t("readings.completed") || "Completed"} ({pastSchedules.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentSchedules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {t("readings.noCurrent") || "No active reading schedules"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("readings.checkUpcoming") || "Check the upcoming tab for future schedules"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {currentSchedules.map((schedule) => (
                  <ReadingScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    t={t}
                    onViewDetails={() => router.push(`/activities/readings/${schedule.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingSchedules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {t("readings.noUpcoming") || "No upcoming schedules"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => (
                  <ReadingScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    t={t}
                    isUpcoming
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {pastSchedules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {t("readings.noCompleted") || "No completed schedules"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastSchedules.map((schedule) => (
                  <ReadingScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    t={t}
                    isPast
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ReadingScheduleCard({
  schedule,
  t,
  isUpcoming,
  isPast,
  onViewDetails,
}: {
  schedule: ReadingScheduleWithStats;
  t: (key: string) => string;
  isUpcoming?: boolean;
  isPast?: boolean;
  onViewDetails?: () => void;
}) {
  const progress = schedule.my_progress;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{schedule.name}</CardTitle>
            {schedule.description && (
              <CardDescription className="mt-1">{schedule.description}</CardDescription>
            )}
          </div>
          {!isUpcoming && progress && (
            <Badge
              variant="outline"
              className={
                progress.percentage === 100
                  ? "bg-green-500/10 text-green-700 border-green-200"
                  : "bg-blue-500/10 text-blue-700 border-blue-200"
              }
            >
              {progress.percentage === 100 ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t("readings.complete") || "Complete"}
                </>
              ) : (
                <>
                  <Flame className="h-3 w-3 mr-1" />
                  {progress.percentage}%
                </>
              )}
            </Badge>
          )}
          {isUpcoming && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200">
              <Calendar className="h-3 w-3 mr-1" />
              {t("readings.upcoming") || "Upcoming"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(schedule.start_date).toLocaleDateString()} -{" "}
              {new Date(schedule.end_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>
              {schedule.points_per_reading} {t("readings.perReading") || "pts/reading"}
            </span>
          </div>
        </div>

        {!isUpcoming && progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("readings.progress") || "Progress"}
              </span>
              <span className="font-medium">
                {progress.completed}/{progress.total} {t("readings.days") || "days"}
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {isUpcoming && (
          <p className="text-sm text-muted-foreground">
            {t("readings.startsOn") || "Starts on"}{" "}
            {new Date(schedule.start_date).toLocaleDateString()}
          </p>
        )}

        {!isUpcoming && !isPast && onViewDetails && (
          <Button variant="outline" className="w-full" onClick={onViewDetails}>
            {t("readings.viewSchedule") || "View Schedule"}
            <ChevronRight className="h-4 w-4 ml-2 rtl:rotate-180" />
          </Button>
        )}

        {isPast && progress && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-center">
              {t("readings.finalScore") || "Final Score"}:{" "}
              <span className="font-bold text-green-600">
                {progress.completed * schedule.points_per_reading} {t("common.points") || "points"}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
