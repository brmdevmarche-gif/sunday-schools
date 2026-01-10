"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  ParentChild,
  ChildDetails,
  PendingApproval,
  ApproveTripInput,
  ApprovalHistoryItem,
  Notification,
  NotificationSummary,
  ParentDashboardData,
  ChildProfileData,
  ChildActivitySummary,
  ChildAttendanceSummary,
  ChildAttendanceRecord,
  ActionResult,
} from "@/lib/types";

// =====================================================
// PARENT DASHBOARD ACTIONS
// =====================================================

/**
 * Get parent's linked children with stats
 */
export async function getParentChildrenAction(): Promise<
  ActionResult<ParentChild[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is a parent
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return { success: false, error: "Unauthorized - not a parent account" };
  }

  const adminClient = createAdminClient();

  // Get linked children
  const { data: relationships, error: relError } = await adminClient
    .from("user_relationships")
    .select(
      `
      student_id,
      student:users!user_relationships_student_id_fkey(
        id,
        full_name,
        avatar_url,
        email,
        user_code,
        date_of_birth
      )
    `
    )
    .eq("parent_id", user.id)
    .eq("is_active", true);

  if (relError) {
    return { success: false, error: relError.message };
  }

  if (!relationships || relationships.length === 0) {
    return { success: true, data: [] };
  }

  // Enrich each child with stats
  const children: ParentChild[] = await Promise.all(
    relationships.map(async (rel) => {
      const student = rel.student as any;
      const studentId = rel.student_id;

      // Get class info
      const { data: classData } = await adminClient
        .from("class_students")
        .select(`classes(id, name, church_id, churches(id, name))`)
        .eq("student_id", studentId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      // Get points balance
      const { data: pointsData } = await adminClient
        .from("student_points_balance")
        .select("available_points, total_earned")
        .eq("user_id", studentId)
        .maybeSingle();

      // Count pending approvals for this child
      const { count: pendingCount } = await adminClient
        .from("trip_participants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", studentId)
        .eq("parent_approval", false)
        .in("approval_status", ["pending", "approved"]);

      // Get current streak
      const { data: streakData } = await adminClient
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", studentId)
        .eq("streak_type", "combined")
        .maybeSingle();

      // Count badges
      const { count: badgesCount } = await adminClient
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", studentId);

      const classInfo = classData?.classes as any;
      const churchInfo = classInfo?.churches as any;

      return {
        id: student.id,
        full_name: student.full_name || "Unknown",
        avatar_url: student.avatar_url,
        email: student.email,
        user_code: student.user_code,
        date_of_birth: student.date_of_birth,
        class_id: classInfo?.id || null,
        class_name: classInfo?.name || null,
        church_id: churchInfo?.id || null,
        church_name: churchInfo?.name || null,
        points_balance: pointsData?.available_points || 0,
        total_earned: pointsData?.total_earned || 0,
        pending_approvals_count: pendingCount || 0,
        current_streak: streakData?.current_streak || 0,
        badges_count: badgesCount || 0,
      };
    })
  );

  return { success: true, data: children };
}

/**
 * Get full parent dashboard data
 */
export async function getParentDashboardAction(): Promise<
  ActionResult<ParentDashboardData>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get children
  const childrenResult = await getParentChildrenAction();
  if (!childrenResult.success) {
    return { success: false, error: childrenResult.error };
  }

  // Get pending approvals count
  const pendingResult = await getPendingApprovalsAction();
  const pendingCount = pendingResult.success
    ? pendingResult.data?.length || 0
    : 0;

  // Get notifications
  const notificationsResult = await getNotificationsAction(false, 5);
  const notifications = notificationsResult.success
    ? notificationsResult.data || []
    : [];

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return {
    success: true,
    data: {
      children: childrenResult.data || [],
      pending_approvals_count: pendingCount,
      unread_notifications_count: unreadCount,
      recent_notifications: notifications,
    },
  };
}

// =====================================================
// TRIP APPROVAL ACTIONS
// =====================================================

/**
 * Get pending trip approvals for parent
 */
export async function getPendingApprovalsAction(): Promise<
  ActionResult<PendingApproval[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Get parent's children IDs
  const { data: relationships } = await adminClient
    .from("user_relationships")
    .select("student_id")
    .eq("parent_id", user.id)
    .eq("is_active", true);

  if (!relationships || relationships.length === 0) {
    return { success: true, data: [] };
  }

  const childIds = relationships.map((r) => r.student_id);

  // Get pending approvals for all children
  const { data: participants, error } = await adminClient
    .from("trip_participants")
    .select(
      `
      id,
      trip_id,
      user_id,
      price_at_registration,
      price_tier,
      created_at,
      trip:trips(
        id,
        name,
        name_ar,
        description,
        start_date,
        end_date,
        destinations,
        transportation_details,
        what_to_bring,
        requires_parent_approval
      ),
      user:users!trip_participants_user_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `
    )
    .in("user_id", childIds)
    .eq("parent_approval", false)
    .in("approval_status", ["pending", "approved"])
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  // Filter to only trips that require parent approval
  const pendingApprovals: PendingApproval[] = (participants || [])
    .filter((p) => (p.trip as any)?.requires_parent_approval)
    .map((p) => {
      const trip = p.trip as any;
      const child = p.user as any;

      return {
        id: p.id,
        trip_id: p.trip_id,
        trip_name: trip.name,
        trip_name_ar: trip.name_ar,
        trip_description: trip.description,
        child_id: p.user_id,
        child_name: child.full_name || "Unknown",
        child_avatar: child.avatar_url,
        start_date: trip.start_date,
        end_date: trip.end_date,
        price: p.price_at_registration || 0,
        price_tier: p.price_tier || "normal",
        requires_payment: p.price_at_registration > 0,
        registered_at: p.created_at,
        destinations: trip.destinations,
        transportation_details: trip.transportation_details,
        what_to_bring: trip.what_to_bring,
      };
    });

  return { success: true, data: pendingApprovals };
}

/**
 * Approve or reject a trip participation
 */
export async function approveTripParticipationAction(
  input: ApproveTripInput
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Get participant details
  const { data: participant } = await adminClient
    .from("trip_participants")
    .select("user_id, trip_id")
    .eq("id", input.participant_id)
    .single();

  if (!participant) {
    return { success: false, error: "Participation not found" };
  }

  // Verify parent-child relationship
  const { data: relationship } = await adminClient
    .from("user_relationships")
    .select("id")
    .eq("parent_id", user.id)
    .eq("student_id", participant.user_id)
    .eq("is_active", true)
    .single();

  if (!relationship) {
    return { success: false, error: "Unauthorized - not your child" };
  }

  // Update approval status
  const { error } = await adminClient
    .from("trip_participants")
    .update({
      parent_approval: input.approved,
      parent_approved_by: user.id,
      parent_approved_at: new Date().toISOString(),
      parent_approval_notes: input.notes,
      // If parent rejects, also reject the overall approval
      approval_status: input.approved ? undefined : "rejected",
    })
    .eq("id", input.participant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Create notification for child about decision
  const { data: trip } = await adminClient
    .from("trips")
    .select("name, name_ar")
    .eq("id", participant.trip_id)
    .single();

  if (trip) {
    await adminClient.from("notifications").insert({
      user_id: participant.user_id,
      type: "trip_status_changed",
      title: input.approved
        ? `Trip Approved: ${trip.name}`
        : `Trip Not Approved: ${trip.name}`,
      title_ar: input.approved
        ? `تمت الموافقة على الرحلة: ${trip.name_ar || trip.name}`
        : `لم تتم الموافقة على الرحلة: ${trip.name_ar || trip.name}`,
      body: input.approved
        ? "Your parent has approved your trip registration."
        : `Your parent has not approved your trip registration.${input.notes ? ` Reason: ${input.notes}` : ""}`,
      body_ar: input.approved
        ? "وافق ولي أمرك على تسجيلك في الرحلة."
        : `لم يوافق ولي أمرك على تسجيلك في الرحلة.${input.notes ? ` السبب: ${input.notes}` : ""}`,
      data: { trip_id: participant.trip_id, approved: input.approved },
      action_url: "/trips",
    });
  }

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Get approval history
 */
export async function getApprovalHistoryAction(): Promise<
  ActionResult<ApprovalHistoryItem[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Get parent's children IDs
  const { data: relationships } = await adminClient
    .from("user_relationships")
    .select("student_id")
    .eq("parent_id", user.id)
    .eq("is_active", true);

  if (!relationships || relationships.length === 0) {
    return { success: true, data: [] };
  }

  const childIds = relationships.map((r) => r.student_id);

  // Get approved/rejected participations
  const { data: participants, error } = await adminClient
    .from("trip_participants")
    .select(
      `
      id,
      trip_id,
      user_id,
      parent_approval,
      parent_approval_notes,
      parent_approved_at,
      trip:trips(name, start_date, end_date),
      user:users!trip_participants_user_id_fkey(full_name)
    `
    )
    .in("user_id", childIds)
    .not("parent_approved_at", "is", null)
    .order("parent_approved_at", { ascending: false })
    .limit(50);

  if (error) {
    return { success: false, error: error.message };
  }

  const history: ApprovalHistoryItem[] = (participants || []).map((p) => {
    const trip = p.trip as any;
    const child = p.user as any;

    return {
      id: p.id,
      trip_id: p.trip_id,
      trip_name: trip?.name || "Unknown Trip",
      child_id: p.user_id,
      child_name: child?.full_name || "Unknown",
      approved: p.parent_approval,
      notes: p.parent_approval_notes,
      approved_at: p.parent_approved_at,
      trip_start_date: trip?.start_date,
      trip_end_date: trip?.end_date,
    };
  });

  return { success: true, data: history };
}

// =====================================================
// CHILD PROFILE ACTIONS
// =====================================================

/**
 * Get detailed child profile with stats
 */
export async function getChildDetailsAction(
  childId: string
): Promise<ActionResult<ChildProfileData>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();

  // Verify parent-child relationship
  const { data: relationship } = await adminClient
    .from("user_relationships")
    .select("id")
    .eq("parent_id", user.id)
    .eq("student_id", childId)
    .eq("is_active", true)
    .single();

  if (!relationship) {
    return { success: false, error: "Unauthorized - not your child" };
  }

  // Get child profile
  const { data: child, error: childError } = await adminClient
    .from("users")
    .select("*")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    return { success: false, error: "Child not found" };
  }

  // Get class info
  const { data: classData } = await adminClient
    .from("class_students")
    .select(
      `classes(id, name, church_id, churches(id, name, diocese_id, dioceses(id, name)))`
    )
    .eq("student_id", childId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  // Get points balance
  const { data: pointsData } = await adminClient
    .from("student_points_balance")
    .select("available_points, total_earned")
    .eq("user_id", childId)
    .maybeSingle();

  // Get activity summary
  const activitySummary = await getChildActivitySummary(adminClient, childId);

  // Get attendance summary (last 30 days)
  const attendanceSummary = await getChildAttendanceSummary(adminClient, childId, 30);

  // Get recent attendance
  const { data: recentAttendance } = await adminClient
    .from("attendance")
    .select(`id, attendance_date, status, notes, class:classes(name)`)
    .eq("user_id", childId)
    .order("attendance_date", { ascending: false })
    .limit(10);

  // Count pending approvals
  const { count: pendingCount } = await adminClient
    .from("trip_participants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", childId)
    .eq("parent_approval", false)
    .in("approval_status", ["pending", "approved"]);

  // Get streak data
  const { data: streakData } = await adminClient
    .from("user_streaks")
    .select("streak_type, current_streak, longest_streak, last_activity_date")
    .eq("user_id", childId);

  // Get badges
  const { data: badgesData } = await adminClient
    .from("user_badges")
    .select(
      `id, earned_at, badge:badge_definitions(id, name, name_ar, icon, color)`
    )
    .eq("user_id", childId)
    .order("earned_at", { ascending: false });

  const { count: badgesCount } = await adminClient
    .from("user_badges")
    .select("*", { count: "exact", head: true })
    .eq("user_id", childId);

  // Process streaks
  const streaks: {
    reading?: { streak_type: string; current_streak: number; longest_streak: number; last_activity_date?: string | null };
    spiritual_notes?: { streak_type: string; current_streak: number; longest_streak: number; last_activity_date?: string | null };
    combined?: { streak_type: string; current_streak: number; longest_streak: number; last_activity_date?: string | null };
  } = {};

  if (streakData) {
    for (const streak of streakData) {
      if (streak.streak_type === "reading") {
        streaks.reading = streak;
      } else if (streak.streak_type === "spiritual_notes") {
        streaks.spiritual_notes = streak;
      } else if (streak.streak_type === "combined") {
        streaks.combined = streak;
      }
    }
  }

  // Process badges
  const badges = (badgesData || []).map((b) => {
    const badge = b.badge as any;
    return {
      id: b.id,
      badge_id: badge?.id || "",
      name: badge?.name || "Unknown",
      name_ar: badge?.name_ar || null,
      icon: badge?.icon || "🏆",
      color: badge?.color || "#FFD700",
      earned_at: b.earned_at,
    };
  });

  const combinedStreak = streakData?.find((s) => s.streak_type === "combined");

  const classInfo = classData?.classes as any;
  const churchInfo = classInfo?.churches as any;
  const dioceseInfo = churchInfo?.dioceses as any;

  const childDetails: ChildDetails = {
    id: child.id,
    full_name: child.full_name || "Unknown",
    avatar_url: child.avatar_url,
    email: child.email,
    user_code: child.user_code,
    date_of_birth: child.date_of_birth,
    class_id: classInfo?.id || null,
    class_name: classInfo?.name || null,
    church_id: churchInfo?.id || null,
    church_name: churchInfo?.name || null,
    diocese_id: dioceseInfo?.id || null,
    diocese_name: dioceseInfo?.name || null,
    points_balance: pointsData?.available_points || 0,
    total_earned: pointsData?.total_earned || 0,
    pending_approvals_count: pendingCount || 0,
    current_streak: combinedStreak?.current_streak || 0,
    badges_count: badgesCount || 0,
    attendance_rate: attendanceSummary.attendance_rate,
    total_attendance: attendanceSummary.present + attendanceSummary.late,
    activities_count: activitySummary.activities.completed,
    competitions_count: activitySummary.competitions.submitted,
    readings_count: activitySummary.readings.completed,
    spiritual_notes_count: activitySummary.spiritual_notes.approved,
  };

  return {
    success: true,
    data: {
      child: childDetails,
      activity_summary: activitySummary,
      attendance_summary: attendanceSummary,
      recent_attendance: (recentAttendance || []).map((a) => ({
        id: a.id,
        date: a.attendance_date,
        status: a.status as "present" | "absent" | "late" | "excused",
        class_name: (a.class as any)?.name || "Unknown",
        notes: a.notes,
      })),
      badges,
      streaks,
    },
  };
}

// Helper function to get activity summary
async function getChildActivitySummary(
  adminClient: ReturnType<typeof createAdminClient>,
  childId: string
): Promise<ChildActivitySummary> {
  // Trips
  const { data: trips } = await adminClient
    .from("trip_participants")
    .select("approval_status, trip:trips(start_date, end_date)")
    .eq("user_id", childId);

  const now = new Date();
  const tripStats = {
    total: trips?.length || 0,
    pending: trips?.filter((t) => t.approval_status === "pending").length || 0,
    approved: trips?.filter((t) => t.approval_status === "approved").length || 0,
    completed:
      trips?.filter((t) => {
        const trip = t.trip as any;
        return trip?.end_date && new Date(trip.end_date) < now;
      }).length || 0,
  };

  // Activities
  const { data: activities } = await adminClient
    .from("activity_participants")
    .select("status, completed_at, points_awarded")
    .eq("user_id", childId);

  const activityStats = {
    total: activities?.length || 0,
    completed: activities?.filter((a) => a.completed_at).length || 0,
    points_earned:
      activities?.reduce((sum, a) => sum + (a.points_awarded || 0), 0) || 0,
  };

  // Spiritual notes
  const { data: notes } = await adminClient
    .from("spiritual_notes")
    .select("status, points_awarded")
    .eq("user_id", childId);

  const notesStats = {
    total: notes?.length || 0,
    approved: notes?.filter((n) => n.status === "approved").length || 0,
    points_earned:
      notes?.reduce((sum, n) => sum + (n.points_awarded || 0), 0) || 0,
  };

  // Readings
  const { data: readings } = await adminClient
    .from("user_readings")
    .select("status, points_awarded")
    .eq("user_id", childId);

  const readingsStats = {
    total: readings?.length || 0,
    completed: readings?.filter((r) => r.status === "approved").length || 0,
    points_earned:
      readings?.reduce((sum, r) => sum + (r.points_awarded || 0), 0) || 0,
  };

  // Competitions
  const { data: submissions } = await adminClient
    .from("competition_submissions")
    .select("status, ranking, points_awarded")
    .eq("user_id", childId);

  const competitionStats = {
    total: submissions?.length || 0,
    submitted: submissions?.filter((s) => s.status !== "draft").length || 0,
    wins: submissions?.filter((s) => s.ranking && s.ranking <= 3).length || 0,
    points_earned:
      submissions?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0,
  };

  return {
    trips: tripStats,
    activities: activityStats,
    spiritual_notes: notesStats,
    readings: readingsStats,
    competitions: competitionStats,
  };
}

// Helper function to get attendance summary
async function getChildAttendanceSummary(
  adminClient: ReturnType<typeof createAdminClient>,
  childId: string,
  days: number
): Promise<ChildAttendanceSummary> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: records } = await adminClient
    .from("attendance")
    .select("status")
    .eq("user_id", childId)
    .gte("attendance_date", startDate.toISOString().split("T")[0]);

  const present = records?.filter((r) => r.status === "present").length || 0;
  const absent = records?.filter((r) => r.status === "absent").length || 0;
  const late = records?.filter((r) => r.status === "late").length || 0;
  const excused = records?.filter((r) => r.status === "excused").length || 0;
  const total = present + absent + late + excused;

  return {
    period_days: days,
    present,
    absent,
    late,
    excused,
    attendance_rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
  };
}

// =====================================================
// NOTIFICATION ACTIONS
// =====================================================

/**
 * Get notifications for user
 */
export async function getNotificationsAction(
  unreadOnly: boolean = false,
  limit: number = 20
): Promise<ActionResult<Notification[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

/**
 * Get notification summary (counts)
 */
export async function getNotificationSummaryAction(): Promise<
  ActionResult<NotificationSummary>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("type, read_at")
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  const total = notifications?.length || 0;
  const unread = notifications?.filter((n) => !n.read_at).length || 0;
  const byType: Record<string, number> = {};

  (notifications || []).forEach((n) => {
    byType[n.type] = (byType[n.type] || 0) + 1;
  });

  return {
    success: true,
    data: {
      total,
      unread,
      by_type: byType as Record<any, number>,
    },
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsReadAction(): Promise<
  ActionResult<void>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotificationAction(
  notificationId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
