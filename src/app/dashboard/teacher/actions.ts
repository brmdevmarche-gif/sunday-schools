"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface TeacherStats {
  classesCount: number;
  studentsCount: number;
  pendingCount: number;
  attendanceRate: number;
}

export interface TeacherClass {
  id: string;
  name: string;
  churchName: string;
  studentCount: number;
}

export interface ActionRequiredItem {
  id: string;
  type: "trip" | "competition" | "activity";
  title: string;
  count: number;
  subtitle?: string;
  href: string;
}

export interface TeacherDashboardData {
  teacher: {
    id: string;
    name: string;
    church: string;
    avatarUrl?: string;
  };
  stats: TeacherStats;
  classes: TeacherClass[];
  actionRequired: ActionRequiredItem[];
  isOrganizingTrips: boolean;
  unreadAnnouncementsCount: number;
}

/**
 * Get teacher dashboard data including stats, classes, and pending actions
 */
export async function getTeacherDashboardData(): Promise<TeacherDashboardData | null> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get teacher profile
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      avatar_url,
      churches(id, name)
    `
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching teacher profile:", profileError);
    return null;
  }

  const churchData = profile.churches as unknown as { id: string; name: string } | null;

  // Get assigned classes with student counts
  const { data: classAssignments, error: classError } = await supabase
    .from("class_assignments")
    .select(
      `
      class_id,
      classes(
        id,
        name,
        churches(name)
      )
    `
    )
    .eq("user_id", user.id)
    .eq("assignment_type", "teacher")
    .eq("is_active", true);

  if (classError) {
    console.error("Error fetching class assignments:", classError);
  }

  const classes: TeacherClass[] = [];
  let totalStudents = 0;

  if (classAssignments) {
    for (const assignment of classAssignments) {
      const classInfo = assignment.classes as unknown as {
        id: string;
        name: string;
        churches: { name: string } | null;
      };

      if (classInfo) {
        // Get student count for this class
        const { count } = await supabase
          .from("class_students")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classInfo.id)
          .eq("status", "active");

        const studentCount = count || 0;
        totalStudents += studentCount;

        classes.push({
          id: classInfo.id,
          name: classInfo.name,
          churchName: classInfo.churches?.name || "",
          studentCount,
        });
      }
    }
  }

  // Get pending trip approvals (for trips teacher is organizing)
  const { data: tripOrganizer } = await supabase
    .from("trip_organizers")
    .select("trip_id")
    .eq("user_id", user.id)
    .eq("can_approve", true);

  const tripIds = tripOrganizer?.map((t) => t.trip_id) || [];
  let pendingTripApprovals = 0;

  if (tripIds.length > 0) {
    const { count } = await supabase
      .from("trip_participants")
      .select("*", { count: "exact", head: true })
      .in("trip_id", tripIds)
      .eq("approval_status", "pending");

    pendingTripApprovals = count || 0;
  }

  // Get pending competition submissions (simplified - would need proper logic)
  // For now, we'll return 0 as placeholder
  const pendingCompetitionReviews = 0;

  // Calculate total pending
  const pendingCount = pendingTripApprovals + pendingCompetitionReviews;

  // Get attendance rate (last 30 days for teacher's classes)
  let attendanceRate = 0;
  if (classes.length > 0) {
    const classIds = classes.map((c) => c.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select("status")
      .in("class_id", classIds)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

    if (attendanceData && attendanceData.length > 0) {
      const presentCount = attendanceData.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
    }
  }

  // Get unread announcements count
  const { count: unreadCount } = await supabase
    .from("announcement_recipients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("viewed", false);

  // Build action required items
  const actionRequired: ActionRequiredItem[] = [];

  if (pendingTripApprovals > 0) {
    actionRequired.push({
      id: "trip-approvals",
      type: "trip",
      title: "Trip Approvals",
      count: pendingTripApprovals,
      subtitle: "pending requests",
      href: "/dashboard/teacher/action-required?type=trip",
    });
  }

  if (pendingCompetitionReviews > 0) {
    actionRequired.push({
      id: "competition-reviews",
      type: "competition",
      title: "Competition Reviews",
      count: pendingCompetitionReviews,
      subtitle: "submissions to review",
      href: "/dashboard/teacher/action-required?type=competition",
    });
  }

  return {
    teacher: {
      id: profile.id,
      name: profile.full_name || "Teacher",
      church: churchData?.name || "",
      avatarUrl: profile.avatar_url || undefined,
    },
    stats: {
      classesCount: classes.length,
      studentsCount: totalStudents,
      pendingCount,
      attendanceRate,
    },
    classes,
    actionRequired,
    isOrganizingTrips: tripIds.length > 0,
    unreadAnnouncementsCount: unreadCount || 0,
  };
}

/**
 * Get list of classes teacher is assigned to (for attendance dropdown)
 */
export async function getTeacherClasses(): Promise<TeacherClass[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: classAssignments } = await supabase
    .from("class_assignments")
    .select(
      `
      class_id,
      classes(
        id,
        name,
        churches(name)
      )
    `
    )
    .eq("user_id", user.id)
    .eq("assignment_type", "teacher")
    .eq("is_active", true);

  if (!classAssignments) {
    return [];
  }

  const classes: TeacherClass[] = [];

  for (const assignment of classAssignments) {
    const classInfo = assignment.classes as unknown as {
      id: string;
      name: string;
      churches: { name: string } | null;
    };

    if (classInfo) {
      const { count } = await supabase
        .from("class_students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classInfo.id)
        .eq("status", "active");

      classes.push({
        id: classInfo.id,
        name: classInfo.name,
        churchName: classInfo.churches?.name || "",
        studentCount: count || 0,
      });
    }
  }

  return classes;
}
