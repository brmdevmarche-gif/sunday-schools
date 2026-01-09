"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  FileText,
  Upload,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Medal,
} from "lucide-react";
import type {
  CompetitionWithStats,
  CompetitionSubmissionWithDetails,
} from "@/lib/types";

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
}

interface CompetitionsClientProps {
  competitions: CompetitionWithStats[];
  mySubmissions: CompetitionSubmissionWithDetails[];
  userProfile: UserProfile;
}

export default function CompetitionsClient({
  competitions,
  mySubmissions,
  userProfile,
}: CompetitionsClientProps) {
  const t = useTranslations();
  const router = useRouter();

  const now = new Date();

  function isActive(comp: CompetitionWithStats) {
    return (
      comp.status === "active" &&
      new Date(comp.start_date) <= now &&
      new Date(comp.end_date) >= now
    );
  }

  function getTimeRemaining(endDate: string) {
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return t("competitions.ended") || "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} ${t("common.days") || "days"} ${t("competitions.remaining") || "remaining"}`;
    return `${hours} ${t("common.hours") || "hours"} ${t("competitions.remaining") || "remaining"}`;
  }

  function getStatusBadge(status: string, ranking?: number | null) {
    if (ranking && ranking <= 3) {
      const colors = {
        1: "bg-yellow-500/20 text-yellow-700 border-yellow-300",
        2: "bg-gray-300/20 text-gray-700 border-gray-300",
        3: "bg-amber-600/20 text-amber-700 border-amber-300",
      };
      const icons = {
        1: <Medal className="h-3 w-3 mr-1" />,
        2: <Medal className="h-3 w-3 mr-1" />,
        3: <Medal className="h-3 w-3 mr-1" />,
      };
      return (
        <Badge className={colors[ranking as 1 | 2 | 3]}>
          {icons[ranking as 1 | 2 | 3]}
          {ranking === 1
            ? t("competitions.firstPlace") || "1st Place"
            : ranking === 2
            ? t("competitions.secondPlace") || "2nd Place"
            : t("competitions.thirdPlace") || "3rd Place"}
        </Badge>
      );
    }

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
            {t("status.pending") || "Under Review"}
          </Badge>
        );
    }
  }

  const activeCompetitions = competitions.filter((c) => isActive(c));
  const upcomingCompetitions = competitions.filter(
    (c) => c.status === "active" && new Date(c.start_date) > now
  );

  // Stats
  const totalPoints = mySubmissions
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + (s.points_awarded || 0), 0);
  const participationCount = mySubmissions.length;
  const wins = mySubmissions.filter((s) => s.ranking && s.ranking <= 3).length;

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/activities')}
              aria-label={t("common.back") || "Back"}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {t("competitions.title") || "Competitions"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("competitions.description") || "Participate in contests and earn points"}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{totalPoints}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("competitions.totalPoints") || "Points Earned"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{participationCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("competitions.participations") || "Participations"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{wins}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("competitions.podiumFinishes") || "Top 3 Finishes"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              {t("competitions.active") || "Active"} ({activeCompetitions.length})
            </TabsTrigger>
            <TabsTrigger value="my-submissions">
              {t("competitions.mySubmissions") || "My Submissions"} ({mySubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeCompetitions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {t("competitions.noActive") || "No active competitions"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("competitions.checkBack") || "Check back later for new contests"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeCompetitions.map((comp) => (
                  <CompetitionCard
                    key={comp.id}
                    competition={comp}
                    timeRemaining={getTimeRemaining(comp.end_date)}
                    onViewDetails={() => router.push(`/activities/competitions/${comp.id}`)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-submissions" className="space-y-4">
            {mySubmissions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {t("competitions.noSubmissions") || "No submissions yet"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("competitions.startParticipating") || "Start participating in competitions"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {mySubmissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {submission.competition?.name || "Competition"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("competitions.submittedOn") || "Submitted"}:{" "}
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                          {submission.feedback && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <span className="font-medium">{t("competitions.feedback") || "Feedback"}:</span>{" "}
                              {submission.feedback}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(submission.status, submission.ranking)}
                          {submission.status === "approved" && submission.points_awarded > 0 && (
                            <p className="text-sm font-medium text-green-600">
                              +{submission.points_awarded} pts
                            </p>
                          )}
                          {submission.score !== null && (
                            <p className="text-sm text-muted-foreground">
                              {t("competitions.score") || "Score"}: {submission.score}/100
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function CompetitionCard({
  competition,
  timeRemaining,
  onViewDetails,
  t,
}: {
  competition: CompetitionWithStats;
  timeRemaining: string;
  onViewDetails: () => void;
  t: (key: string) => string;
}) {
  const hasSubmitted = !!competition.my_submission;
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors" onClick={onViewDetails}>
      {/* Image or Placeholder */}
      <div className="aspect-video bg-muted overflow-hidden">
        {competition.image_url && !imageError ? (
          <img
            src={competition.image_url}
            alt={competition.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-amber-500/10 to-amber-600/20">
            <Trophy className="h-12 w-12 text-amber-500/50" />
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{competition.name}</CardTitle>
            <CardDescription className="mt-1">{competition.description}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>{competition.base_points} {t("common.points") || "points"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {t("competitions.ends") || "Ends"}: {new Date(competition.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {hasSubmitted ? (
          <Badge className="w-full justify-center py-2 bg-green-500/10 text-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t("competitions.submitted") || "Already Submitted"}
          </Badge>
        ) : (
          <Badge className="w-full justify-center py-2" variant="outline">
            {competition.submission_type === "text" && <FileText className="h-4 w-4 mr-2" />}
            {competition.submission_type === "pdf_upload" && <Upload className="h-4 w-4 mr-2" />}
            {competition.submission_type === "google_form" && <ExternalLink className="h-4 w-4 mr-2" />}
            {t("competitions.clickToParticipate") || "Click to participate"}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
