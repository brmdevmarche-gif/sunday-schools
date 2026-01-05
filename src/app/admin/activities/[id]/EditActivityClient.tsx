"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save, Users, CheckCircle2 } from "lucide-react";
import { updateActivityAction } from "../actions";
import type {
  Activity,
  ActivityStatus,
  UpdateActivityInput,
  ExtendedUser,
} from "@/lib/types";

interface EditActivityClientProps {
  activity: Activity;
  userProfile: ExtendedUser;
}

export default function EditActivityClient({
  activity,
  userProfile,
}: EditActivityClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<UpdateActivityInput>>({
    id: activity.id,
    name: activity.name,
    description: activity.description || "",
    image_url: activity.image_url || "",
    points: activity.points,
    reduced_points_percentage: activity.reduced_points_percentage,
    requires_participation_approval: activity.requires_participation_approval,
    requires_completion_approval: activity.requires_completion_approval,
    is_time_sensitive: activity.is_time_sensitive,
    start_time: activity.start_time || "",
    end_time: activity.end_time || "",
    deadline: activity.deadline || "",
    full_points_window_start: activity.full_points_window_start || "",
    full_points_window_end: activity.full_points_window_end || "",
    max_participants: activity.max_participants || undefined,
    status: activity.status,
  });

  function handleInputChange(field: string, value: string | number | boolean | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.points) {
      toast.error(t("errors.invalidInput"));
      return;
    }

    setIsLoading(true);
    try {
      await updateActivityAction(formData as UpdateActivityInput);
      toast.success(
        t("activities.activityUpdated") || "Activity updated successfully"
      );
      router.push("/admin/activities");
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error(error instanceof Error ? error.message : t("activities.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  // Format datetime for input
  const formatDateTimeLocal = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("activities.editActivity")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("activities.editDescription") || "Edit activity details"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            {t("activities.details") || "Details"}
          </TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="h-4 w-4 mr-2" />
            {t("activities.participants")}
          </TabsTrigger>
          <TabsTrigger value="completions">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t("activities.completions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("activities.basicInfo") || "Basic Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("common.name")} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder={
                          t("activities.namePlaceholder") ||
                          "Enter activity name"
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        {t("common.description")}
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description || ""}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        placeholder={
                          t("activities.descriptionPlaceholder") ||
                          "Enter activity description"
                        }
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image_url">{t("store.imageUrl")}</Label>
                      <Input
                        id="image_url"
                        type="url"
                        value={formData.image_url || ""}
                        onChange={(e) =>
                          handleInputChange("image_url", e.target.value)
                        }
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Points Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("activities.pointsConfig") || "Points Configuration"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="points">
                          {t("activities.points")} *
                        </Label>
                        <Input
                          id="points"
                          type="number"
                          min="0"
                          value={formData.points}
                          onChange={(e) =>
                            handleInputChange(
                              "points",
                              parseInt(e.target.value)
                            )
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reduced_points_percentage">
                          {t("activities.reducedPointsPercentage") ||
                            "Reduced Points %"}
                        </Label>
                        <Input
                          id="reduced_points_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.reduced_points_percentage ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              "reduced_points_percentage",
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("activities.timeSettings") || "Time Settings"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>
                          {t("activities.isTimeSensitive") || "Time Sensitive"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t("activities.timeSensitiveDesc") ||
                            "Enable deadlines for this activity"}
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_time_sensitive}
                        onCheckedChange={(checked) =>
                          handleInputChange("is_time_sensitive", checked)
                        }
                      />
                    </div>

                    {formData.is_time_sensitive && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="deadline">
                            {t("activities.deadline")}
                          </Label>
                          <Input
                            id="deadline"
                            type="datetime-local"
                            value={formatDateTimeLocal(
                              formData.deadline as string
                            )}
                            onChange={(e) =>
                              handleInputChange("deadline", e.target.value)
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_time">
                              {t("activities.startTime") || "Start Time"}
                            </Label>
                            <Input
                              id="start_time"
                              type="datetime-local"
                              value={formatDateTimeLocal(
                                formData.start_time as string
                              )}
                              onChange={(e) =>
                                handleInputChange("start_time", e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="end_time">
                              {t("activities.endTime") || "End Time"}
                            </Label>
                            <Input
                              id="end_time"
                              type="datetime-local"
                              value={formatDateTimeLocal(
                                formData.end_time as string
                              )}
                              onChange={(e) =>
                                handleInputChange("end_time", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_points_window_start">
                              {t("activities.fullPointsStart") ||
                                "Full Points Start"}
                            </Label>
                            <Input
                              id="full_points_window_start"
                              type="datetime-local"
                              value={formatDateTimeLocal(
                                formData.full_points_window_start as string
                              )}
                              onChange={(e) =>
                                handleInputChange(
                                  "full_points_window_start",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="full_points_window_end">
                              {t("activities.fullPointsEnd") ||
                                "Full Points End"}
                            </Label>
                            <Input
                              id="full_points_window_end"
                              type="datetime-local"
                              value={formatDateTimeLocal(
                                formData.full_points_window_end as string
                              )}
                              onChange={(e) =>
                                handleInputChange(
                                  "full_points_window_end",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status & Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t("common.status")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">
                        {t("common.status")}
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          handleInputChange("status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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

                    <div className="space-y-2">
                      <Label htmlFor="max_participants">
                        {t("activities.maxParticipants") || "Max Participants"}
                      </Label>
                      <Input
                        id="max_participants"
                        type="number"
                        min="0"
                        value={formData.max_participants || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "max_participants",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        placeholder={t("activities.unlimited") || "Unlimited"}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("activities.approvalSettings") || "Approval Settings"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requires_participation_approval">
                        {t("activities.requiresApproval")}
                      </Label>
                      <Switch
                        id="requires_participation_approval"
                        checked={formData.requires_participation_approval}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "requires_participation_approval",
                            checked
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="requires_completion_approval">
                        {t("activities.requiresCompletionApproval")}
                      </Label>
                      <Switch
                        id="requires_completion_approval"
                        checked={formData.requires_completion_approval}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "requires_completion_approval",
                            checked
                          )
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isLoading ? t("common.saving") : t("common.save")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>{t("activities.participants")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("activities.participantsComingSoon") ||
                  "Participants management coming soon"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completions">
          <Card>
            <CardHeader>
              <CardTitle>{t("activities.completions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("activities.completionsComingSoon") ||
                  "Completions management coming soon"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
