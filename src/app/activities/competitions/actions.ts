"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { checkAndAwardBadgesAction } from "@/app/gamification/actions";
import type {
  Competition,
  CompetitionWithStats,
  CompetitionSubmission,
  CompetitionSubmissionWithDetails,
  CreateCompetitionInput,
  UpdateCompetitionInput,
  CreateCompetitionSubmissionInput,
  UpdateCompetitionSubmissionInput,
  ReviewCompetitionSubmissionInput,
  BulkRankSubmissionsInput,
  CompetitionFilters,
  CompetitionSubmissionFilters,
  CompetitionStats,
  ActionResult,
  BulkActionResult,
  SubmissionStatus,
  ActivityStatus,
} from "@/lib/types";

// =====================================================
// COMPETITIONS - USER ACTIONS
// =====================================================

/**
 * Get available competitions for the current user
 */
export async function getCompetitionsAction(
  filters?: CompetitionFilters
): Promise<ActionResult<CompetitionWithStats[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  let query = supabase
    .from("competitions")
    .select("*")
    .order("start_date", { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.active_only) {
    query = query.eq("status", "active");
  }
  if (filters?.submission_type) {
    query = query.eq("submission_type", filters.submission_type);
  }

  const { data: competitions, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Get user's submissions for these competitions
  const competitionIds = competitions?.map((c) => c.id) || [];

  const { data: mySubmissions } = await supabase
    .from("competition_submissions")
    .select("*")
    .eq("user_id", user.id)
    .in("competition_id", competitionIds);

  // Combine data
  const competitionsWithStats: CompetitionWithStats[] = (competitions || []).map(
    (comp) => ({
      ...comp,
      my_submission: mySubmissions?.find((s) => s.competition_id === comp.id),
    })
  );

  return { success: true, data: competitionsWithStats };
}

/**
 * Get a single competition with details
 */
export async function getCompetitionByIdAction(
  competitionId: string
): Promise<ActionResult<CompetitionWithStats>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: competition, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", competitionId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Get user's submission
  const { data: mySubmission } = await supabase
    .from("competition_submissions")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("user_id", user.id)
    .single();

  // Get submission counts
  const adminClient = createAdminClient();
  const { data: submissions } = await adminClient
    .from("competition_submissions")
    .select("status")
    .eq("competition_id", competitionId);

  const result: CompetitionWithStats = {
    ...competition,
    my_submission: mySubmission || undefined,
    submissions_count: submissions?.length || 0,
    pending_count: submissions?.filter((s) => s.status === "submitted").length || 0,
    approved_count: submissions?.filter((s) => s.status === "approved").length || 0,
  };

  return { success: true, data: result };
}

/**
 * Submit to a competition
 */
export async function submitToCompetitionAction(
  input: CreateCompetitionSubmissionInput
): Promise<ActionResult<CompetitionSubmission>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if competition is active and within date range
  const { data: competition } = await supabase
    .from("competitions")
    .select("status, start_date, end_date, max_submissions")
    .eq("id", input.competition_id)
    .single();

  if (!competition) {
    return { success: false, error: "Competition not found" };
  }

  if (competition.status !== "active") {
    return { success: false, error: "Competition is not active" };
  }

  const now = new Date();
  if (new Date(competition.start_date) > now) {
    return { success: false, error: "Competition has not started yet" };
  }
  if (new Date(competition.end_date) < now) {
    return { success: false, error: "Competition has ended" };
  }

  // Check if user already submitted
  const { data: existing } = await supabase
    .from("competition_submissions")
    .select("id")
    .eq("competition_id", input.competition_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "You have already submitted to this competition" };
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("competition_submissions")
    .insert({
      competition_id: input.competition_id,
      user_id: user.id,
      text_content: input.text_content,
      file_url: input.file_url,
      file_name: input.file_name,
      file_size: input.file_size,
      google_form_response_id: input.google_form_response_id,
      status: "submitted",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/activities/competitions");
  revalidatePath(`/activities/competitions/${input.competition_id}`);
  return { success: true, data };
}

/**
 * Update a competition submission (only if draft/needs_revision)
 */
export async function updateCompetitionSubmissionAction(
  input: UpdateCompetitionSubmissionInput
): Promise<ActionResult<CompetitionSubmission>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership and status
  const { data: existing } = await supabase
    .from("competition_submissions")
    .select("user_id, status, competition_id")
    .eq("id", input.id)
    .single();

  if (!existing) {
    return { success: false, error: "Submission not found" };
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!["draft", "needs_revision"].includes(existing.status)) {
    return { success: false, error: "Cannot edit a reviewed submission" };
  }

  const adminClient = createAdminClient();

  const { id, ...updateData } = input;

  const { data, error } = await adminClient
    .from("competition_submissions")
    .update({
      ...updateData,
      status: "submitted",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/activities/competitions");
  revalidatePath(`/activities/competitions/${existing.competition_id}`);
  return { success: true, data };
}

/**
 * Get user's competition submissions
 */
export async function getMyCompetitionSubmissionsAction(): Promise<
  ActionResult<CompetitionSubmissionWithDetails[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("competition_submissions")
    .select(
      `
      *,
      competition:competitions(*)
    `
    )
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

// =====================================================
// COMPETITIONS - ADMIN ACTIONS
// =====================================================

/**
 * Create a new competition (admin only)
 */
export async function createCompetitionAction(
  input: CreateCompetitionInput
): Promise<ActionResult<Competition>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["super_admin", "diocese_admin", "church_admin", "teacher"].includes(
      profile.role
    )
  ) {
    return { success: false, error: "Unauthorized" };
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("competitions")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/competitions");
  return { success: true, data };
}

/**
 * Update a competition (admin only)
 */
export async function updateCompetitionAction(
  input: UpdateCompetitionInput
): Promise<ActionResult<Competition>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  const { id, ...updateData } = input;

  const { data, error } = await adminClient
    .from("competitions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/competitions");
  revalidatePath(`/admin/activities/competitions/${id}`);
  return { success: true, data };
}

/**
 * Delete a competition (admin only)
 */
export async function deleteCompetitionAction(
  competitionId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("competitions")
    .delete()
    .eq("id", competitionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/competitions");
  return { success: true };
}

/**
 * Get competition submissions for review
 */
export async function getCompetitionSubmissionsAction(
  filters?: CompetitionSubmissionFilters
): Promise<ActionResult<CompetitionSubmissionWithDetails[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  let query = adminClient
    .from("competition_submissions")
    .select(
      `
      *,
      competition:competitions(*),
      user:users!user_id(id, full_name, email, user_code),
      reviewer:users!reviewed_by(id, full_name)
    `
    )
    .order("submitted_at", { ascending: false });

  if (filters?.competition_id) {
    query = query.eq("competition_id", filters.competition_id);
  }
  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Review a competition submission
 */
export async function reviewCompetitionSubmissionAction(
  input: ReviewCompetitionSubmissionInput
): Promise<ActionResult<CompetitionSubmission>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Get submission and competition details
  const { data: submission } = await adminClient
    .from("competition_submissions")
    .select("user_id, competition_id")
    .eq("id", input.submission_id)
    .single();

  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  const { data: competition } = await adminClient
    .from("competitions")
    .select("base_points, first_place_bonus, second_place_bonus, third_place_bonus")
    .eq("id", submission.competition_id)
    .single();

  // Calculate points based on ranking
  let pointsAwarded = 0;
  if (input.approved && competition) {
    pointsAwarded = competition.base_points;

    // Add bonus for top 3
    if (input.ranking === 1 && competition.first_place_bonus) {
      pointsAwarded += competition.first_place_bonus;
    } else if (input.ranking === 2 && competition.second_place_bonus) {
      pointsAwarded += competition.second_place_bonus;
    } else if (input.ranking === 3 && competition.third_place_bonus) {
      pointsAwarded += competition.third_place_bonus;
    }
  }

  const newStatus: SubmissionStatus = input.approved ? "approved" : "rejected";

  const { data, error } = await adminClient
    .from("competition_submissions")
    .update({
      status: newStatus,
      score: input.score,
      ranking: input.ranking,
      points_awarded: pointsAwarded,
      feedback: input.feedback,
      feedback_ar: input.feedback_ar,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.submission_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Award points if approved
  if (input.approved && pointsAwarded > 0) {
    await adminClient.rpc("add_points", {
      p_user_id: submission.user_id,
      p_points: pointsAwarded,
      p_transaction_type: "competition_submission",
      p_notes: `Competition submission${input.ranking ? ` - Rank #${input.ranking}` : ""}`,
      p_created_by: user.id,
    });

    // Check for competition badges
    await checkAndAwardBadgesAction(submission.user_id);
  }

  revalidatePath("/admin/activities/competitions");
  revalidatePath(`/admin/activities/competitions/${submission.competition_id}`);
  return { success: true, data };
}

/**
 * Bulk set rankings for submissions
 */
export async function bulkRankSubmissionsAction(
  input: BulkRankSubmissionsInput
): Promise<BulkActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, successCount: 0, failedCount: input.rankings.length };
  }

  const adminClient = createAdminClient();

  const results = await Promise.allSettled(
    input.rankings.map(({ submission_id, ranking }) =>
      adminClient
        .from("competition_submissions")
        .update({ ranking })
        .eq("id", submission_id)
    )
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failedCount = results.filter((r) => r.status === "rejected").length;

  revalidatePath("/admin/activities/competitions");
  return { success: true, successCount, failedCount };
}

/**
 * Get competition statistics
 */
export async function getCompetitionStatsAction(
  competitionId: string
): Promise<ActionResult<CompetitionStats>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  const { data: submissions, error } = await adminClient
    .from("competition_submissions")
    .select(
      `
      *,
      user:users!user_id(id, full_name, email, user_code)
    `
    )
    .eq("competition_id", competitionId)
    .order("ranking", { ascending: true, nullsFirst: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const approved = submissions?.filter((s) => s.status === "approved") || [];
  const scores = approved.filter((s) => s.score !== null).map((s) => s.score!);

  const stats: CompetitionStats = {
    total_submissions: submissions?.length || 0,
    pending_count: submissions?.filter((s) => s.status === "submitted").length || 0,
    graded_count: approved.length,
    total_points_awarded: approved.reduce((sum, s) => sum + s.points_awarded, 0),
    average_score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    winners: {
      first: submissions?.find((s) => s.ranking === 1) || null,
      second: submissions?.find((s) => s.ranking === 2) || null,
      third: submissions?.find((s) => s.ranking === 3) || null,
    },
  };

  return { success: true, data: stats };
}

/**
 * Publish competition results (sets status to completed and awards points)
 */
export async function publishCompetitionResultsAction(
  competitionId: string
): Promise<ActionResult<Competition>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Update competition status
  const { data, error } = await adminClient
    .from("competitions")
    .update({ status: "completed" as ActivityStatus })
    .eq("id", competitionId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/competitions");
  revalidatePath("/activities/competitions");
  return { success: true, data };
}
