"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface StudentDetails {
  id: string;
  email: string;
  full_name: string | null;
  user_code: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  diocese_id: string | null;
  church_id: string | null;
  created_at: string;
  diocese_name?: string | null;
  church_name?: string | null;
  class_assignments?: {
    class_id: string;
    class_name: string;
  }[];
}

export interface ActivityParticipation {
  id: string;
  activity_id: string;
  activity_name: string;
  activity_description: string | null;
  activity_image_url: string | null;
  points: number;
  status: string;
  requested_at: string;
  approved_at: string | null;
  completion_status: string | null;
  points_awarded: number | null;
  completed_at: string | null;
  is_revoked: boolean | null;
}

export interface AvailableActivity {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points: number;
  requires_participation_approval: boolean;
  requires_completion_approval: boolean;
  is_time_sensitive: boolean;
  deadline: string | null;
  max_participants: number | null;
  status: string;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
}

export interface PointsSummary {
  total_points: number;
  available_points: number;
  suspended_points: number;
  used_points: number;
  total_earned: number;
  activities_completed: number;
  activities_pending: number;
}

export interface StudentOrder {
  id: string;
  status: "pending" | "approved" | "fulfilled" | "cancelled" | "rejected";
  total_points: number;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  order_items: {
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    store_items: {
      id: string;
      name: string;
      image_url: string | null;
    } | null;
  }[];
}

/**
 * Get student details with diocese, church, and class info
 */
export async function getStudentDetailsAction(
  studentId: string
): Promise<StudentDetails> {
  const supabase = createAdminClient();

  // Get student info
  const { data: student, error } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      full_name,
      user_code,
      date_of_birth,
      gender,
      phone,
      address,
      avatar_url,
      diocese_id,
      church_id,
      created_at,
      dioceses:diocese_id(name),
      churches:church_id(name)
    `
    )
    .eq("id", studentId)
    .eq("role", "student")
    .single();

  if (error || !student) {
    throw new Error("Student not found");
  }

  // Get class assignments
  const { data: assignments } = await supabase
    .from("class_assignments")
    .select(
      `
      class_id,
      classes:classes(name)
    `
    )
    .eq("user_id", studentId)
    .eq("assignment_type", "student")
    .eq("is_active", true);

  const dioceses = student.dioceses as unknown as { name: string } | null;
  const churches = student.churches as unknown as { name: string } | null;

  return {
    id: student.id,
    email: student.email,
    full_name: student.full_name,
    user_code: student.user_code,
    date_of_birth: student.date_of_birth,
    gender: student.gender,
    phone: student.phone,
    address: student.address,
    avatar_url: student.avatar_url,
    diocese_id: student.diocese_id,
    church_id: student.church_id,
    created_at: student.created_at,
    diocese_name: dioceses?.name ?? null,
    church_name: churches?.name ?? null,
    class_assignments:
      assignments?.map((a) => {
        const classData = a.classes as unknown as { name: string } | null;
        return {
          class_id: a.class_id!,
          class_name: classData?.name || "Unknown",
        };
      }) || [],
  };
}

/**
 * Get student's activity participations and completions
 */
export async function getStudentActivitiesAction(studentId: string): Promise<{
  participated: ActivityParticipation[];
  available: AvailableActivity[];
}> {
  const supabase = createAdminClient();

  // Get student's diocese, church, and classes
  const { data: student } = await supabase
    .from("users")
    .select("diocese_id, church_id")
    .eq("id", studentId)
    .single();

  const { data: classIds } = await supabase
    .from("class_assignments")
    .select("class_id")
    .eq("user_id", studentId)
    .eq("assignment_type", "student")
    .eq("is_active", true);

  const studentClassIds = classIds?.map((c) => c.class_id) || [];

  // Get participated activities (with participation and completion data)
  const { data: participations } = await supabase
    .from("activity_participants")
    .select(
      `
      id,
      activity_id,
      status,
      requested_at,
      approved_at,
      activities:activity_id(
        name,
        description,
        image_url,
        points
      )
    `
    )
    .eq("user_id", studentId)
    .order("requested_at", { ascending: false });

  // Get completions for these activities
  const activityIds = participations?.map((p) => p.activity_id) || [];
  const { data: completions } =
    activityIds.length > 0
      ? await supabase
          .from("activity_completions")
          .select(
            "activity_id, status, points_awarded, completed_at, is_revoked"
          )
          .eq("user_id", studentId)
          .in("activity_id", activityIds)
      : { data: [] };

  const completionsMap = new Map(
    completions?.map((c) => [c.activity_id, c]) || []
  );

  const participated: ActivityParticipation[] =
    participations?.map((p) => {
      const activityData = p.activities as unknown as {
        name: string;
        description: string | null;
        image_url: string | null;
        points: number;
      } | null;
      return {
        id: p.id,
        activity_id: p.activity_id,
        activity_name: activityData?.name || "Unknown Activity",
        activity_description: activityData?.description || null,
        activity_image_url: activityData?.image_url || null,
        points: activityData?.points || 0,
        status: p.status,
        requested_at: p.requested_at,
        approved_at: p.approved_at,
        completion_status: completionsMap.get(p.activity_id)?.status || null,
        points_awarded:
          completionsMap.get(p.activity_id)?.points_awarded || null,
        completed_at: completionsMap.get(p.activity_id)?.completed_at || null,
        is_revoked: completionsMap.get(p.activity_id)?.is_revoked || null,
      };
    }) || [];

  // Get available activities (matching student's scope)
  const scopeFilters = [];

  // Global activities (no scope restrictions)
  scopeFilters.push(
    supabase
      .from("activities")
      .select("*")
      .eq("status", "active")
      .is("diocese_id", null)
      .is("church_id", null)
      .is("class_id", null)
  );

  // Diocese-level activities
  if (student?.diocese_id) {
    scopeFilters.push(
      supabase
        .from("activities")
        .select("*")
        .eq("status", "active")
        .eq("diocese_id", student.diocese_id)
        .is("church_id", null)
        .is("class_id", null)
    );
  }

  // Church-level activities
  if (student?.church_id) {
    scopeFilters.push(
      supabase
        .from("activities")
        .select("*")
        .eq("status", "active")
        .eq("church_id", student.church_id)
        .is("class_id", null)
    );
  }

  // Class-level activities
  if (studentClassIds.length > 0) {
    scopeFilters.push(
      supabase
        .from("activities")
        .select("*")
        .eq("status", "active")
        .in("class_id", studentClassIds)
    );
  }

  // Execute all filters and combine results
  const results = await Promise.all(scopeFilters.map((query) => query));
  const allAvailableActivities = results
    .flatMap((r) => r.data || [])
    .filter(
      (activity, index, self) =>
        // Remove duplicates by id
        index === self.findIndex((a) => a.id === activity.id)
    );

  // Filter out activities the student already participated in
  const participatedIds = new Set(
    participations?.map((p) => p.activity_id) || []
  );
  const available: AvailableActivity[] = allAvailableActivities
    .filter((a) => !participatedIds.has(a.id))
    .sort((a, b) => {
      // Sort by deadline (soonest first), then by name
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

  return {
    participated,
    available,
  };
}

/**
 * Get student's points summary
 */
export async function getStudentPointsAction(
  studentId: string
): Promise<PointsSummary> {
  const supabase = createAdminClient();

  // Get points balance from student_points_balance table
  let balance = {
    available_points: 0,
    suspended_points: 0,
    used_points: 0,
    total_earned: 0,
  };

  const { data: balanceData, error: balanceError } = await supabase
    .from("student_points_balance")
    .select("available_points, suspended_points, used_points, total_earned")
    .eq("user_id", studentId)
    .single();

  if (!balanceError && balanceData) {
    balance = balanceData;
  }

  // Get activity completions for activity-specific stats
  const { data: completions } = await supabase
    .from("activity_completions")
    .select("status, is_revoked")
    .eq("user_id", studentId);

  const activities_completed =
    completions?.filter((c) => c.status === "approved" && !c.is_revoked)
      .length || 0;

  const activities_pending =
    completions?.filter((c) => c.status === "pending").length || 0;

  return {
    total_points: balance.available_points,
    available_points: balance.available_points,
    suspended_points: balance.suspended_points,
    used_points: balance.used_points,
    total_earned: balance.total_earned,
    activities_completed,
    activities_pending,
  };
}

/**
 * Get student's orders
 */
export async function getStudentOrdersAction(
  studentId: string
): Promise<StudentOrder[]> {
  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      total_points,
      notes,
      admin_notes,
      created_at,
      processed_at,
      order_items (
        id,
        item_name,
        quantity,
        unit_price,
        total_price,
        store_items (
          id,
          name,
          image_url
        )
      )
    `
    )
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching student orders:", error);
    return [];
  }

  return (orders || []) as unknown as StudentOrder[];
}
