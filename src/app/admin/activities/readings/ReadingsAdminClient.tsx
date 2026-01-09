"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const readingScheduleSchema = z.object({
  name: z
    .string()
    .min(1, "Schedule name is required")
    .max(200, "Name must be less than 200 characters"),
  name_ar: z.string().max(200, "Arabic name must be less than 200 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  description_ar: z.string().max(1000, "Arabic description must be less than 1000 characters").optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  points_per_reading: z.number().min(1, "Points must be at least 1").max(100, "Points must be at most 100"),
  requires_approval: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after or equal to start date",
      path: ["end_date"],
    });
  }
});

type ReadingScheduleFormData = z.infer<typeof readingScheduleSchema>;

export default function ReadingsAdminClient({
  schedules,
  userProfile,
}: ReadingsAdminClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const form = useForm<ReadingScheduleFormData>({
    resolver: zodResolver(readingScheduleSchema),
    defaultValues: {
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      start_date: "",
      end_date: "",
      points_per_reading: 5,
      requires_approval: false,
    },
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

  function handleDialogClose() {
    setShowCreateDialog(false);
    form.reset();
  }

  async function handleCreateSchedule(data: ReadingScheduleFormData) {
    try {
      const result = await createReadingScheduleAction({
        name: data.name,
        name_ar: data.name_ar || undefined,
        description: data.description || undefined,
        description_ar: data.description_ar || undefined,
        start_date: data.start_date,
        end_date: data.end_date,
        points_per_reading: data.points_per_reading,
        requires_approval: data.requires_approval,
      });

      if (result.success) {
        toast.success(
          t("readings.admin.scheduleCreated") ||
            "Reading schedule created successfully"
        );
        handleDialogClose();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create schedule");
      }
    } catch (error) {
      toast.error("An error occurred");
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
      <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSchedule)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.name") || "Name"} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            t("readings.admin.namePlaceholder") ||
                            "e.g., Lent Reading Plan"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.nameAr") || "Name (Arabic)"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            t("readings.admin.nameArPlaceholder") || "الاسم بالعربية"
                          }
                          dir="rtl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.description") || "Description"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          t("readings.admin.descriptionPlaceholder") ||
                          "Describe the reading schedule..."
                        }
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t("readings.admin.startDate") || "Start Date"} *
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t("readings.admin.endDate") || "End Date"} *
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="points_per_reading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      {t("readings.admin.pointsPerReading") || "Points per Reading"}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t("readings.admin.pointsHelp") ||
                        "Points awarded for each completed reading"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requires_approval"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel>
                        {t("readings.admin.requiresApproval") ||
                          "Requires Teacher Approval"}
                      </FormLabel>
                      <FormDescription>
                        {t("readings.admin.requiresApprovalHelp") ||
                          "If enabled, readings need teacher approval before points are awarded"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleDialogClose}
                >
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? t("common.creating") || "Creating..."
                    : t("readings.admin.createSchedule") || "Create Schedule"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
