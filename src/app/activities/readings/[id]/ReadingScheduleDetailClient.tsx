"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Trophy,
  Heart,
  Clock,
  Sparkles,
} from "lucide-react";
import { completeReadingAction } from "../actions";
import type {
  ReadingScheduleWithStats,
  ReadingScheduleDayWithStatus,
  CreateUserReadingInput,
} from "@/lib/types";

const readingCompletionSchema = z.object({
  favorite_verse_reference: z
    .string()
    .max(100, "Verse reference must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  favorite_verse_text: z
    .string()
    .max(500, "Verse text must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  reflection: z
    .string()
    .max(1000, "Reflection must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

type ReadingCompletionFormData = z.infer<typeof readingCompletionSchema>;

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface ReadingScheduleDetailClientProps {
  schedule: ReadingScheduleWithStats & { days: ReadingScheduleDayWithStatus[] };
  userProfile: UserProfile;
}

export default function ReadingScheduleDetailClient({
  schedule,
  userProfile,
}: ReadingScheduleDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<ReadingScheduleDayWithStatus | null>(null);

  const form = useForm<ReadingCompletionFormData>({
    resolver: zodResolver(readingCompletionSchema),
    defaultValues: {
      favorite_verse_reference: "",
      favorite_verse_text: "",
      reflection: "",
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const progress = schedule.my_progress;

  // Group days by week for better organization
  const groupedDays = schedule.days.reduce((acc, day) => {
    const date = new Date(day.reading_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(day);
    return acc;
  }, {} as Record<string, ReadingScheduleDayWithStatus[]>);

  async function onSubmit(data: ReadingCompletionFormData) {
    if (!selectedDay) return;

    try {
      const input: CreateUserReadingInput = {
        schedule_day_id: selectedDay.id,
        favorite_verse_reference: data.favorite_verse_reference || undefined,
        favorite_verse_text: data.favorite_verse_text || undefined,
        reflection: data.reflection || undefined,
      };

      const result = await completeReadingAction(input);

      if (result.success) {
        toast.success(t("readings.readingCompleted") || "Reading marked as complete!");
        handleDialogClose();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to complete reading");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  function handleDialogClose() {
    setSelectedDay(null);
    form.reset();
  }

  function getDayStatus(day: ReadingScheduleDayWithStatus) {
    if (day.is_completed) {
      return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10" };
    }
    if (day.reading_date === today) {
      return { icon: Sparkles, color: "text-amber-600", bg: "bg-amber-500/10" };
    }
    if (day.reading_date < today) {
      return { icon: Clock, color: "text-red-500", bg: "bg-red-500/10" };
    }
    return { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" };
  }

  function formatWeekLabel(weekStart: string) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/activities/readings')}
              aria-label={t("common.back") || "Back"}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{schedule.name}</h1>
              {schedule.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {schedule.description}
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("readings.progress") || "Progress"}
              </span>
              <span className="font-medium">
                {progress?.completed || 0}/{progress?.total || 0} {t("readings.days") || "days"} ({progress?.percentage || 0}%)
              </span>
            </div>
            <Progress value={progress?.percentage || 0} className="h-3" />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-amber-600">
                  {(progress?.completed || 0) * schedule.points_per_reading} {t("common.points") || "pts"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Days */}
      <div className="container mx-auto px-4 py-6">
        <Accordion type="multiple" defaultValue={[Object.keys(groupedDays)[0] || ""]} className="space-y-4">
          {Object.entries(groupedDays).map(([weekStart, days]) => (
            <AccordionItem key={weekStart} value={weekStart} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium">{formatWeekLabel(weekStart)}</span>
                  <Badge variant="outline">
                    {days.filter(d => d.is_completed).length}/{days.length} {t("readings.complete") || "complete"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="divide-y">
                  {days.map((day) => {
                    const status = getDayStatus(day);
                    const StatusIcon = status.icon;
                    const isToday = day.reading_date === today;
                    const isPast = day.reading_date < today;
                    const canComplete = !day.is_completed && (isToday || isPast);

                    return (
                      <div
                        key={day.id}
                        className={`flex items-center gap-4 p-4 ${isToday ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
                      >
                        <div className={`p-2 rounded-full ${status.bg}`}>
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {day.reading_reference}
                            </p>
                            {isToday && (
                              <Badge className="bg-amber-500/10 text-amber-700 text-xs">
                                {t("readings.today") || "Today"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(day.reading_date).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          {day.notes && (
                            <p className="text-sm text-muted-foreground mt-1 italic">
                              {day.notes}
                            </p>
                          )}

                          {/* Show favorite verse if completed */}
                          {day.is_completed && day.my_reading?.favorite_verse_reference && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                              <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
                                <Heart className="h-3 w-3" />
                                {t("readings.favoriteVerse") || "Favorite Verse"}
                              </div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                {day.my_reading.favorite_verse_reference}
                              </p>
                              {day.my_reading.favorite_verse_text && (
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                  "{day.my_reading.favorite_verse_text}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {day.is_completed ? (
                            <Badge className="bg-green-500/10 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              +{schedule.points_per_reading}
                            </Badge>
                          ) : canComplete ? (
                            <Button
                              size="sm"
                              onClick={() => setSelectedDay(day)}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              {t("readings.markAsRead") || "Mark as Read"}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              {t("readings.upcoming") || "Upcoming"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Empty state */}
        {schedule.days.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {t("readings.noReadings") || "No readings scheduled yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("readings.noReadingsDesc") || "Check back later for reading assignments"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Complete Reading Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("readings.completeReading") || "Complete Reading"}
            </DialogTitle>
            <DialogDescription>
              {selectedDay?.reading_reference} - {selectedDay && new Date(selectedDay.reading_date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {selectedDay?.notes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">{selectedDay.notes}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="favorite_verse_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      {t("readings.favoriteVerse") || "Favorite Verse"}
                      <span className="text-muted-foreground text-xs">({t("common.optional") || "optional"})</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("readings.favoriteVersePlaceholder") || "e.g., Matthew 5:9"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="favorite_verse_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("readings.verseText") || "Verse Text"}
                      <span className="text-muted-foreground text-xs ml-1">({t("common.optional") || "optional"})</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("readings.verseTextPlaceholder") || "Write the verse that touched you..."}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reflection"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("readings.reflection") || "Reflection"}
                      <span className="text-muted-foreground text-xs ml-1">({t("common.optional") || "optional"})</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("readings.reflectionPlaceholder") || "What did you learn from this reading?"}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                <span className="text-sm">
                  {t("readings.willEarn") || "You will earn"}{" "}
                  <strong className="text-amber-600">+{schedule.points_per_reading} {t("common.points") || "points"}</strong>
                </span>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  t("readings.markingAsRead") || "Marking..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t("readings.confirmComplete") || "I've Read This Chapter"}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
