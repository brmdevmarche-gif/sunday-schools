"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  ExternalLink,
  AlertCircle,
  Users,
  Award,
  Send,
} from "lucide-react";
import { submitToCompetitionAction } from "../actions";
import type {
  CompetitionWithStats,
  CreateCompetitionSubmissionInput,
} from "@/lib/types";

const textSubmissionSchema = z.object({
  text_content: z
    .string()
    .min(10, "Submission must be at least 10 characters")
    .max(10000, "Submission must be less than 10,000 characters"),
});

type TextSubmissionFormData = z.infer<typeof textSubmissionSchema>;

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface CompetitionDetailClientProps {
  competition: CompetitionWithStats;
  userProfile: UserProfile;
}

export default function CompetitionDetailClient({
  competition,
  userProfile,
}: CompetitionDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textForm = useForm<TextSubmissionFormData>({
    resolver: zodResolver(textSubmissionSchema),
    defaultValues: {
      text_content: "",
    },
  });

  const now = new Date();
  const startDate = new Date(competition.start_date);
  const endDate = new Date(competition.end_date);
  const isActive = competition.status === "active" && startDate <= now && endDate >= now;
  const hasNotStarted = startDate > now;
  const hasEnded = endDate < now;
  const hasSubmitted = !!competition.my_submission;

  // Calculate time remaining
  const timeRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  // Calculate progress percentage for the competition timeline
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  function getStatusBadge() {
    if (hasSubmitted) {
      const status = competition.my_submission?.status;
      switch (status) {
        case "submitted":
          return <Badge className="bg-blue-500/10 text-blue-700">{t("competitions.status.submitted")}</Badge>;
        case "approved":
          return <Badge className="bg-green-500/10 text-green-700">{t("competitions.status.approved")}</Badge>;
        case "rejected":
          return <Badge className="bg-red-500/10 text-red-700">{t("competitions.status.rejected")}</Badge>;
        case "needs_revision":
          return <Badge className="bg-amber-500/10 text-amber-700">{t("competitions.status.needsRevision")}</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    }
    if (hasEnded) {
      return <Badge variant="secondary">{t("competitions.ended")}</Badge>;
    }
    if (hasNotStarted) {
      return <Badge className="bg-purple-500/10 text-purple-700">{t("competitions.upcoming")}</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-green-500/10 text-green-700">{t("competitions.active")}</Badge>;
    }
    return <Badge variant="outline">{competition.status}</Badge>;
  }

  async function handleTextSubmit(data: TextSubmissionFormData) {
    try {
      const input: CreateCompetitionSubmissionInput = {
        competition_id: competition.id,
        text_content: data.text_content,
      };

      const result = await submitToCompetitionAction(input);

      if (result.success) {
        toast.success(t("competitions.submissionSuccess") || "Submission successful!");
        setShowSubmitDialog(false);
        textForm.reset();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function handlePdfSubmit() {
    if (!selectedFile) {
      setFileError(t("competitions.pleaseSelectFile") || "Please select a file to upload");
      return;
    }
    setFileError(null);

    // For now, file upload is not implemented
    toast.error("File upload not yet implemented");
  }

  function handleDialogChange(open: boolean) {
    setShowSubmitDialog(open);
    if (!open) {
      textForm.reset();
      setSelectedFile(null);
      setFileError(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error(t("competitions.pdfOnly") || "Only PDF files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("competitions.fileTooLarge") || "File must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
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
              onClick={() => router.push('/activities/competitions')}
              aria-label={t("common.back") || "Back"}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{competition.name}</h1>
                {getStatusBadge()}
              </div>
              {competition.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {competition.description}
                </p>
              )}
            </div>
          </div>

          {/* Timeline Progress */}
          {!hasEnded && !hasNotStarted && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("competitions.timeline") || "Timeline"}
                </span>
                <span className="font-medium text-amber-600">
                  {daysRemaining > 0 && `${daysRemaining}d `}
                  {hoursRemaining}h {t("competitions.remaining") || "remaining"}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{startDate.toLocaleDateString()}</span>
                <span>{endDate.toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Trophy className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{competition.base_points}</p>
                  <p className="text-xs text-muted-foreground">{t("competitions.basePoints") || "Base Points"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{competition.submissions_count || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("competitions.submissions") || "Submissions"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">{startDate.toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{t("competitions.startDate") || "Start Date"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">{endDate.toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{t("competitions.endDate") || "End Date"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prizes Section */}
        {(competition.first_place_bonus || competition.second_place_bonus || competition.third_place_bonus) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                {t("competitions.prizes") || "Prizes"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {competition.first_place_bonus && (
                  <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-bold text-amber-700">{t("competitions.firstPlace") || "1st Place"}</p>
                    <p className="text-xl font-bold text-amber-600">+{competition.first_place_bonus}</p>
                    <p className="text-xs text-muted-foreground">{t("common.bonusPoints") || "bonus points"}</p>
                  </div>
                )}
                {competition.second_place_bonus && (
                  <div className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-bold text-gray-600 dark:text-gray-400">{t("competitions.secondPlace") || "2nd Place"}</p>
                    <p className="text-xl font-bold text-gray-600">+{competition.second_place_bonus}</p>
                    <p className="text-xs text-muted-foreground">{t("common.bonusPoints") || "bonus points"}</p>
                  </div>
                )}
                {competition.third_place_bonus && (
                  <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                    <Trophy className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                    <p className="font-bold text-orange-600">{t("competitions.thirdPlace") || "3rd Place"}</p>
                    <p className="text-xl font-bold text-orange-500">+{competition.third_place_bonus}</p>
                    <p className="text-xs text-muted-foreground">{t("common.bonusPoints") || "bonus points"}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {competition.instructions && (
          <Card>
            <CardHeader>
              <CardTitle>{t("competitions.instructions") || "Instructions"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{competition.instructions}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Guidelines */}
        {competition.submission_guidelines && (
          <Card>
            <CardHeader>
              <CardTitle>{t("competitions.submissionGuidelines") || "Submission Guidelines"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{competition.submission_guidelines}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Submission Status */}
        {hasSubmitted && competition.my_submission && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {t("competitions.mySubmission") || "My Submission"}
              </CardTitle>
              <CardDescription>
                {t("competitions.submittedOn") || "Submitted on"}{" "}
                {new Date(competition.my_submission.submitted_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("competitions.status") || "Status"}</span>
                {getStatusBadge()}
              </div>

              {competition.my_submission.text_content && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("competitions.yourText") || "Your submission"}</p>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{competition.my_submission.text_content}</p>
                  </div>
                </div>
              )}

              {competition.my_submission.score !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("competitions.score") || "Score"}</span>
                  <span className="font-bold text-lg">{competition.my_submission.score}</span>
                </div>
              )}

              {competition.my_submission.ranking !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("competitions.ranking") || "Ranking"}</span>
                  <Badge className="bg-amber-500/10 text-amber-700">
                    #{competition.my_submission.ranking}
                  </Badge>
                </div>
              )}

              {competition.my_submission.points_awarded > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("competitions.pointsEarned") || "Points Earned"}</span>
                  <span className="font-bold text-green-600">+{competition.my_submission.points_awarded}</span>
                </div>
              )}

              {competition.my_submission.feedback && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("competitions.feedback") || "Feedback"}</p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm">{competition.my_submission.feedback}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button or Status */}
        <div className="sticky bottom-4">
          {isActive && !hasSubmitted && (
            <Card className="border-2 border-primary shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("competitions.readyToSubmit") || "Ready to submit?"}</p>
                    <p className="text-sm text-muted-foreground">
                      {competition.submission_type === "text" && (t("competitions.textSubmission") || "Write your submission")}
                      {competition.submission_type === "pdf_upload" && (t("competitions.pdfSubmission") || "Upload a PDF file")}
                      {competition.submission_type === "google_form" && (t("competitions.formSubmission") || "Fill out the Google Form")}
                    </p>
                  </div>
                  {competition.submission_type === "google_form" && competition.google_form_url ? (
                    <Button asChild>
                      <a href={competition.google_form_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t("competitions.openForm") || "Open Form"}
                      </a>
                    </Button>
                  ) : (
                    <Button onClick={() => setShowSubmitDialog(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      {t("competitions.submit") || "Submit"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {hasNotStarted && (
            <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-700">{t("competitions.notStarted") || "Competition hasn't started yet"}</p>
                    <p className="text-sm text-purple-600">
                      {t("competitions.startsOn") || "Starts on"} {startDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {hasEnded && !hasSubmitted && (
            <Card className="bg-gray-100 dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{t("competitions.competitionEnded") || "Competition has ended"}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("competitions.endedOn") || "Ended on"} {endDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {competition.submission_type === "text" && <FileText className="h-5 w-5" />}
              {competition.submission_type === "pdf_upload" && <Upload className="h-5 w-5" />}
              {t("competitions.submitEntry") || "Submit Your Entry"}
            </DialogTitle>
            <DialogDescription>
              {competition.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {competition.submission_type === "text" && (
              <Form {...textForm}>
                <form onSubmit={textForm.handleSubmit(handleTextSubmit)} className="space-y-4">
                  <FormField
                    control={textForm.control}
                    name="text_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("competitions.yourSubmission") || "Your Submission"}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("competitions.textPlaceholder") || "Write your submission here..."}
                            rows={8}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex justify-between items-center">
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            {field.value.length} {t("common.characters") || "characters"}
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <span className="text-sm">
                      {t("competitions.earnUpTo") || "Earn up to"}{" "}
                      <strong className="text-amber-600">
                        +{competition.base_points + (competition.first_place_bonus || 0)} {t("common.points") || "points"}
                      </strong>
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={textForm.formState.isSubmitting}
                  >
                    {textForm.formState.isSubmitting ? (
                      t("competitions.submitting") || "Submitting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("competitions.submitNow") || "Submit Now"}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {competition.submission_type === "pdf_upload" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("competitions.uploadPdf") || "Upload PDF"}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors ${
                      fileError ? "border-destructive" : ""
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t("competitions.clickToUpload") || "Click to select a PDF file"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("competitions.maxFileSize") || "Max file size: 10MB"}
                        </p>
                      </>
                    )}
                  </button>
                  {fileError && (
                    <p className="text-sm text-destructive">{fileError}</p>
                  )}
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  <span className="text-sm">
                    {t("competitions.earnUpTo") || "Earn up to"}{" "}
                    <strong className="text-amber-600">
                      +{competition.base_points + (competition.first_place_bonus || 0)} {t("common.points") || "points"}
                    </strong>
                  </span>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handlePdfSubmit}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t("competitions.submitNow") || "Submit Now"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
