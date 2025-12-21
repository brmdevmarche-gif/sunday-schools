"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Trophy,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Target,
  Award,
} from "lucide-react";
import {
  participateInActivityAction,
  completeActivityAction,
  withdrawFromActivityAction,
} from "./actions";
import type { ActivityWithDetails } from "@/lib/types";

interface ActivitiesClientProps {
  activities: ActivityWithDetails[];
  completionsData: {
    completions: any[];
    totalPoints: number;
    pendingPoints: number;
  };
  userProfile: any;
}

export default function ActivitiesClient({
  activities: initialActivities,
  completionsData,
  userProfile,
}: ActivitiesClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "available" | "participating" | "completed"
  >("all");
  const [isLoading, setIsLoading] = useState(false);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = initialActivities;

    // Type filter
    if (filterType === "available") {
      filtered = filtered.filter(
        (a) => !a.my_participation && !a.my_completion
      );
    } else if (filterType === "participating") {
      filtered = filtered.filter((a) => a.my_participation && !a.my_completion);
    } else if (filterType === "completed") {
      filtered = filtered.filter((a) => a.my_completion);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [initialActivities, filterType, searchQuery]);

  async function handleParticipate(activityId: string) {
    setIsLoading(true);
    try {
      await participateInActivityAction({ activity_id: activityId });
      toast.success(t("activities.participationRequested"));
      router.refresh();
    } catch (error: any) {
      console.error("Error participating:", error);
      toast.error(error.message || t("activities.participationFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleComplete(activityId: string) {
    setIsLoading(true);
    try {
      await completeActivityAction({ activity_id: activityId });
      toast.success(t("activities.completionSubmitted"));
      router.refresh();
    } catch (error: any) {
      console.error("Error completing:", error);
      toast.error(error.message || t("activities.completionFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWithdraw(activityId: string) {
    if (!confirm(t("activities.withdrawConfirm"))) {
      return;
    }

    setIsLoading(true);
    try {
      await withdrawFromActivityAction(activityId);
      toast.success(t("activities.withdrawnSuccess"));
      router.refresh();
    } catch (error: any) {
      console.error("Error withdrawing:", error);
      toast.error(error.message || t("activities.withdrawFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  function getParticipationStatus(activity: ActivityWithDetails) {
    if (activity.my_completion) {
      if (activity.my_completion.is_revoked) {
        return {
          label: t("activities.revoked"),
          color: "bg-red-500/10 text-red-700",
        };
      }
      if (activity.my_completion.status === "pending") {
        return {
          label: t("activities.pendingApproval"),
          color: "bg-yellow-500/10 text-yellow-700",
        };
      }
      if (activity.my_completion.status === "completed") {
        return {
          label: t("activities.completed"),
          color: "bg-green-500/10 text-green-700",
        };
      }
      if (activity.my_completion.status === "rejected") {
        return {
          label: t("activities.rejected"),
          color: "bg-red-500/10 text-red-700",
        };
      }
    }

    if (activity.my_participation) {
      if (activity.my_participation.status === "pending") {
        return {
          label: t("activities.waitingApproval"),
          color: "bg-blue-500/10 text-blue-700",
        };
      }
      if (activity.my_participation.status === "approved") {
        return {
          label: t("activities.participating"),
          color: "bg-green-500/10 text-green-700",
        };
      }
      if (activity.my_participation.status === "rejected") {
        return {
          label: t("activities.participationRejected"),
          color: "bg-red-500/10 text-red-700",
        };
      }
    }

    return null;
  }

  function canParticipate(activity: ActivityWithDetails) {
    return !activity.my_participation && !activity.my_completion;
  }

  function canComplete(activity: ActivityWithDetails) {
    if (activity.my_completion) return false;
    if (!activity.requires_participation_approval) return true;
    return activity.my_participation?.status === "approved";
  }

  return (
    <>
      {/* Header with Stats */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{t("activities.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("activities.description")}
              </p>
            </div>
          </div>

          {/* Points Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("activities.totalPoints")}
                    </p>
                    <p className="text-3xl font-bold">
                      {completionsData.totalPoints}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("activities.pendingPoints")}
                    </p>
                    <p className="text-3xl font-bold">
                      {completionsData.pendingPoints}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("activities.completedCount")}
                    </p>
                    <p className="text-3xl font-bold">
                      {
                        completionsData.completions.filter(
                          (c) => c.status === "completed" && !c.is_revoked
                        ).length
                      }
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("activities.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(value: any) => setFilterType(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("activities.allActivities")}
              </SelectItem>
              <SelectItem value="available">
                {t("activities.available")}
              </SelectItem>
              <SelectItem value="participating">
                {t("activities.myParticipations")}
              </SelectItem>
              <SelectItem value="completed">
                {t("activities.myCompletions")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {t("activities.noActivitiesFound")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("activities.noActivitiesFoundDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => {
              const status = getParticipationStatus(activity);
              const canPart = canParticipate(activity);
              const canComp = canComplete(activity);

              return (
                <Card key={activity.id} className="flex flex-col">
                  {activity.image_url && (
                    <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                      <img
                        src={activity.image_url}
                        alt={activity.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">
                      {activity.name}
                    </CardTitle>
                    {status && (
                      <Badge className={status.color}>{status.label}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    {activity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span className="font-bold">{activity.points}</span>
                        <span className="text-muted-foreground">
                          {t("activities.points")}
                        </span>
                      </div>
                      {activity.max_participants && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground text-xs">
                            {activity.max_participants} max
                          </span>
                        </div>
                      )}
                    </div>

                    {activity.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <span className="text-xs">
                          {t("activities.deadline")}:{" "}
                          {new Date(activity.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {activity.my_completion &&
                      !activity.my_completion.is_revoked && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-700 dark:text-green-400">
                              +{activity.my_completion.points_awarded}{" "}
                              {t("activities.points")}
                            </span>
                          </div>
                        </div>
                      )}

                    <div className="flex gap-2 mt-auto">
                      {canPart && (
                        <Button
                          className="flex-1"
                          onClick={() => handleParticipate(activity.id)}
                          disabled={isLoading}
                        >
                          {t("activities.participate")}
                        </Button>
                      )}
                      {canComp && (
                        <Button
                          className="flex-1"
                          onClick={() => handleComplete(activity.id)}
                          disabled={isLoading}
                        >
                          {t("activities.markComplete")}
                        </Button>
                      )}
                      {activity.my_participation?.status === "pending" && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleWithdraw(activity.id)}
                          disabled={isLoading}
                        >
                          {t("activities.withdraw")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
