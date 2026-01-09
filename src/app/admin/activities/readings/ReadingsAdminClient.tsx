"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BookOpen, Plus, Eye, Calendar, Trophy, ArrowLeft } from "lucide-react";
import { createReadingScheduleAction } from "@/app/activities/readings/actions";
import type {
  ReadingScheduleWithStats,
  CreateReadingScheduleInput,
} from "@/lib/types";

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface ReadingsAdminClientProps {
  schedules: ReadingScheduleWithStats[];
  userProfile: UserProfile;
}

export default function ReadingsAdminClient({
  schedules,
  userProfile,
}: ReadingsAdminClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateReadingScheduleInput>({
    name: "",
    name_ar: "",
    description: "",
    description_ar: "",
    start_date: "",
    end_date: "",
    points_per_reading: 5,
    requires_approval: false,
  });

  const now = new Date();
  const activeSchedules = schedules.filter(
    (s) =>
      s.is_active &&
      new Date(s.start_date) <= now &&
      new Date(s.end_date) >= now
  );
  const upcomingSchedules = schedules.filter(
    (s) => s.is_active && new Date(s.start_date) > now
  );
  const pastSchedules = schedules.filter((s) => new Date(s.end_date) < now);

  function resetForm() {
    setFormData({
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      start_date: "",
      end_date: "",
      points_per_reading: 5,
      requires_approval: false,
    });
  }

  async function handleCreateSchedule() {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error(
        t("readings.admin.fillRequired") || "Please fill in all required fields"
      );
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error(
        t("readings.admin.invalidDates") || "End date must be after start date"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReadingScheduleAction(formData);

      if (result.success) {
        toast.success(
          t("readings.admin.scheduleCreated") ||
            "Reading schedule created successfully"
        );
        setShowCreateDialog(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create schedule");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/activities")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("readings.admin.title") || "Reading Schedules"}
            </h1>
            <p className="text-muted-foreground">
              {t("readings.admin.subtitle") || "Manage Bible reading schedules"}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("readings.admin.createSchedule") || "Create Schedule"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {activeSchedules.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("readings.admin.activeSchedules") || "Active Schedules"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {upcomingSchedules.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("readings.admin.upcoming") || "Upcoming"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {pastSchedules.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("readings.admin.completed") || "Completed"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name") || "Name"}</TableHead>
              <TableHead>
                {t("readings.admin.duration") || "Duration"}
              </TableHead>
              <TableHead>{t("readings.admin.days") || "Days"}</TableHead>
              <TableHead>
                {t("readings.admin.pointsPerDay") || "Points/Day"}
              </TableHead>
              <TableHead>{t("common.status") || "Status"}</TableHead>
              <TableHead className="text-right">
                {t("common.actions") || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("readings.admin.noSchedules") ||
                    "No reading schedules found"}
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => {
                const isActive = activeSchedules.some(
                  (s) => s.id === schedule.id
                );
                const isUpcoming = upcomingSchedules.some(
                  (s) => s.id === schedule.id
                );
                const isPast = pastSchedules.some((s) => s.id === schedule.id);

                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.name}
                    </TableCell>
                    <TableCell>
                      {new Date(schedule.start_date).toLocaleDateString()} -{" "}
                      {new Date(schedule.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {schedule.total_days || "-"}{" "}
                      {t("readings.days") || "days"}
                    </TableCell>
                    <TableCell>
                      {schedule.points_per_reading} {t("common.pts") || "pts"}
                    </TableCell>
                    <TableCell>
                      {isActive && (
                        <Badge className="bg-green-500/10 text-green-700">
                          {t("common.active") || "Active"}
                        </Badge>
                      )}
                      {isUpcoming && (
                        <Badge className="bg-purple-500/10 text-purple-700">
                          {t("readings.upcoming") || "Upcoming"}
                        </Badge>
                      )}
                      {isPast && (
                        <Badge variant="secondary">
                          {t("readings.completed") || "Completed"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("readings.admin.createSchedule") || "Create Reading Schedule"}
            </DialogTitle>
            <DialogDescription>
              {t("readings.admin.createScheduleDesc") ||
                "Create a new Bible reading schedule for participants"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.name") || "Name"} *</Label>
                <Input
                  placeholder={
                    t("readings.admin.namePlaceholder") ||
                    "e.g., Lent Reading Plan"
                  }
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.nameAr") || "Name (Arabic)"}</Label>
                <Input
                  placeholder={
                    t("readings.admin.nameArPlaceholder") || "الاسم بالعربية"
                  }
                  value={formData.name_ar || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("common.description") || "Description"}</Label>
              <Textarea
                placeholder={
                  t("readings.admin.descriptionPlaceholder") ||
                  "Describe the reading schedule..."
                }
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("readings.admin.startDate") || "Start Date"} *
                </Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("readings.admin.endDate") || "End Date"} *
                </Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                {t("readings.admin.pointsPerReading") || "Points per Reading"}
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.points_per_reading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    points_per_reading: parseInt(e.target.value) || 5,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                {t("readings.admin.pointsHelp") ||
                  "Points awarded for each completed reading"}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>
                  {t("readings.admin.requiresApproval") ||
                    "Requires Teacher Approval"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("readings.admin.requiresApprovalHelp") ||
                    "If enabled, readings need teacher approval before points are awarded"}
                </p>
              </div>
              <Switch
                checked={formData.requires_approval}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_approval: checked })
                }
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateSchedule}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("common.creating") || "Creating..."
                  : t("readings.admin.createSchedule") || "Create Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
