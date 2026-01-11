"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AttendanceStatus = "present" | "absent" | "excused" | "late";

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  status: AttendanceStatus | null;
  notes: string;
}

export interface ClassAttendanceData {
  classId: string;
  className: string;
  churchName: string;
  date: string;
  records: AttendanceRecord[];
}

export interface SaveAttendanceInput {
  classId: string;
  date: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

/**
 * Get students for attendance marking
 */
export async function getClassAttendance(
  classId: string,
  date?: string
): Promise<ClassAttendanceData | null> {
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

  // Use today's date if not provided
  const attendanceDate = date || new Date().toISOString().split("T")[0];

  // Get students in the class
  const { data: classStudents, error: studentsError } = await supabase
    .from("class_students")
    .select(
      `
      student_id,
      users(
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("class_id", classId)
    .eq("status", "active");

  if (studentsError || !classStudents) {
    console.error("Error fetching class students:", studentsError);
    return null;
  }

  // Get existing attendance records for this date
  const studentIds = classStudents
    .map((cs) => {
      const student = cs.users as unknown as { id: string } | null;
      return student?.id;
    })
    .filter(Boolean) as string[];

  const { data: existingRecords } = await supabase
    .from("attendance_records")
    .select("student_id, status, notes")
    .eq("class_id", classId)
    .eq("date", attendanceDate)
    .in("student_id", studentIds);

  // Build record map for existing data
  const recordMap: { [key: string]: { status: AttendanceStatus; notes: string } } = {};
  if (existingRecords) {
    for (const record of existingRecords) {
      recordMap[record.student_id] = {
        status: record.status as AttendanceStatus,
        notes: record.notes || "",
      };
    }
  }

  // Build attendance records
  const records: AttendanceRecord[] = [];

  for (const cs of classStudents) {
    const studentInfo = cs.users as unknown as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;

    if (!studentInfo) continue;

    const existing = recordMap[studentInfo.id];

    records.push({
      studentId: studentInfo.id,
      studentName: studentInfo.full_name || "Unknown Student",
      avatarUrl: studentInfo.avatar_url,
      status: existing?.status || null,
      notes: existing?.notes || "",
    });
  }

  // Sort by name
  records.sort((a, b) => a.studentName.localeCompare(b.studentName));

  return {
    classId: classInfo.id,
    className: classInfo.name,
    churchName: classInfo.churches?.name || "",
    date: attendanceDate,
    records,
  };
}

/**
 * Save attendance records
 */
export async function saveAttendance(
  input: SaveAttendanceInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify teacher has access to this class
  const { data: assignment } = await supabase
    .from("class_assignments")
    .select("id")
    .eq("user_id", user.id)
    .eq("class_id", input.classId)
    .eq("assignment_type", "teacher")
    .eq("is_active", true)
    .maybeSingle();

  if (!assignment) {
    return { success: false, error: "Access denied" };
  }

  // Filter only records that have a status set
  const recordsToSave = input.records.filter((r) => r.status);

  if (recordsToSave.length === 0) {
    return { success: false, error: "No records to save" };
  }

  // Delete existing records for this date/class
  const { error: deleteError } = await supabase
    .from("attendance_records")
    .delete()
    .eq("class_id", input.classId)
    .eq("date", input.date)
    .in(
      "student_id",
      recordsToSave.map((r) => r.studentId)
    );

  if (deleteError) {
    console.error("Error deleting existing records:", deleteError);
    return { success: false, error: "Failed to update attendance" };
  }

  // Insert new records
  const recordsToInsert = recordsToSave.map((r) => ({
    class_id: input.classId,
    student_id: r.studentId,
    date: input.date,
    status: r.status,
    notes: r.notes || null,
    marked_by: user.id,
    created_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase
    .from("attendance_records")
    .insert(recordsToInsert);

  if (insertError) {
    console.error("Error inserting attendance records:", insertError);
    return { success: false, error: "Failed to save attendance" };
  }

  // Revalidate paths
  revalidatePath("/dashboard/teacher");
  revalidatePath(`/dashboard/teacher/attendance`);
  revalidatePath(`/dashboard/teacher/classes/${input.classId}`);

  return { success: true };
}

/**
 * Get teacher's classes for class selector
 */
export async function getTeacherClassesForAttendance(): Promise<
  { id: string; name: string; churchName: string }[]
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: assignments } = await supabase
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
    .eq("assignment_type", "teacher")
    .eq("is_active", true);

  if (!assignments) {
    return [];
  }

  return assignments
    .map((a) => {
      const classInfo = a.classes as unknown as {
        id: string;
        name: string;
        churches: { name: string } | null;
      } | null;

      if (!classInfo) return null;

      return {
        id: classInfo.id,
        name: classInfo.name,
        churchName: classInfo.churches?.name || "",
      };
    })
    .filter(Boolean) as { id: string; name: string; churchName: string }[];
}
