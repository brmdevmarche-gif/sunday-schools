"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Church,
  BookOpen,
  Heart,
  HandHeart,
  UtensilsCrossed,
  Moon,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { createSpiritualNoteAction } from "./actions";
import type {
  SpiritualNoteWithDetails,
  SpiritualActivityTemplate,
  SpiritualActivityType,
} from "@/lib/types";

const ACTIVITY_TYPES = [
  "prayer",
  "mass",
  "confession",
  "fasting",
  "bible_reading",
  "charity",
  "other",
] as const;

const createSpiritualNoteSchema = z
  .object({
    activity_type: z.enum(ACTIVITY_TYPES, {
      message: "Please select an activity type",
    }),
    activity_template_id: z.string().optional(),
    title: z
      .string()
      .max(100, "Title must be less than 100 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional(),
    activity_date: z
      .string()
      .min(1, "Please select a date")
      .refine(
        (date) => new Date(date) <= new Date(),
        "Date cannot be in the future"
      ),
    custom_type: z
      .string()
      .max(50, "Custom type must be less than 50 characters")
      .optional(),
  })
  .refine(
    (data) =>
      data.activity_type !== "other" ||
      (data.custom_type && data.custom_type.trim().length > 0),
    {
      message: "Please specify a custom activity type",
      path: ["custom_type"],
    }
  );

type SpiritualNoteFormData = z.infer<typeof createSpiritualNoteSchema>;

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface SpiritualNotesClientProps {
  notes: SpiritualNoteWithDetails[];
  templates: SpiritualActivityTemplate[];
  userProfile: UserProfile;
}

const ACTIVITY_ICONS: Record<SpiritualActivityType, React.ReactNode> = {
  prayer: <Moon className="h-5 w-5" />,
  mass: <Church className="h-5 w-5" />,
  confession: <Heart className="h-5 w-5" />,
  fasting: <UtensilsCrossed className="h-5 w-5" />,
  bible_reading: <BookOpen className="h-5 w-5" />,
  charity: <HandHeart className="h-5 w-5" />,
  other: <Sparkles className="h-5 w-5" />,
};

const ACTIVITY_COLORS: Record<SpiritualActivityType, string> = {
  prayer: "bg-purple-500/10 text-purple-700 border-purple-200",
  mass: "bg-blue-500/10 text-blue-700 border-blue-200",
  confession: "bg-pink-500/10 text-pink-700 border-pink-200",
  fasting: "bg-orange-500/10 text-orange-700 border-orange-200",
  bible_reading: "bg-green-500/10 text-green-700 border-green-200",
  charity: "bg-amber-500/10 text-amber-700 border-amber-200",
  other: "bg-gray-500/10 text-gray-700 border-gray-200",
};

export default function SpiritualNotesClient({
  notes,
  templates,
  userProfile,
}: SpiritualNotesClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<SpiritualNoteFormData>({
    resolver: zodResolver(createSpiritualNoteSchema),
    defaultValues: {
      activity_type: "prayer",
      activity_date: new Date().toISOString().split("T")[0],
      activity_template_id: undefined,
      title: "",
      description: "",
      custom_type: "",
    },
  });

  const watchActivityType = form.watch("activity_type");

  async function onSubmit(data: SpiritualNoteFormData) {
    try {
      const result = await createSpiritualNoteAction({
        activity_type: data.activity_type,
        activity_template_id: data.activity_template_id,
        title: data.title || undefined,
        description: data.description || undefined,
        activity_date: data.activity_date,
        custom_type: data.custom_type || undefined,
      });

      if (result.success) {
        toast.success(
          t("spiritualNotes.submitSuccess") || "Spiritual note submitted!"
        );
        setIsDialogOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  function handleDialogChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("status.approved") || "Approved"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            {t("status.rejected") || "Rejected"}
          </Badge>
        );
      case "needs_revision":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("status.needsRevision") || "Needs Revision"}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            {t("status.pending") || "Pending"}
          </Badge>
        );
    }
  }

  // Group templates by activity type
  const templatesByType = templates.reduce((acc, template) => {
    if (!acc[template.activity_type]) {
      acc[template.activity_type] = [];
    }
    acc[template.activity_type].push(template);
    return acc;
  }, {} as Record<SpiritualActivityType, SpiritualActivityTemplate[]>);

  // Stats
  const totalPoints = notes
    .filter((n) => n.status === "approved")
    .reduce((sum, n) => sum + (n.points_awarded || 0), 0);
  const pendingCount = notes.filter((n) => n.status === "submitted").length;
  const approvedCount = notes.filter((n) => n.status === "approved").length;

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-start md:justify-between sm:items-center  mb-6 flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/activities")}
                aria-label={t("common.back") || "Back"}
              >
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {t("spiritualNotes.title") || "Spiritual Notes"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("spiritualNotes.description") ||
                    "Track your daily spiritual practices"}
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center justify-center w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("spiritualNotes.addNote") || "Add Note"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {t("spiritualNotes.newNote") || "New Spiritual Note"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="activity_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("spiritualNotes.activityType") ||
                              "Activity Type"}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value: SpiritualActivityType) => {
                              field.onChange(value);
                              form.setValue("activity_template_id", undefined);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prayer">
                                {t("spiritualNotes.types.prayer") || "Prayer"}
                              </SelectItem>
                              <SelectItem value="mass">
                                {t("spiritualNotes.types.mass") || "Mass"}
                              </SelectItem>
                              <SelectItem value="confession">
                                {t("spiritualNotes.types.confession") ||
                                  "Confession"}
                              </SelectItem>
                              <SelectItem value="fasting">
                                {t("spiritualNotes.types.fasting") || "Fasting"}
                              </SelectItem>
                              <SelectItem value="bible_reading">
                                {t("spiritualNotes.types.bibleReading") ||
                                  "Bible Reading"}
                              </SelectItem>
                              <SelectItem value="charity">
                                {t("spiritualNotes.types.charity") || "Charity"}
                              </SelectItem>
                              <SelectItem value="other">
                                {t("spiritualNotes.types.other") || "Other"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchActivityType &&
                      templatesByType[watchActivityType]?.length > 0 && (
                        <FormField
                          control={form.control}
                          name="activity_template_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("spiritualNotes.template") ||
                                  "Template (Optional)"}
                              </FormLabel>
                              <Select
                                value={field.value || "none"}
                                onValueChange={(value) =>
                                  field.onChange(
                                    value === "none" ? undefined : value
                                  )
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        t("spiritualNotes.selectTemplate") ||
                                        "Select template"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">
                                    {t("common.none") || "None"}
                                  </SelectItem>
                                  {templatesByType[watchActivityType].map(
                                    (template) => (
                                      <SelectItem
                                        key={template.id}
                                        value={template.id}
                                      >
                                        {template.name} (+{template.base_points}{" "}
                                        pts)
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                    <FormField
                      control={form.control}
                      name="activity_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("spiritualNotes.date") || "Activity Date"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              max={new Date().toISOString().split("T")[0]}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("spiritualNotes.titleLabel") ||
                              "Title (Optional)"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                t("spiritualNotes.titlePlaceholder") ||
                                "e.g., Morning Prayer"
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("spiritualNotes.descriptionLabel") ||
                              "Notes (Optional)"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                t("spiritualNotes.descriptionPlaceholder") ||
                                "Share your experience..."
                              }
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchActivityType === "other" && (
                      <FormField
                        control={form.control}
                        name="custom_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("spiritualNotes.customType") ||
                                "Custom Activity Type"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  t("spiritualNotes.customTypePlaceholder") ||
                                  "e.g., Spiritual Reading"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? t("common.submitting") || "Submitting..."
                        : t("spiritualNotes.submit") || "Submit"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {totalPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("spiritualNotes.totalPoints") || "Points Earned"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {pendingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("spiritualNotes.pending") || "Pending"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("spiritualNotes.approved") || "Approved"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="container mx-auto px-4 py-6">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {t("spiritualNotes.noNotes") || "No spiritual notes yet"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t("spiritualNotes.noNotesDescription") ||
                  "Start tracking your spiritual journey"}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("spiritualNotes.addFirst") || "Add Your First Note"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <div
                  className={`h-1 ${
                    ACTIVITY_COLORS[note.activity_type].split(" ")[0]
                  }`}
                />
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          ACTIVITY_COLORS[note.activity_type]
                        }`}
                      >
                        {ACTIVITY_ICONS[note.activity_type]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {note.title ||
                              t(`spiritualNotes.types.${note.activity_type}`) ||
                              note.activity_type}
                          </p>
                          {getStatusBadge(note.status)}
                        </div>
                        {note.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {note.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.activity_date).toLocaleDateString()}
                        </p>
                        {note.status === "approved" && note.points_awarded && (
                          <p className="text-sm font-medium text-green-600">
                            +{note.points_awarded}{" "}
                            {t("common.points") || "points"}
                          </p>
                        )}
                        {note.review_notes && (
                          <p className="text-sm text-amber-600 italic">
                            {t("spiritualNotes.reviewNotes") || "Review"}:{" "}
                            {note.review_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
