"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Trophy,
  Users,
  CheckCircle2,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";
import { deleteActivityAction } from "./actions";
import type { Activity, ActivityStatus, ExtendedUser } from "@/lib/types";

interface ActivitiesManagementClientProps {
  activities: Activity[];
  userProfile: ExtendedUser;
}

export default function ActivitiesManagementClient({
  activities: initialActivities,
  userProfile,
}: ActivitiesManagementClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "all">(
    "all"
  );
  const [activities, setActivities] = useState(initialActivities);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Status filter
      if (statusFilter !== "all" && activity.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = activity.name.toLowerCase();
        const description = activity.description?.toLowerCase() || "";

        if (!name.includes(query) && !description.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [activities, statusFilter, searchQuery]);

  function getStatusColor(status: ActivityStatus) {
    switch (status) {
      case "draft":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "completed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  }

  async function handleDelete(activityId: string) {
    if (!confirm(t("activities.deleteConfirm"))) {
      return;
    }

    try {
      await deleteActivityAction(activityId);
      setActivities(activities.filter((a) => a.id !== activityId));
      toast.success(t("activities.activityDeleted"));
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error(error instanceof Error ? error.message : t("activities.deleteFailed"));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("activities.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("activities.subtitle")}
          </p>
        </div>
        <Button onClick={() => router.push("/admin/activities/create")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("activities.createActivity")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as ActivityStatus | "all")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("activities.allStatuses")}</SelectItem>
            <SelectItem value="draft">
              {t("activities.status.draft")}
            </SelectItem>
            <SelectItem value="active">
              {t("activities.status.active")}
            </SelectItem>
            <SelectItem value="completed">
              {t("activities.status.completed")}
            </SelectItem>
            <SelectItem value="cancelled">
              {t("activities.status.cancelled")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {t("activities.noActivities")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("activities.noActivitiesDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {activity.name}
                    </CardTitle>
                    <Badge
                      className={`${getStatusColor(activity.status)} mt-2`}
                    >
                      {t(`activities.status.${activity.status}`)}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {t("common.actions")}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/admin/activities/${activity.id}`)
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(activity.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                {activity.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {activity.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{activity.points} pts</span>
                  </div>
                  {activity.max_participants && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">
                        {activity.max_participants} max
                      </span>
                    </div>
                  )}
                  {activity.is_time_sensitive && activity.deadline && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-muted-foreground text-xs">
                        {new Date(activity.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {(activity.requires_participation_approval ||
                  activity.requires_completion_approval) && (
                  <div className="flex gap-2 flex-wrap">
                    {activity.requires_participation_approval && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t("activities.requiresApproval")}
                      </Badge>
                    )}
                    {activity.requires_completion_approval && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t("activities.requiresCompletionApproval")}
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-auto"
                  onClick={() =>
                    router.push(`/admin/activities/${activity.id}`)
                  }
                >
                  {t("activities.viewDetails")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
