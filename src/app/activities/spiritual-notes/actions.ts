"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  updateStreakAction,
  checkAndAwardBadgesAction,
} from "@/app/gamification/actions";
import type {
  SpiritualNote,
  SpiritualNoteWithDetails,
  SpiritualActivityTemplate,
  CreateSpiritualNoteInput,
  UpdateSpiritualNoteInput,
  ReviewSpiritualNoteInput,
  SpiritualNoteFilters,
  SpiritualNotesStats,
  ActionResult,
  BulkActionResult,
  SubmissionStatus,
} from "@/lib/types";

// =====================================================
// SPIRITUAL ACTIVITY TEMPLATES
// =====================================================

/**
 * Get available spiritual activity templates for the current user
 */
export async function getSpiritualActivityTemplatesAction(): Promise<
  ActionResult<SpiritualActivityTemplate[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("spiritual_activity_templates")
    .select("*")
    .eq("is_active", true)
    .order("activity_type", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Create a new spiritual activity template (admin only)
 */
export async function createSpiritualActivityTemplateAction(
  input: Omit<SpiritualActivityTemplate, "id" | "created_at" | "updated_at" | "created_by">
): Promise<ActionResult<SpiritualActivityTemplate>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is admin
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
    .from("spiritual_activity_templates")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/spiritual-notes/templates");
  return { success: true, data };
}

/**
 * Update a spiritual activity template (admin only)
 */
export async function updateSpiritualActivityTemplateAction(
  id: string,
  input: Partial<SpiritualActivityTemplate>
): Promise<ActionResult<SpiritualActivityTemplate>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("spiritual_activity_templates")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/spiritual-notes/templates");
  return { success: true, data };
}

// =====================================================
// SPIRITUAL NOTES - USER ACTIONS
// =====================================================

/**
 * Create a new spiritual note
 */
export async function createSpiritualNoteAction(
  input: CreateSpiritualNoteInput
): Promise<ActionResult<SpiritualNote>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's class assignment for scoping
  const { data: userProfile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!userProfile) {
    return { success: false, error: "User profile not found" };
  }

  // Get points from template if specified
  let pointsRequested = 0;
  if (input.activity_template_id) {
    const { data: template } = await supabase
      .from("spiritual_activity_templates")
      .select("base_points")
      .eq("id", input.activity_template_id)
      .single();

    if (template) {
      pointsRequested = template.base_points;
    }
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("spiritual_notes")
    .insert({
      user_id: user.id,
      activity_type: input.activity_type,
      custom_type: input.custom_type,
      activity_template_id: input.activity_template_id,
      title: input.title,
      description: input.description,
      activity_date: input.activity_date,
      class_id: input.class_id,
      points_requested: pointsRequested,
      status: "submitted",
    })
    .select()
    .single();

  if (error) {
    // Check for daily limit error
    if (error.message.includes("Daily limit reached")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: `Failed to create spiritual note: ${error.message}` };
  }

  revalidatePath("/activities/spiritual-notes");
  return { success: true, data };
}

/**
 * Update a spiritual note (only if pending/draft/needs_revision)
 */
export async function updateSpiritualNoteAction(
  input: UpdateSpiritualNoteInput
): Promise<ActionResult<SpiritualNote>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership and status
  const { data: existing } = await supabase
    .from("spiritual_notes")
    .select("user_id, status")
    .eq("id", input.id)
    .single();

  if (!existing) {
    return { success: false, error: "Spiritual note not found" };
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!["draft", "submitted", "needs_revision"].includes(existing.status)) {
    return { success: false, error: "Cannot edit a reviewed note" };
  }

  const adminClient = createAdminClient();

  const { id, ...updateData } = input;

  const { data, error } = await adminClient
    .from("spiritual_notes")
    .update({
      ...updateData,
      status: "submitted", // Re-submit after edit
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/activities/spiritual-notes");
  return { success: true, data };
}

/**
 * Delete a spiritual note (only drafts)
 */
export async function deleteSpiritualNoteAction(
  noteId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership and status
  const { data: existing } = await supabase
    .from("spiritual_notes")
    .select("user_id, status")
    .eq("id", noteId)
    .single();

  if (!existing) {
    return { success: false, error: "Spiritual note not found" };
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (existing.status !== "draft") {
    return { success: false, error: "Only draft notes can be deleted" };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("spiritual_notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/activities/spiritual-notes");
  return { success: true };
}

/**
 * Get user's spiritual notes
 */
export async function getMySpiritualNotesAction(
  filters?: SpiritualNoteFilters
): Promise<ActionResult<SpiritualNoteWithDetails[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  let query = supabase
    .from("spiritual_notes")
    .select(
      `
      *,
      template:spiritual_activity_templates(*)
    `
    )
    .eq("user_id", user.id)
    .order("activity_date", { ascending: false });

  // Apply filters
  if (filters?.activity_type) {
    query = query.eq("activity_type", filters.activity_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.date_from) {
    query = query.gte("activity_date", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("activity_date", filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

// =====================================================
// SPIRITUAL NOTES - ADMIN ACTIONS
// =====================================================

/**
 * Get spiritual notes for review (admin/teacher)
 */
export async function getSpiritualNotesForReviewAction(
  filters?: SpiritualNoteFilters
): Promise<ActionResult<SpiritualNoteWithDetails[]>> {
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

  let query = adminClient
    .from("spiritual_notes")
    .select(
      `
      *,
      template:spiritual_activity_templates(*),
      user:users!user_id(id, full_name, email, user_code),
      reviewer:users!reviewed_by(id, full_name)
    `
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters?.activity_type) {
    query = query.eq("activity_type", filters.activity_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.class_id) {
    query = query.eq("class_id", filters.class_id);
  }
  if (filters?.date_from) {
    query = query.gte("activity_date", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("activity_date", filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Review a spiritual note (approve/reject)
 */
export async function reviewSpiritualNoteAction(
  input: ReviewSpiritualNoteInput
): Promise<ActionResult<SpiritualNote>> {
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

  // Get the note to determine points
  const { data: note } = await adminClient
    .from("spiritual_notes")
    .select("points_requested, user_id")
    .eq("id", input.note_id)
    .single();

  if (!note) {
    return { success: false, error: "Spiritual note not found" };
  }

  const newStatus: SubmissionStatus = input.approved ? "approved" : "rejected";
  const pointsAwarded = input.approved
    ? input.points_awarded ?? note.points_requested
    : 0;

  const { data, error } = await adminClient
    .from("spiritual_notes")
    .update({
      status: newStatus,
      points_awarded: pointsAwarded,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: input.review_notes,
    })
    .eq("id", input.note_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Award points if approved
  if (input.approved && pointsAwarded > 0) {
    await adminClient.rpc("add_points", {
      p_user_id: note.user_id,
      p_points: pointsAwarded,
      p_transaction_type: "spiritual_note",
      p_notes: `Spiritual note: ${data.activity_type}`,
      p_created_by: user.id,
    });

    // Update spiritual notes streak and check for badges
    await updateStreakAction(note.user_id, "spiritual_notes");
    await checkAndAwardBadgesAction(note.user_id);
  }

  revalidatePath("/admin/activities/spiritual-notes");
  revalidatePath("/activities/spiritual-notes");
  return { success: true, data };
}

/**
 * Bulk approve spiritual notes
 */
export async function bulkApproveSpiritualNotesAction(
  noteIds: string[]
): Promise<BulkActionResult> {
  const results = await Promise.allSettled(
    noteIds.map((id) =>
      reviewSpiritualNoteAction({ note_id: id, approved: true })
    )
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failedCount = results.filter((r) => r.status === "rejected").length;

  revalidatePath("/admin/activities/spiritual-notes");
  return { success: true, successCount, failedCount };
}

/**
 * Request revision for a spiritual note
 */
export async function requestRevisionAction(
  noteId: string,
  reviewNotes: string
): Promise<ActionResult<SpiritualNote>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("spiritual_notes")
    .update({
      status: "needs_revision" as SubmissionStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
    })
    .eq("id", noteId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/spiritual-notes");
  return { success: true, data };
}

/**
 * Get spiritual notes statistics
 */
export async function getSpiritualNotesStatsAction(
  filters?: { class_id?: string; date_from?: string; date_to?: string }
): Promise<ActionResult<SpiritualNotesStats>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  let query = adminClient.from("spiritual_notes").select("status, activity_type, points_awarded");

  if (filters?.class_id) {
    query = query.eq("class_id", filters.class_id);
  }
  if (filters?.date_from) {
    query = query.gte("activity_date", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("activity_date", filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const stats: SpiritualNotesStats = {
    total_submissions: data?.length || 0,
    pending_count: data?.filter((n) => n.status === "submitted").length || 0,
    approved_count: data?.filter((n) => n.status === "approved").length || 0,
    rejected_count: data?.filter((n) => n.status === "rejected").length || 0,
    total_points_awarded:
      data?.reduce((sum, n) => sum + (n.points_awarded || 0), 0) || 0,
    by_type: {
      prayer: data?.filter((n) => n.activity_type === "prayer").length || 0,
      mass: data?.filter((n) => n.activity_type === "mass").length || 0,
      confession: data?.filter((n) => n.activity_type === "confession").length || 0,
      fasting: data?.filter((n) => n.activity_type === "fasting").length || 0,
      bible_reading: data?.filter((n) => n.activity_type === "bible_reading").length || 0,
      charity: data?.filter((n) => n.activity_type === "charity").length || 0,
      other: data?.filter((n) => n.activity_type === "other").length || 0,
    },
  };

  return { success: true, data: stats };
}
