"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import type {
  ChurchPointsConfig,
  ChurchPointsConfigFormData,
  StudentPointsBalance,
  PointsTransaction,
  PointsTransactionType,
  StudentPointsSummary,
} from "@/lib/types";

// =====================================================
// CHURCH POINTS CONFIGURATION
// =====================================================

export async function getChurchPointsConfigAction(
  churchId: string
): Promise<ChurchPointsConfig | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("church_points_config")
    .select("*")
    .eq("church_id", churchId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching church points config:", error);
    throw new Error("Failed to fetch church points configuration");
  }

  return data as ChurchPointsConfig | null;
}

export async function upsertChurchPointsConfigAction(
  churchId: string,
  config: ChurchPointsConfigFormData
): Promise<ChurchPointsConfig> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  // Only church admins and above can update config
  if (!["super_admin", "diocese_admin", "church_admin"].includes(profile.role)) {
    throw new Error("Not authorized to update church points configuration");
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("church_points_config")
    .upsert(
      {
        church_id: churchId,
        ...config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "church_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting church points config:", error);
    throw new Error("Failed to save church points configuration");
  }

  return data as ChurchPointsConfig;
}

// =====================================================
// STUDENT POINTS BALANCE
// =====================================================

export async function getStudentPointsBalanceAction(
  userId: string
): Promise<StudentPointsBalance | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  // First try to get existing balance
  let { data, error } = await supabase
    .from("student_points_balance")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No balance exists, create one
    const { data: newBalance, error: createError } = await supabase
      .from("student_points_balance")
      .insert({
        user_id: userId,
        available_points: 0,
        suspended_points: 0,
        used_points: 0,
        total_earned: 0,
        total_deducted: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating points balance:", createError);
      return null;
    }
    data = newBalance;
  } else if (error) {
    console.error("Error fetching points balance:", error);
    return null;
  }

  return data as StudentPointsBalance;
}

export async function getStudentPointsSummaryAction(
  userId: string
): Promise<StudentPointsSummary> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  // Get balance
  const balance = await getStudentPointsBalanceAction(userId);

  // Get recent transactions
  const { data: transactions, error: txError } = await supabase
    .from("points_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (txError) {
    console.error("Error fetching transactions:", txError);
  }

  // Calculate points by type
  const { data: typeStats, error: statsError } = await supabase
    .from("points_transactions")
    .select("transaction_type, points")
    .eq("user_id", userId);

  if (statsError) {
    console.error("Error fetching type stats:", statsError);
  }

  const pointsByType = {
    activity: 0,
    attendance: 0,
    trips: 0,
    adjustments: 0,
    store: 0,
  };

  (typeStats || []).forEach((tx: { transaction_type: string; points: number }) => {
    const points = tx.points > 0 ? tx.points : 0;
    switch (tx.transaction_type) {
      case "activity_completion":
        pointsByType.activity += points;
        break;
      case "attendance":
        pointsByType.attendance += points;
        break;
      case "trip_participation":
        pointsByType.trips += points;
        break;
      case "teacher_adjustment":
      case "admin_adjustment":
        pointsByType.adjustments += tx.points; // Can be negative
        break;
      case "store_order_approved":
        pointsByType.store += Math.abs(tx.points);
        break;
    }
  });

  return {
    balance,
    recent_transactions: (transactions || []) as PointsTransaction[],
    points_by_type: pointsByType,
  };
}

// =====================================================
// POINTS TRANSACTIONS
// =====================================================

export async function getPointsTransactionsAction(
  userId: string,
  limit = 50
): Promise<PointsTransaction[]> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("points_transactions")
    .select(`
      *,
      activity:activities(id, name),
      order:orders(id, total_points),
      created_by_user:users!points_transactions_created_by_fkey(id, full_name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Failed to fetch points transactions");
  }

  return data as PointsTransaction[];
}

// =====================================================
// ADD POINTS
// =====================================================

export async function addPointsAction(
  userId: string,
  points: number,
  transactionType: PointsTransactionType,
  notes?: string,
  relatedIds?: {
    activity_id?: string;
    attendance_id?: string;
    trip_id?: string;
    order_id?: string;
  }
): Promise<string> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  // Get or create balance
  let balance = await getStudentPointsBalanceAction(userId);
  if (!balance) {
    throw new Error("Failed to get or create points balance");
  }

  // Calculate new balance
  const newAvailable = balance.available_points + points;
  const newTotalEarned = points > 0 ? balance.total_earned + points : balance.total_earned;
  const newTotalDeducted = points < 0 ? balance.total_deducted + Math.abs(points) : balance.total_deducted;

  // Update balance
  const { error: balanceError } = await supabase
    .from("student_points_balance")
    .update({
      available_points: newAvailable,
      total_earned: newTotalEarned,
      total_deducted: newTotalDeducted,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (balanceError) {
    console.error("Error updating balance:", balanceError);
    throw new Error("Failed to update points balance");
  }

  // Create transaction record
  const { data: transaction, error: txError } = await supabase
    .from("points_transactions")
    .insert({
      user_id: userId,
      transaction_type: transactionType,
      points,
      balance_after: newAvailable,
      notes,
      activity_id: relatedIds?.activity_id,
      attendance_id: relatedIds?.attendance_id,
      trip_id: relatedIds?.trip_id,
      order_id: relatedIds?.order_id,
      created_by: profile.id,
    })
    .select()
    .single();

  if (txError) {
    console.error("Error creating transaction:", txError);
    throw new Error("Failed to record points transaction");
  }

  return transaction.id;
}

// =====================================================
// TEACHER ADJUSTMENT
// =====================================================

export async function teacherAdjustPointsAction(
  studentId: string,
  points: number,
  notes: string
): Promise<string> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  // Only teachers and above can adjust
  if (!["super_admin", "diocese_admin", "church_admin", "teacher"].includes(profile.role)) {
    throw new Error("Not authorized to adjust points");
  }

  // Notes are required for teacher adjustments
  if (!notes || notes.trim().length < 3) {
    throw new Error("A note is required for point adjustments");
  }

  const supabase = createAdminClient();

  // Get student's church to check config
  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("church_id")
    .eq("id", studentId)
    .single();

  if (studentError || !student?.church_id) {
    throw new Error("Student not found or not assigned to a church");
  }

  // Get church config to check limits
  const config = await getChurchPointsConfigAction(student.church_id);
  const maxAdjustment = config?.max_teacher_adjustment || 50;

  // Check if adjustment is within limits (for non-super admins)
  if (profile.role !== "super_admin" && Math.abs(points) > maxAdjustment) {
    throw new Error(`Adjustment exceeds maximum limit of ${maxAdjustment} points`);
  }

  // Check if teacher adjustment is enabled
  if (config && !config.is_teacher_adjustment_enabled && profile.role === "teacher") {
    throw new Error("Teacher point adjustments are disabled for this church");
  }

  // Add the points
  return addPointsAction(
    studentId,
    points,
    "teacher_adjustment",
    notes
  );
}

// =====================================================
// STORE ORDER POINTS
// =====================================================

export async function suspendPointsForOrderAction(
  userId: string,
  points: number,
  orderId: string
): Promise<string> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  // Get current balance
  const balance = await getStudentPointsBalanceAction(userId);
  if (!balance) {
    throw new Error("Failed to get points balance");
  }

  // Check if enough points available
  if (balance.available_points < points) {
    throw new Error(`Insufficient points. Available: ${balance.available_points}, Required: ${points}`);
  }

  // Move points from available to suspended
  const { error: balanceError } = await supabase
    .from("student_points_balance")
    .update({
      available_points: balance.available_points - points,
      suspended_points: balance.suspended_points + points,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (balanceError) {
    console.error("Error suspending points:", balanceError);
    throw new Error("Failed to suspend points");
  }

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from("points_transactions")
    .insert({
      user_id: userId,
      transaction_type: "store_order_pending",
      points: -points,
      balance_after: balance.available_points - points,
      notes: `Points suspended for order`,
      order_id: orderId,
      created_by: profile.id,
    })
    .select()
    .single();

  if (txError) {
    console.error("Error creating suspend transaction:", txError);
    throw new Error("Failed to record points suspension");
  }

  return transaction.id;
}

export async function confirmOrderPointsDeductionAction(
  userId: string,
  points: number,
  orderId: string
): Promise<string> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  // Get current balance
  const balance = await getStudentPointsBalanceAction(userId);
  if (!balance) {
    throw new Error("Failed to get points balance");
  }

  // Move points from suspended to used
  const { error: balanceError } = await supabase
    .from("student_points_balance")
    .update({
      suspended_points: balance.suspended_points - points,
      used_points: balance.used_points + points,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (balanceError) {
    console.error("Error confirming deduction:", balanceError);
    throw new Error("Failed to confirm points deduction");
  }

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from("points_transactions")
    .insert({
      user_id: userId,
      transaction_type: "store_order_approved",
      points: 0, // Balance already moved from suspended
      balance_after: balance.available_points,
      notes: `Order approved - ${points} points deducted`,
      order_id: orderId,
      created_by: profile.id,
    })
    .select()
    .single();

  if (txError) {
    console.error("Error creating confirm transaction:", txError);
    throw new Error("Failed to record points confirmation");
  }

  return transaction.id;
}

export async function returnSuspendedPointsAction(
  userId: string,
  points: number,
  orderId: string,
  reason: "cancelled" | "rejected"
): Promise<string> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  // Get current balance
  const balance = await getStudentPointsBalanceAction(userId);
  if (!balance) {
    throw new Error("Failed to get points balance");
  }

  // Move points from suspended back to available
  const { error: balanceError } = await supabase
    .from("student_points_balance")
    .update({
      suspended_points: balance.suspended_points - points,
      available_points: balance.available_points + points,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (balanceError) {
    console.error("Error returning points:", balanceError);
    throw new Error("Failed to return suspended points");
  }

  const transactionType: PointsTransactionType = reason === "cancelled"
    ? "store_order_cancelled"
    : "store_order_rejected";

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from("points_transactions")
    .insert({
      user_id: userId,
      transaction_type: transactionType,
      points: points,
      balance_after: balance.available_points + points,
      notes: `Order ${reason} - ${points} points returned`,
      order_id: orderId,
      created_by: profile.id,
    })
    .select()
    .single();

  if (txError) {
    console.error("Error creating return transaction:", txError);
    throw new Error("Failed to record points return");
  }

  return transaction.id;
}

// =====================================================
// ATTENDANCE POINTS
// =====================================================

export async function awardAttendancePointsAction(
  userId: string,
  churchId: string,
  attendanceStatus: "present" | "late" | "excused" | "absent",
  attendanceId?: string
): Promise<number> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  // Get church config
  const config = await getChurchPointsConfigAction(churchId);

  // If no config or attendance points disabled, skip
  if (!config || !config.is_attendance_points_enabled) {
    return 0;
  }

  // Determine points based on status
  let points = 0;
  switch (attendanceStatus) {
    case "present":
      points = config.attendance_points_present;
      break;
    case "late":
      points = config.attendance_points_late;
      break;
    case "excused":
      points = config.attendance_points_excused;
      break;
    case "absent":
      points = config.attendance_points_absent;
      break;
  }

  // Only award if points > 0
  if (points > 0) {
    await addPointsAction(
      userId,
      points,
      "attendance",
      `Attendance: ${attendanceStatus}`,
      { attendance_id: attendanceId }
    );
  }

  return points;
}

// =====================================================
// TRIP POINTS
// =====================================================

export async function awardTripPointsAction(
  userId: string,
  churchId: string,
  tripId: string,
  tripName?: string
): Promise<number> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  // Get church config
  const config = await getChurchPointsConfigAction(churchId);

  // If no config or trip points disabled, skip
  if (!config || !config.is_trip_points_enabled) {
    return 0;
  }

  const points = config.trip_participation_points;

  if (points > 0) {
    await addPointsAction(
      userId,
      points,
      "trip_participation",
      `Trip participation: ${tripName || tripId}`,
      { trip_id: tripId }
    );
  }

  return points;
}

// =====================================================
// CLASS POINTS OVERVIEW
// =====================================================

export async function getClassPointsOverviewAction(
  classId: string
): Promise<{ userId: string; fullName: string; availablePoints: number; totalEarned: number }[]> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = createAdminClient();

  // Get all students in the class
  const { data: assignments, error: assignError } = await supabase
    .from("class_assignments")
    .select(`
      user_id,
      user:users!class_assignments_user_id_fkey (
        id,
        full_name
      )
    `)
    .eq("class_id", classId)
    .eq("assignment_type", "student")
    .eq("is_active", true);

  if (assignError) {
    console.error("Error fetching class students:", assignError);
    throw new Error("Failed to fetch class students");
  }

  // Get points balances for all students
  const studentIds = assignments?.map((a: any) => a.user_id) || [];

  if (studentIds.length === 0) {
    return [];
  }

  const { data: balances, error: balanceError } = await supabase
    .from("student_points_balance")
    .select("user_id, available_points, total_earned")
    .in("user_id", studentIds);

  if (balanceError) {
    console.error("Error fetching balances:", balanceError);
  }

  // Map balances to students
  const balanceMap = new Map(
    (balances || []).map((b: any) => [b.user_id, b])
  );

  return (assignments || []).map((a: any) => ({
    userId: a.user_id,
    fullName: a.user?.full_name || "Unknown",
    availablePoints: balanceMap.get(a.user_id)?.available_points || 0,
    totalEarned: balanceMap.get(a.user_id)?.total_earned || 0,
  }));
}
