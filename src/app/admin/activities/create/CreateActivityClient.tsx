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
import { DateTimePicker } from "@/components/ui/date-input";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { createActivityAction } from "../actions";
import type {
  CreateActivityInput,
  ActivityStatus,
  ExtendedUser,
} from "@/lib/types";

interface CreateActivityClientProps {
  userProfile: ExtendedUser;
}

export default function CreateActivityClient({
  userProfile,
}: CreateActivityClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<CreateActivityInput>>({
    name: "",
    description: "",
    image_url: "",
    points: 10,
    reduced_points_percentage: 100,
    requires_participation_approval: false,
    requires_completion_approval: true,
    is_time_sensitive: false,
    status: "draft" as ActivityStatus,
  });

  function handleInputChange(
    field: string,
    value: string | number | boolean | undefined
  ) {
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
      await createActivityAction(formData as CreateActivityInput);
      toast.success(
        t("activities.activityCreated") || "Activity created successfully"
      );
      router.push("/admin/activities");
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error(
        error instanceof Error ? error.message : t("activities.createFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {t("activities.createActivity")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("activities.createDescription") ||
              "Create a new activity for students"}
          </p>
        </div>
      </div>

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
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={
                      t("activities.namePlaceholder") || "Enter activity name"
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("common.description")}</Label>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points">{t("activities.points")} *</Label>
                    <Input
                      id="points"
                      type="number"
                      min="0"
                      value={formData.points}
                      onChange={(e) =>
                        handleInputChange("points", parseInt(e.target.value))
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
                      value={formData.reduced_points_percentage}
                      onChange={(e) =>
                        handleInputChange(
                          "reduced_points_percentage",
                          parseInt(e.target.value)
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
                    <DateTimePicker
                      value={formData.deadline || ""}
                      onChange={(value) =>
                        handleInputChange("deadline", value)
                      }
                      label={t("activities.deadline")}
                      placeholder={t("activities.selectDateTime") || "Select date and time"}
                      sheetTitle={t("activities.deadline")}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DateTimePicker
                        value={formData.start_time || ""}
                        onChange={(value) =>
                          handleInputChange("start_time", value)
                        }
                        label={t("activities.startTime") || "Start Time"}
                        placeholder={t("activities.selectDateTime") || "Select date and time"}
                        sheetTitle={t("activities.startTime") || "Start Time"}
                      />

                      <DateTimePicker
                        value={formData.end_time || ""}
                        onChange={(value) =>
                          handleInputChange("end_time", value)
                        }
                        label={t("activities.endTime") || "End Time"}
                        placeholder={t("activities.selectDateTime") || "Select date and time"}
                        sheetTitle={t("activities.endTime") || "End Time"}
                      />
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
                    {t("activities.status") || "Status"}
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger className="w-full">
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
                        e.target.value ? parseInt(e.target.value) : undefined
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
                      handleInputChange("requires_completion_approval", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isLoading} className="w-full">
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
    </div>
  );
}
