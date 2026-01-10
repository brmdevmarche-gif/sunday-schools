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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Eye,
  Plus,
  Heart,
  Trophy,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import {
  reviewSpiritualNoteAction,
  bulkApproveSpiritualNotesAction,
  createSpiritualActivityTemplateAction,
} from "@/app/activities/spiritual-notes/actions";
import type {
  SpiritualNoteWithDetails,
  SpiritualActivityTemplate,
  SpiritualActivityType,
  SubmissionStatus,
} from "@/lib/types";

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface SpiritualNotesAdminClientProps {
  notes: SpiritualNoteWithDetails[];
  templates: SpiritualActivityTemplate[];
  userProfile: UserProfile;
}

const ACTIVITY_TYPE_ICONS: Record<SpiritualActivityType, string> = {
  prayer: "hands-praying",
  mass: "church",
  confession: "heart-handshake",
  fasting: "utensils-crossed",
  bible_reading: "book-open",
  charity: "hand-heart",
  other: "sparkles",
};

const ACTIVITY_TYPES = [
  "prayer",
  "mass",
  "confession",
  "fasting",
  "bible_reading",
  "charity",
  "other",
] as const;

const templateSchema = z.object({
  activity_type: z.enum(ACTIVITY_TYPES, {
    message: "Please select an activity type",
  }),
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Name must be less than 100 characters"),
  name_ar: z
    .string()
    .max(100, "Arabic name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  description_ar: z
    .string()
    .max(500, "Arabic description must be less than 500 characters")
    .optional(),
  icon: z.string().optional(),
  base_points: z
    .number()
    .min(1, "Points must be at least 1")
    .max(100, "Points must be at most 100"),
  max_per_day: z
    .number()
    .min(1, "Max per day must be at least 1")
    .max(10, "Max per day must be at most 10")
    .optional(),
  requires_approval: z.boolean(),
  is_active: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function SpiritualNotesAdminClient({
  notes,
  templates,
  userProfile,
}: SpiritualNotesAdminClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "submitted"
  );
  const [typeFilter, setTypeFilter] = useState<SpiritualActivityType | "all">(
    "all"
  );
  const [selectedNote, setSelectedNote] =
    useState<SpiritualNoteWithDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      activity_type: "prayer",
      name: "",
      name_ar: "",
      description: "",
      description_ar: "",
      icon: "sparkles",
      base_points: 5,
      max_per_day: 1,
      requires_approval: true,
      is_active: true,
    },
  });

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    if (statusFilter !== "all" && note.status !== statusFilter) return false;
    if (typeFilter !== "all" && note.activity_type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userName = note.user?.full_name?.toLowerCase() || "";
      const title = note.title?.toLowerCase() || "";
      if (!userName.includes(query) && !title.includes(query)) return false;
    }
    return true;
  });

  function handleDialogClose() {
    setShowCreateDialog(false);
    templateForm.reset();
  }

  async function handleCreateTemplate(data: TemplateFormData) {
    try {
      const result = await createSpiritualActivityTemplateAction({
        activity_type: data.activity_type,
        name: data.name,
        name_ar: data.name_ar || null,
        description: data.description || null,
        description_ar: data.description_ar || null,
        icon: data.icon || null,
        base_points: data.base_points,
        max_per_day:
          typeof data.max_per_day === "number" ? data.max_per_day : null,
        requires_approval: data.requires_approval,
        is_active: data.is_active,
        diocese_id: null,
        church_id: null,
        class_id: null,
      });

      if (result.success) {
        toast.success(
          t("spiritualNotes.admin.templateCreated") ||
            "Activity template created successfully"
        );
        handleDialogClose();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create template");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function handleReview(approved: boolean) {
    if (!selectedNote) return;

    setIsReviewing(true);
    try {
      const result = await reviewSpiritualNoteAction({
        note_id: selectedNote.id,
        approved,
        review_notes: reviewNotes || undefined,
      });

      if (result.success) {
        toast.success(approved ? "Note approved" : "Note rejected");
        setSelectedNote(null);
        setReviewNotes("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to review");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return;

    setIsReviewing(true);
    try {
      const result = await bulkApproveSpiritualNotesAction(selectedIds);
      toast.success(`Approved ${result.successCount} notes`);
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsReviewing(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("common.approved") || "Approved"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            {t("common.rejected") || "Rejected"}
          </Badge>
        );
      case "needs_revision":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("common.needsRevision") || "Needs Revision"}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            {t("common.pending") || "Pending"}
          </Badge>
        );
    }
  }

  // Stats
  const pendingCount = notes.filter((n) => n.status === "submitted").length;
  const approvedCount = notes.filter((n) => n.status === "approved").length;
  const totalPoints = notes
    .filter((n) => n.status === "approved")
    .reduce((sum, n) => sum + (n.points_awarded || 0), 0);

  return (
    <>
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
                {t("spiritualNotes.admin.title") || "Spiritual Notes"}
              </h1>
              <p className="text-muted-foreground">
                {t("spiritualNotes.admin.subtitle") ||
                  "Review spiritual activity submissions"}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("spiritualNotes.admin.createTemplate") || "Create Template"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {pendingCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("spiritualNotes.admin.pendingReview") || "Pending Review"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {approvedCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("common.approved") || "Approved"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {totalPoints}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("spiritualNotes.admin.pointsAwarded") || "Points Awarded"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {templates.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("spiritualNotes.admin.templates") || "Templates"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submissions">
              <Heart className="h-4 w-4 mr-2" />
              {t("spiritualNotes.admin.submissions") || "Submissions"} (
              {notes.length})
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Sparkles className="h-4 w-4 mr-2" />
              {t("spiritualNotes.admin.templates") || "Templates"} (
              {templates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    t("spiritualNotes.admin.searchPlaceholder") ||
                    "Search by student or title..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as SubmissionStatus | "all")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("common.status") || "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.allStatus") || "All Status"}
                  </SelectItem>
                  <SelectItem value="submitted">
                    {t("common.pending") || "Pending"}
                  </SelectItem>
                  <SelectItem value="approved">
                    {t("common.approved") || "Approved"}
                  </SelectItem>
                  <SelectItem value="rejected">
                    {t("common.rejected") || "Rejected"}
                  </SelectItem>
                  <SelectItem value="needs_revision">
                    {t("common.needsRevision") || "Needs Revision"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) =>
                  setTypeFilter(v as SpiritualActivityType | "all")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue
                    placeholder={t("spiritualNotes.type") || "Type"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.allTypes") || "All Types"}
                  </SelectItem>
                  <SelectItem value="prayer">
                    {t("spiritualNotes.types.prayer") || "Prayer"}
                  </SelectItem>
                  <SelectItem value="mass">
                    {t("spiritualNotes.types.mass") || "Mass"}
                  </SelectItem>
                  <SelectItem value="confession">
                    {t("spiritualNotes.types.confession") || "Confession"}
                  </SelectItem>
                  <SelectItem value="fasting">
                    {t("spiritualNotes.types.fasting") || "Fasting"}
                  </SelectItem>
                  <SelectItem value="bible_reading">
                    {t("spiritualNotes.types.bibleReading") || "Bible Reading"}
                  </SelectItem>
                  <SelectItem value="charity">
                    {t("spiritualNotes.types.charity") || "Charity"}
                  </SelectItem>
                  <SelectItem value="other">
                    {t("spiritualNotes.types.other") || "Other"}
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedIds.length > 0 && (
                <Button onClick={handleBulkApprove} disabled={isReviewing}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t("spiritualNotes.admin.approveSelected") ||
                    "Approve Selected"}{" "}
                  ({selectedIds.length})
                </Button>
              )}
            </div>

            {/* Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length ===
                            filteredNotes.filter(
                              (n) => n.status === "submitted"
                            ).length && selectedIds.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredNotes
                                .filter((n) => n.status === "submitted")
                                .map((n) => n.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>
                      {t("spiritualNotes.admin.student") || "Student"}
                    </TableHead>
                    <TableHead>{t("spiritualNotes.type") || "Type"}</TableHead>
                    <TableHead>{t("common.title") || "Title"}</TableHead>
                    <TableHead>{t("common.date") || "Date"}</TableHead>
                    <TableHead>{t("common.points") || "Points"}</TableHead>
                    <TableHead>{t("common.status") || "Status"}</TableHead>
                    <TableHead className="text-right">
                      {t("common.actions") || "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {t("spiritualNotes.admin.noNotes") ||
                          "No spiritual notes found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>
                          {note.status === "submitted" && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(note.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds([...selectedIds, note.id]);
                                } else {
                                  setSelectedIds(
                                    selectedIds.filter((id) => id !== note.id)
                                  );
                                }
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {note.user?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {note.activity_type.replace("_", " ")}
                        </TableCell>
                        <TableCell>{note.title || "-"}</TableCell>
                        <TableCell>
                          {new Date(note.activity_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{note.points_requested}</TableCell>
                        <TableCell>{getStatusBadge(note.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedNote(note)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name") || "Name"}</TableHead>
                    <TableHead>{t("spiritualNotes.type") || "Type"}</TableHead>
                    <TableHead>{t("common.points") || "Points"}</TableHead>
                    <TableHead>
                      {t("spiritualNotes.admin.maxPerDay") || "Max/Day"}
                    </TableHead>
                    <TableHead>
                      {t("spiritualNotes.admin.requiresApproval") ||
                        "Requires Approval"}
                    </TableHead>
                    <TableHead>{t("common.status") || "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {t("spiritualNotes.admin.noTemplates") ||
                          "No templates found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {template.activity_type.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          {template.base_points} {t("common.pts") || "pts"}
                        </TableCell>
                        <TableCell>{template.max_per_day || "-"}</TableCell>
                        <TableCell>
                          {template.requires_approval ? (
                            <Badge variant="outline">
                              {t("common.yes") || "Yes"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {t("common.no") || "No"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {template.is_active ? (
                            <Badge className="bg-green-500/10 text-green-700">
                              {t("common.active") || "Active"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {t("common.inactive") || "Inactive"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("spiritualNotes.admin.reviewNote") || "Review Spiritual Note"}
            </DialogTitle>
            <DialogDescription>
              {t("spiritualNotes.admin.reviewNoteDesc") ||
                "Review and approve or reject this submission"}
            </DialogDescription>
          </DialogHeader>

          {selectedNote && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    {t("spiritualNotes.admin.student") || "Student"}
                  </p>
                  <p className="font-medium">
                    {selectedNote.user?.full_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("spiritualNotes.type") || "Activity Type"}
                  </p>
                  <p className="font-medium capitalize">
                    {selectedNote.activity_type.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("common.date") || "Date"}
                  </p>
                  <p className="font-medium">
                    {new Date(selectedNote.activity_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t("spiritualNotes.admin.pointsRequested") ||
                      "Points Requested"}
                  </p>
                  <p className="font-medium">{selectedNote.points_requested}</p>
                </div>
              </div>

              {selectedNote.title && (
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t("common.title") || "Title"}
                  </p>
                  <p className="font-medium">{selectedNote.title}</p>
                </div>
              )}

              {selectedNote.description && (
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t("common.description") || "Description"}
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedNote.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm mb-2">
                  {t("spiritualNotes.admin.reviewNotesOptional") ||
                    "Review Notes (Optional)"}
                </p>
                <Textarea
                  placeholder={
                    t("spiritualNotes.admin.feedbackPlaceholder") ||
                    "Add feedback for the student..."
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedNote(null)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            {selectedNote?.status === "submitted" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(false)}
                  disabled={isReviewing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("common.reject") || "Reject"}
                </Button>
                <Button
                  onClick={() => handleReview(true)}
                  disabled={isReviewing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t("common.approve") || "Approve"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {t("spiritualNotes.admin.createTemplate") ||
                "Create Activity Template"}
            </DialogTitle>
            <DialogDescription>
              {t("spiritualNotes.admin.createTemplateDesc") ||
                "Create a new spiritual activity template for students to use"}
            </DialogDescription>
          </DialogHeader>

          <Form {...templateForm}>
            <form
              onSubmit={templateForm.handleSubmit(handleCreateTemplate)}
              className="space-y-4"
            >
              <FormField
                control={templateForm.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("spiritualNotes.type") || "Activity Type"} *
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
                        <SelectItem value="prayer">
                          {t("spiritualNotes.types.prayer") || "Prayer"}
                        </SelectItem>
                        <SelectItem value="mass">
                          {t("spiritualNotes.types.mass") || "Mass"}
                        </SelectItem>
                        <SelectItem value="confession">
                          {t("spiritualNotes.types.confession") || "Confession"}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.name") || "Name"} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            t("spiritualNotes.admin.templateNamePlaceholder") ||
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
                  control={templateForm.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("common.nameAr") || "Name (Arabic)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            t(
                              "spiritualNotes.admin.templateNameArPlaceholder"
                            ) || "الاسم بالعربية"
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
                control={templateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("common.description") || "Description"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          t("spiritualNotes.admin.templateDescPlaceholder") ||
                          "Describe this activity..."
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
                  control={templateForm.control}
                  name="base_points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        {t("spiritualNotes.admin.basePoints") || "Base Points"}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="max_per_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("spiritualNotes.admin.maxPerDay") || "Max per Day"}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={10} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("spiritualNotes.admin.maxPerDayHelp") ||
                          "Limit submissions per student per day"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="requires_approval"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel>
                        {t("spiritualNotes.admin.requiresApproval") ||
                          "Requires Approval"}
                      </FormLabel>
                      <FormDescription>
                        {t("spiritualNotes.admin.requiresApprovalHelp") ||
                          "If enabled, submissions need teacher approval"}
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
                  disabled={templateForm.formState.isSubmitting}
                >
                  {templateForm.formState.isSubmitting
                    ? t("common.creating") || "Creating..."
                    : t("spiritualNotes.admin.createTemplate") ||
                      "Create Template"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
