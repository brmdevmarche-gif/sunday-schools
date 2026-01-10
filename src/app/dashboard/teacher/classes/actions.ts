"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface TeacherClassDetails {
  id: string;
  name: string;
  churchName: string;
  studentCount: number;
  lastAttendanceDate: string | null;
  attendanceTakenThisWeek: boolean;
}

export interface ClassStudent {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  userCode: string | null;
  pointsBalance: number;
  attendanceRate: number;
}

export interface ClassStats {
  totalStudents: number;
  averageAttendance: number;
  attendanceByDay: { day: string; rate: number }[];
  topAttendees: { name: string; rate: number }[];
  bottomAttendees: { name: string; rate: number }[];
  totalPointsAwarded: number;
}

/**
 * Get teacher's classes with detailed attendance status
 */
export async function getTeacherClassesWithDetails(): Promise<TeacherClassDetails[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get teacher's class assignments
  const { data: classAssignments, error: assignmentError } = await supabase
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

  if (assignmentError) {
    console.error("Error fetching class assignments:", assignmentError);
    return [];
  }

  if (!classAssignments || classAssignments.length === 0) {
    return [];
  }

  // Calculate start of current week (Sunday)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

  const classes: TeacherClassDetails[] = [];

  for (const assignment of classAssignments) {
    const classInfo = assignment.classes as unknown as {
      id: string;
      name: string;
      churches: { name: string } | null;
    };

    if (!classInfo) continue;

    // Get student count for this class
    const { count: studentCount } = await supabase
      .from("class_students")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classInfo.id)
      .eq("status", "active");

    // Get latest attendance record for this class
    const { data: lastAttendance } = await supabase
      .from("attendance_records")
      .select("date")
      .eq("class_id", classInfo.id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if attendance was taken this week
    const { count: thisWeekAttendance } = await supabase
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classInfo.id)
      .gte("date", startOfWeekStr);

    classes.push({
      id: classInfo.id,
      name: classInfo.name,
      churchName: classInfo.churches?.name || "",
      studentCount: studentCount || 0,
      lastAttendanceDate: lastAttendance?.date || null,
      attendanceTakenThisWeek: (thisWeekAttendance || 0) > 0,
    });
  }

  return classes;
}

/**
 * Get students in a class with their stats
 */
export async function getClassStudents(classId: string): Promise<ClassStudent[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify teacher has access to this class
  const { data: assignment } = await supabase
    .from("class_assignments")
    .select("id")
    .eq("user_id", user.id)
    .eq("class_id", classId)
    .eq("assignment_type", "teacher")
    .eq("is_active", true)
    .maybeSingle();

  if (!assignment) {
    return [];
  }

  // Get students in the class
  const { data: classStudents, error: studentsError } = await supabase
    .from("class_students")
    .select(
      `
      student_id,
      users(
        id,
        full_name,
        avatar_url,
        user_code
      )
    `
    )
    .eq("class_id", classId)
    .eq("status", "active");

  if (studentsError || !classStudents) {
    console.error("Error fetching class students:", studentsError);
    return [];
  }

  const students: ClassStudent[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  for (const cs of classStudents) {
    const studentInfo = cs.users as unknown as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      user_code: string | null;
    };

    if (!studentInfo) continue;

    // Get points balance
    const { data: pointsData } = await supabase
      .from("student_points_balance")
      .select("available_points")
      .eq("user_id", studentInfo.id)
      .maybeSingle();

    // Get attendance rate (last 30 days)
    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", studentInfo.id)
      .eq("class_id", classId)
      .gte("date", thirtyDaysAgoStr);

    let attendanceRate = 0;
    if (attendanceData && attendanceData.length > 0) {
      const presentCount = attendanceData.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
    }

    students.push({
      id: studentInfo.id,
      fullName: studentInfo.full_name || "Unknown Student",
      avatarUrl: studentInfo.avatar_url,
      userCode: studentInfo.user_code,
      pointsBalance: pointsData?.available_points || 0,
      attendanceRate,
    });
  }

  // Sort by name
  students.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return students;
}

/**
 * Get class statistics
 */
export async function getClassStats(classId: string): Promise<ClassStats | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify teacher has access to this class
  const { data: assignment } = await supabase
    .from("class_assignments")
    .select("id")
    .eq("user_id", user.id)
    .eq("class_id", classId)
    .eq("assignment_type", "teacher")
    .eq("is_active", true)
    .maybeSingle();

  if (!assignment) {
    return null;
  }

  // Get student count
  const { count: totalStudents } = await supabase
    .from("class_students")
    .select("*", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("status", "active");

  // Get attendance data for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: attendanceData } = await supabase
    .from("attendance_records")
    .select("status, date, student_id")
    .eq("class_id", classId)
    .gte("date", thirtyDaysAgoStr);

  // Calculate average attendance
  let averageAttendance = 0;
  if (attendanceData && attendanceData.length > 0) {
    const presentCount = attendanceData.filter(
      (r) => r.status === "present" || r.status === "late"
    ).length;
    averageAttendance = Math.round((presentCount / attendanceData.length) * 100);
  }

  // Calculate attendance by day of week
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const attendanceByDay: { day: string; rate: number }[] = dayNames.map(
    (day) => ({ day, rate: 0 })
  );

  if (attendanceData && attendanceData.length > 0) {
    const dayTotals: { [key: number]: { present: number; total: number } } = {};
    for (let i = 0; i < 7; i++) {
      dayTotals[i] = { present: 0, total: 0 };
    }

    for (const record of attendanceData) {
      const dayOfWeek = new Date(record.date).getDay();
      dayTotals[dayOfWeek].total++;
      if (record.status === "present" || record.status === "late") {
        dayTotals[dayOfWeek].present++;
      }
    }

    for (let i = 0; i < 7; i++) {
      if (dayTotals[i].total > 0) {
        attendanceByDay[i].rate = Math.round(
          (dayTotals[i].present / dayTotals[i].total) * 100
        );
      }
    }
  }

  // Get student attendance rankings
  const studentAttendance: { [key: string]: { name: string; present: number; total: number } } = {};

  if (attendanceData) {
    // Get unique student IDs
    const studentIds = [...new Set(attendanceData.map((r) => r.student_id))];

    // Fetch student names
    const { data: students } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", studentIds);

    const studentNames: { [key: string]: string } = {};
    if (students) {
      for (const s of students) {
        studentNames[s.id] = s.full_name || "Unknown";
      }
    }

    for (const record of attendanceData) {
      if (!studentAttendance[record.student_id]) {
        studentAttendance[record.student_id] = {
          name: studentNames[record.student_id] || "Unknown",
          present: 0,
          total: 0,
        };
      }
      studentAttendance[record.student_id].total++;
      if (record.status === "present" || record.status === "late") {
        studentAttendance[record.student_id].present++;
      }
    }
  }

  const studentRates = Object.values(studentAttendance).map((s) => ({
    name: s.name,
    rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  }));

  studentRates.sort((a, b) => b.rate - a.rate);

  const topAttendees = studentRates.slice(0, 5);
  const bottomAttendees = studentRates.slice(-5).reverse();

  // Get total points awarded (simplified - would need proper query)
  const { data: pointsData } = await supabase
    .from("point_transactions")
    .select("points")
    .eq("source_type", "class")
    .eq("source_id", classId)
    .gte("created_at", thirtyDaysAgoStr);

  let totalPointsAwarded = 0;
  if (pointsData) {
    totalPointsAwarded = pointsData.reduce((sum, p) => sum + (p.points || 0), 0);
  }

  return {
    totalStudents: totalStudents || 0,
    averageAttendance,
    attendanceByDay,
    topAttendees,
    bottomAttendees,
    totalPointsAwarded,
  };
}

/**
 * Get class info by ID
 */
export async function getClassInfo(
  classId: string
): Promise<{ id: string; name: string; churchName: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify teacher has access
  const { data: assignment } = await supabase
    .from("class_assignments")
    .select(
      `
      classes(
        id,
        name,
        churches(name)
      )
    `
    )
    .eq("user_id", user.id)
    .eq("class_id", classId)
    .eq("assignment_type", "teacher")
    .eq("is_active", true)
    .maybeSingle();

  if (!assignment) {
    return null;
  }

  const classInfo = assignment.classes as unknown as {
    id: string;
    name: string;
    churches: { name: string } | null;
  };

  return {
    id: classInfo.id,
    name: classInfo.name,
    churchName: classInfo.churches?.name || "",
  };
}
