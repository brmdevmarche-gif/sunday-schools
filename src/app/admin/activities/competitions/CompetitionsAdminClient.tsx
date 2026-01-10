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
import { DateInput } from "@/components/ui/date-input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import {
  Trophy,
  Plus,
  Eye,
  FileText,
  Calendar,
  Award,
  Upload,
  ExternalLink,
  ArrowLeft,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
} from "lucide-react";
import {
  createCompetitionAction,
  deleteCompetitionAction,
  updateCompetitionAction,
} from "@/app/activities/competitions/actions";
import type {
  CompetitionWithStats,
  CompetitionSubmissionWithDetails,
  CreateCompetitionInput,
  CompetitionSubmissionType,
  ActivityStatus,
} from "@/lib/types";

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface CompetitionsAdminClientProps {
  competitions: CompetitionWithStats[];
  pendingSubmissions: CompetitionSubmissionWithDetails[];
  userProfile: UserProfile;
}

const SUBMISSION_TYPES = ["text", "pdf_upload", "google_form"] as const;
const STATUS_OPTIONS = ["draft", "active"] as const;

const competitionSchema = z
  .object({
    name: z
      .string()
      .min(1, "Competition name is required")
      .max(200, "Name must be less than 200 characters"),
    name_ar: z
      .string()
      .max(200, "Arabic name must be less than 200 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional(),
    description_ar: z
      .string()
      .max(1000, "Arabic description must be less than 1000 characters")
      .optional(),
    submission_type: z.enum(SUBMISSION_TYPES, {
      message: "Please select a submission type",
    }),
    google_form_url: z
      .string()
      .max(500, "URL must be less than 500 characters")
      .optional(),
    instructions: z
      .string()
      .max(2000, "Instructions must be less than 2000 characters")
      .optional(),
    submission_guidelines: z
      .string()
      .max(2000, "Guidelines must be less than 2000 characters")
      .optional(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    base_points: z
      .number()
      .min(0, "Points must be at least 0")
      .max(1000, "Points must be at most 1000"),
    first_place_bonus: z.number().min(0).max(1000).optional(),
    second_place_bonus: z.number().min(0).max(1000).optional(),
    third_place_bonus: z.number().min(0).max(1000).optional(),
    status: z.enum(STATUS_OPTIONS),
  })
  .superRefine((data, ctx) => {
    if (
      data.start_date &&
      data.end_date &&
      new Date(data.start_date) > new Date(data.end_date)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after or equal to start date",
        path: ["end_date"],
      });
    }
    if (
      data.submission_type === "google_form" &&
      (!data.google_form_url || !data.google_form_url.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Google Form URL is required for this submission type",
        path: ["google_form_url"],
      });
    }
  });

type CompetitionFormData = z.infer<typeof competitionSchema>;

export default function CompetitionsAdminClient({
  competitions,
  pendingSubmissions,
  userProfile,
}: CompetitionsAdminClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "draft" | "completed"
  >("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] =
    useState<CompetitionWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      submission_type: "text",
      google_form_url: "",
      instructions: "",
      submission_guidelines: "",
      start_date: "",
      end_date: "",
      base_points: 10,
      first_place_bonus: 50,
      second_place_bonus: 30,
      third_place_bonus: 20,
      status: "draft",
    },
  });

  const activeCompetitions = competitions.filter((c) => c.status === "active");
  const draftCompetitions = competitions.filter((c) => c.status === "draft");
  const completedCompetitions = competitions.filter(
    (c) => c.status === "completed"
  );

  // Filter competitions based on search and status
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      searchQuery === "" ||
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || comp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function handleDialogClose() {
    setShowCreateDialog(false);
    form.reset();
  }

  async function handleCreateCompetition(data: CompetitionFormData) {
    try {
      const result = await createCompetitionAction({
        name: data.name,
        name_ar: data.name_ar || undefined,
        description: data.description || undefined,
        description_ar: data.description_ar || undefined,
        submission_type: data.submission_type,
        google_form_url: data.google_form_url || undefined,
        instructions: data.instructions || undefined,
        submission_guidelines: data.submission_guidelines || undefined,
        start_date: data.start_date,
        end_date: data.end_date,
        base_points: data.base_points,
        first_place_bonus:
          typeof data.first_place_bonus === "number"
            ? data.first_place_bonus
            : undefined,
        second_place_bonus:
          typeof data.second_place_bonus === "number"
            ? data.second_place_bonus
            : undefined,
        third_place_bonus:
          typeof data.third_place_bonus === "number"
            ? data.third_place_bonus
            : undefined,
        status: data.status,
      });

      if (result.success) {
        toast.success(
          t("competitions.admin.competitionCreated") ||
            "Competition created successfully"
        );
        handleDialogClose();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create competition");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function handleDeleteCompetition() {
    if (!competitionToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCompetitionAction(competitionToDelete.id);
      if (result.success) {
        toast.success(
          t("competitions.admin.competitionDeleted") ||
            "Competition deleted successfully"
        );
        setDeleteDialogOpen(false);
        setCompetitionToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete competition");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStatusChange(
    competition: CompetitionWithStats,
    newStatus: "active" | "draft" | "completed"
  ) {
    try {
      const result = await updateCompetitionAction({
        id: competition.id,
        status: newStatus,
      });
      if (result.success) {
        toast.success(
          t("competitions.admin.statusUpdated") || "Status updated successfully"
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
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
            aria-label={t("common.back") || "Back"}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("competitions.admin.title") || "Competitions"}
            </h1>
            <p className="text-muted-foreground">
              {t("competitions.admin.subtitle") ||
                "Manage contests and submissions"}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("competitions.admin.createCompetition") || "Create Competition"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {activeCompetitions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("common.active") || "Active"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {draftCompetitions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("common.drafts") || "Drafts"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {pendingSubmissions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("competitions.admin.pendingReview") || "Pending Review"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {completedCompetitions.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("readings.completed") || "Completed"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search") || "Search competitions..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as typeof statusFilter)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("common.status") || "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
            <SelectItem value="active">
              {t("common.active") || "Active"}
            </SelectItem>
            <SelectItem value="draft">
              {t("common.draft") || "Draft"}
            </SelectItem>
            <SelectItem value="completed">
              {t("readings.completed") || "Completed"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="competitions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="competitions">
            <Trophy className="h-4 w-4 mr-2" />
            {t("competitions.title") || "Competitions"} (
            {filteredCompetitions.length})
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <FileText className="h-4 w-4 mr-2" />
            {t("competitions.admin.pendingSubmissions") ||
              "Pending Submissions"}{" "}
            ({pendingSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitions">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name") || "Name"}</TableHead>
                  <TableHead>
                    {t("competitions.admin.type") || "Type"}
                  </TableHead>
                  <TableHead>
                    {t("competitions.admin.dates") || "Dates"}
                  </TableHead>
                  <TableHead>{t("common.points") || "Points"}</TableHead>
                  <TableHead>{t("common.status") || "Status"}</TableHead>
                  <TableHead className="text-right">
                    {t("common.actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompetitions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery || statusFilter !== "all"
                        ? t("common.noResults") || "No results found"
                        : t("competitions.admin.noCompetitions") ||
                          "No competitions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompetitions.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">{comp.name}</TableCell>
                      <TableCell className="capitalize">
                        {comp.submission_type.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        {new Date(comp.start_date).toLocaleDateString()} -{" "}
                        {new Date(comp.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {comp.base_points} {t("common.pts") || "pts"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            comp.status === "active" ? "default" : "secondary"
                          }
                        >
                          {comp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("common.actions") || "Actions"}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/activities/competitions/${comp.id}`
                                )
                              }
                            >
                              <Eye className="h-4 w-4 me-2" />
                              {t("common.view") || "View"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {comp.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(comp, "active")
                                }
                              >
                                <Play className="h-4 w-4 me-2" />
                                {t("competitions.admin.activate") || "Activate"}
                              </DropdownMenuItem>
                            )}
                            {comp.status === "active" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(comp, "completed")
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 me-2" />
                                {t("competitions.admin.markComplete") ||
                                  "Mark Complete"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setCompetitionToDelete(comp);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              {t("common.delete") || "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("competitions.admin.student") || "Student"}
                  </TableHead>
                  <TableHead>
                    {t("competitions.title") || "Competition"}
                  </TableHead>
                  <TableHead>
                    {t("competitions.admin.submitted") || "Submitted"}
                  </TableHead>
                  <TableHead>
                    {t("competitions.admin.type") || "Type"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("competitions.admin.noPendingSubmissions") ||
                        "No pending submissions"}
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.user?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {sub.competition?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize">
                        {sub.competition?.submission_type?.replace("_", " ") ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          {t("common.review") || "Review"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Competition Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              {t("competitions.admin.createCompetition") ||
                "Create Competition"}
            </DialogTitle>
            <DialogDescription>
              {t("competitions.admin.createCompetitionDesc") ||
                "Create a new competition for participants to submit entries"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateCompetition)}
              className="space-y-4"
            >
              {/* Basic Info */}
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
                            t("competitions.admin.namePlaceholder") ||
                            "e.g., Essay Writing Contest"
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
                      <FormLabel>
                        {t("common.nameAr") || "Name (Arabic)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            t("competitions.admin.nameArPlaceholder") ||
                            "الاسم بالعربية"
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
                    <FormLabel>
                      {t("common.description") || "Description"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          t("competitions.admin.descriptionPlaceholder") ||
                          "Describe the competition..."
                        }
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submission Type */}
              <FormField
                control={form.control}
                name="submission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("competitions.admin.submissionType") ||
                        "Submission Type"}{" "}
                      *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t("competitions.admin.textSubmission") ||
                              "Text Submission"}
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf_upload">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {t("competitions.admin.pdfUpload") || "PDF Upload"}
                          </div>
                        </SelectItem>
                        <SelectItem value="google_form">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            {t("competitions.admin.googleForm") ||
                              "Google Form"}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Google Form URL (conditional) */}
              {form.watch("submission_type") === "google_form" && (
                <FormField
                  control={form.control}
                  name="google_form_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("competitions.admin.googleFormUrl") ||
                          "Google Form URL"}{" "}
                        *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://forms.google.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Instructions */}
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("competitions.instructions") || "Instructions"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          t("competitions.admin.instructionsPlaceholder") ||
                          "Competition rules and requirements..."
                        }
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t("competitions.startDate") || "Start Date"} *
                      </FormLabel>
                      <FormControl>
                        <DateInput
                          type="date"
                          value={field.value}
                          onChange={field.onChange}
                        />
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
                        {t("competitions.endDate") || "End Date"} *
                      </FormLabel>
                      <FormControl>
                        <DateInput
                          type="date"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Points */}
              <div className="space-y-3">
                <FormLabel className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  {t("competitions.admin.pointsConfig") ||
                    "Points Configuration"}
                </FormLabel>
                <div className="grid grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name="base_points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          {t("competitions.basePoints") || "Base Points"}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="first_place_bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-amber-600">
                          1st Place Bonus
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="second_place_bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-500">
                          2nd Place Bonus
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="third_place_bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-orange-500">
                          3rd Place Bonus
                        </FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.status") || "Status"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">
                          {t("common.draft") || "Draft"}
                        </SelectItem>
                        <SelectItem value="active">
                          {t("common.active") || "Active"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("competitions.admin.statusHelp") ||
                        "Draft competitions are not visible to participants"}
                    </FormDescription>
                    <FormMessage />
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
                    : t("competitions.admin.createCompetition") ||
                      "Create Competition"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={
          t("competitions.admin.deleteCompetition") || "Delete Competition"
        }
        description={
          competitionToDelete
            ? `${
                t("competitions.admin.deleteConfirmation") ||
                "Are you sure you want to delete"
              } "${competitionToDelete.name}"? ${
                t("competitions.admin.deleteWarning") ||
                "This action cannot be undone."
              }`
            : ""
        }
        confirmText={t("common.delete") || "Delete"}
        cancelText={t("common.cancel") || "Cancel"}
        onConfirm={handleDeleteCompetition}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
