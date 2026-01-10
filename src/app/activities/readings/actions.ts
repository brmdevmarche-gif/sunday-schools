"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  updateStreakAction,
  checkAndAwardBadgesAction,
} from "@/app/gamification/actions";
import type {
  ReadingSchedule,
  ReadingScheduleWithStats,
  ReadingScheduleDay,
  ReadingScheduleDayWithStatus,
  UserReading,
  UserReadingWithDetails,
  CreateReadingScheduleInput,
  UpdateReadingScheduleInput,
  CreateReadingScheduleDayInput,
  BulkCreateReadingDaysInput,
  CreateUserReadingInput,
  UpdateUserReadingInput,
  ReviewUserReadingInput,
  ReadingScheduleFilters,
  UserReadingFilters,
  ReadingScheduleStats,
  ActionResult,
  BulkActionResult,
  SubmissionStatus,
} from "@/lib/types";

// =====================================================
// READING SCHEDULES - USER ACTIONS
// =====================================================

/**
 * Get available reading schedules for the current user
 */
export async function getReadingSchedulesAction(
  filters?: ReadingScheduleFilters
): Promise<ActionResult<ReadingScheduleWithStats[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  let query = supabase
    .from("reading_schedules")
    .select("*")
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  if (filters?.current_only) {
    const today = new Date().toISOString().split("T")[0];
    query = query.lte("start_date", today).gte("end_date", today);
  }

  const { data: schedules, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Get user's progress for each schedule
  const schedulesWithStats: ReadingScheduleWithStats[] = await Promise.all(
    (schedules || []).map(async (schedule) => {
      // Get total days
      const { count: totalDays } = await supabase
        .from("reading_schedule_days")
        .select("*", { count: "exact", head: true })
        .eq("schedule_id", schedule.id);

      // Get user's completed days
      const { count: completedDays } = await supabase
        .from("user_readings")
        .select("*, reading_schedule_days!inner(schedule_id)", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("reading_schedule_days.schedule_id", schedule.id);

      const total = totalDays || 0;
      const completed = completedDays || 0;

      return {
        ...schedule,
        total_days: total,
        completed_days: completed,
        my_progress: {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      };
    })
  );

  return { success: true, data: schedulesWithStats };
}

/**
 * Get a single reading schedule with days
 */
export async function getReadingScheduleByIdAction(
  scheduleId: string
): Promise<ActionResult<ReadingScheduleWithStats & { days: ReadingScheduleDayWithStatus[] }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from("reading_schedules")
    .select("*")
    .eq("id", scheduleId)
    .single();

  if (scheduleError) {
    return { success: false, error: scheduleError.message };
  }

  // Get days with user's readings
  const { data: days, error: daysError } = await supabase
    .from("reading_schedule_days")
    .select("*")
    .eq("schedule_id", scheduleId)
    .order("reading_date", { ascending: true });

  if (daysError) {
    return { success: false, error: daysError.message };
  }

  // Get user's readings for this schedule
  const dayIds = days?.map((d) => d.id) || [];
  const { data: userReadings } = await supabase
    .from("user_readings")
    .select("*")
    .eq("user_id", user.id)
    .in("schedule_day_id", dayIds);

  // Combine days with reading status
  const daysWithStatus: ReadingScheduleDayWithStatus[] = (days || []).map((day) => ({
    ...day,
    is_completed: userReadings?.some((r) => r.schedule_day_id === day.id) || false,
    my_reading: userReadings?.find((r) => r.schedule_day_id === day.id),
  }));

  const completed = daysWithStatus.filter((d) => d.is_completed).length;
  const total = daysWithStatus.length;

  return {
    success: true,
    data: {
      ...schedule,
      total_days: total,
      completed_days: completed,
      my_progress: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      days: daysWithStatus,
    },
  };
}

/**
 * Get today's reading for a schedule
 */
export async function getTodaysReadingAction(
  scheduleId: string
): Promise<ActionResult<ReadingScheduleDayWithStatus | null>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: day, error } = await supabase
    .from("reading_schedule_days")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("reading_date", today)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No reading for today
      return { success: true, data: null };
    }
    return { success: false, error: error.message };
  }

  // Check if user completed this reading
  const { data: userReading } = await supabase
    .from("user_readings")
    .select("*")
    .eq("schedule_day_id", day.id)
    .eq("user_id", user.id)
    .single();

  return {
    success: true,
    data: {
      ...day,
      is_completed: !!userReading,
      my_reading: userReading || undefined,
    },
  };
}

/**
 * Mark a reading as complete
 */
export async function completeReadingAction(
  input: CreateUserReadingInput
): Promise<ActionResult<UserReading>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if already completed
  const { data: existing } = await supabase
    .from("user_readings")
    .select("id")
    .eq("schedule_day_id", input.schedule_day_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "You have already completed this reading" };
  }

  const adminClient = createAdminClient();

  // The trigger will auto-set status and points based on schedule config
  const { data, error } = await adminClient
    .from("user_readings")
    .insert({
      schedule_day_id: input.schedule_day_id,
      user_id: user.id,
      favorite_verse_reference: input.favorite_verse_reference,
      favorite_verse_text: input.favorite_verse_text,
      favorite_verse_text_ar: input.favorite_verse_text_ar,
      reflection: input.reflection,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // If auto-approved, award points
  if (data.status === "approved" && data.points_awarded > 0) {
    await adminClient.rpc("add_points", {
      p_user_id: user.id,
      p_points: data.points_awarded,
      p_transaction_type: "reading_completion",
      p_notes: "Daily reading completed",
      p_created_by: user.id,
    });

    // Update reading streak and check for badges
    await updateStreakAction(user.id, "reading");
    await checkAndAwardBadgesAction(user.id);
  }

  revalidatePath("/activities/readings");
  return { success: true, data };
}

/**
 * Update a reading (add verse/reflection)
 */
export async function updateReadingAction(
  input: UpdateUserReadingInput
): Promise<ActionResult<UserReading>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("user_readings")
    .select("user_id")
    .eq("id", input.id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  const adminClient = createAdminClient();

  const { id, ...updateData } = input;

  const { data, error } = await adminClient
    .from("user_readings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/activities/readings");
  return { success: true, data };
}

/**
 * Get user's reading history
 */
export async function getMyReadingsAction(
  filters?: UserReadingFilters
): Promise<ActionResult<UserReadingWithDetails[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  let query = supabase
    .from("user_readings")
    .select(
      `
      *,
      schedule_day:reading_schedule_days(*),
      schedule:reading_schedule_days(
        schedule:reading_schedules(*)
      )
    `
    )
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (filters?.date_from) {
    query = query.gte("completed_at", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("completed_at", filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Calculate reading streak for user
 */
export async function getReadingStreakAction(): Promise<ActionResult<number>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's readings ordered by date
  const { data: readings, error } = await supabase
    .from("user_readings")
    .select("completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!readings || readings.length === 0) {
    return { success: true, data: 0 };
  }

  // Calculate streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = readings.map((r) => {
    const d = new Date(r.completed_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  // Remove duplicates and sort
  const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

  // Check if streak includes today or yesterday
  const msPerDay = 24 * 60 * 60 * 1000;
  const todayTime = today.getTime();
  const yesterdayTime = todayTime - msPerDay;

  if (uniqueDates[0] !== todayTime && uniqueDates[0] !== yesterdayTime) {
    return { success: true, data: 0 };
  }

  // Count consecutive days
  let expectedDate = uniqueDates[0];
  for (const date of uniqueDates) {
    if (date === expectedDate) {
      streak++;
      expectedDate -= msPerDay;
    } else {
      break;
    }
  }

  return { success: true, data: streak };
}

// =====================================================
// READING SCHEDULES - ADMIN ACTIONS
// =====================================================

/**
 * Create a new reading schedule (admin only)
 */
export async function createReadingScheduleAction(
  input: CreateReadingScheduleInput
): Promise<ActionResult<ReadingSchedule>> {
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
    .from("reading_schedules")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/readings");
  return { success: true, data };
}

/**
 * Update a reading schedule (admin only)
 */
export async function updateReadingScheduleAction(
  input: UpdateReadingScheduleInput
): Promise<ActionResult<ReadingSchedule>> {
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
    .from("reading_schedules")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/readings");
  return { success: true, data };
}

/**
 * Delete a reading schedule (admin only)
 */
export async function deleteReadingScheduleAction(
  scheduleId: string
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
    .from("reading_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/readings");
  return { success: true };
}

/**
 * Add a day to a reading schedule
 */
export async function createReadingScheduleDayAction(
  input: CreateReadingScheduleDayInput
): Promise<ActionResult<ReadingScheduleDay>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("reading_schedule_days")
    .insert(input)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/readings");
  return { success: true, data };
}

/**
 * Bulk create reading days
 */
export async function bulkCreateReadingDaysAction(
  input: BulkCreateReadingDaysInput
): Promise<BulkActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, successCount: 0, failedCount: input.days.length };
  }

  const adminClient = createAdminClient();

  const daysWithScheduleId = input.days.map((day) => ({
    ...day,
    schedule_id: input.schedule_id,
  }));

  const { data, error } = await adminClient
    .from("reading_schedule_days")
    .insert(daysWithScheduleId)
    .select();

  if (error) {
    return { success: false, successCount: 0, failedCount: input.days.length, errors: [error.message] };
  }

  revalidatePath("/admin/activities/readings");
  return { success: true, successCount: data?.length || 0, failedCount: 0 };
}

/**
 * Delete a reading schedule day
 */
export async function deleteReadingScheduleDayAction(
  dayId: string
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
    .from("reading_schedule_days")
    .delete()
    .eq("id", dayId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/activities/readings");
  return { success: true };
}

/**
 * Get readings for review (admin)
 */
export async function getReadingsForReviewAction(
  filters?: UserReadingFilters
): Promise<ActionResult<UserReadingWithDetails[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  let query = adminClient
    .from("user_readings")
    .select(
      `
      *,
      schedule_day:reading_schedule_days(*),
      user:users!user_id(id, full_name, email, user_code),
      reviewer:users!reviewed_by(id, full_name)
    `
    )
    .order("created_at", { ascending: false });

  if (filters?.schedule_id) {
    query = query.eq("schedule_day.schedule_id", filters.schedule_id);
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
 * Review a reading (for schedules with requires_approval = true)
 */
export async function reviewReadingAction(
  input: ReviewUserReadingInput
): Promise<ActionResult<UserReading>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Get the reading and schedule config
  const { data: reading } = await adminClient
    .from("user_readings")
    .select(
      `
      user_id,
      schedule_day:reading_schedule_days(
        schedule:reading_schedules(points_per_reading)
      )
    `
    )
    .eq("id", input.reading_id)
    .single();

  if (!reading) {
    return { success: false, error: "Reading not found" };
  }

  const pointsPerReading = (reading.schedule_day as any)?.schedule?.points_per_reading || 0;
  const pointsAwarded = input.approved
    ? input.points_awarded ?? pointsPerReading
    : 0;

  const newStatus: SubmissionStatus = input.approved ? "approved" : "rejected";

  const { data, error } = await adminClient
    .from("user_readings")
    .update({
      status: newStatus,
      points_awarded: pointsAwarded,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.reading_id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Award points if approved
  if (input.approved && pointsAwarded > 0) {
    await adminClient.rpc("add_points", {
      p_user_id: reading.user_id,
      p_points: pointsAwarded,
      p_transaction_type: "reading_completion",
      p_notes: "Daily reading approved",
      p_created_by: user.id,
    });

    // Update reading streak and check for badges
    await updateStreakAction(reading.user_id, "reading");
    await checkAndAwardBadgesAction(reading.user_id);
  }

  revalidatePath("/admin/activities/readings");
  return { success: true, data };
}

/**
 * Bulk approve readings
 */
export async function bulkApproveReadingsAction(
  readingIds: string[]
): Promise<BulkActionResult> {
  const results = await Promise.allSettled(
    readingIds.map((id) =>
      reviewReadingAction({ reading_id: id, approved: true })
    )
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failedCount = results.filter((r) => r.status === "rejected").length;

  revalidatePath("/admin/activities/readings");
  return { success: true, successCount, failedCount };
}

/**
 * Get reading schedule statistics
 */
export async function getReadingScheduleStatsAction(
  scheduleId: string
): Promise<ActionResult<ReadingScheduleStats>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Get all readings for this schedule
  const { data: days } = await adminClient
    .from("reading_schedule_days")
    .select("id, reading_date")
    .eq("schedule_id", scheduleId);

  const dayIds = days?.map((d) => d.id) || [];

  const { data: readings, error } = await adminClient
    .from("user_readings")
    .select("user_id, status, points_awarded, completed_at")
    .in("schedule_day_id", dayIds);

  if (error) {
    return { success: false, error: error.message };
  }

  // Calculate stats
  const uniqueParticipants = new Set(readings?.map((r) => r.user_id) || []);
  const approvedReadings = readings?.filter((r) => r.status === "approved") || [];

  // Daily completions
  const dailyMap = new Map<string, number>();
  readings?.forEach((r) => {
    const date = r.completed_at.split("T")[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const dailyCompletions = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const stats: ReadingScheduleStats = {
    total_participants: uniqueParticipants.size,
    total_completions: readings?.length || 0,
    completion_rate:
      dayIds.length > 0 && uniqueParticipants.size > 0
        ? Math.round(
            ((readings?.length || 0) / (dayIds.length * uniqueParticipants.size)) * 100
          )
        : 0,
    total_points_awarded: approvedReadings.reduce(
      (sum, r) => sum + (r.points_awarded || 0),
      0
    ),
    daily_completions: dailyCompletions,
  };

  return { success: true, data: stats };
}
