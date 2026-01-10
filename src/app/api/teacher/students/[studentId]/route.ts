import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get student profile
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select(
        `
        id,
        full_name,
        avatar_url,
        user_code,
        notes,
        churches(name)
      `
      )
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get student's class
    const { data: classData } = await supabase
      .from("class_students")
      .select(`classes(id, name)`)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();

    const classInfo = classData?.classes as unknown as {
      id: string;
      name: string;
    } | null;

    // Get parent info from user_relationships
    const { data: parentRelation } = await supabase
      .from("user_relationships")
      .select(`users!user_relationships_parent_id_fkey(full_name, phone, email)`)
      .eq("child_id", studentId)
      .eq("is_active", true)
      .maybeSingle();

    const parentInfo = parentRelation?.users as unknown as {
      full_name: string | null;
      phone: string | null;
      email: string | null;
    } | null;

    // Get points balance
    const { data: pointsData } = await supabase
      .from("student_points_balance")
      .select("available_points")
      .eq("user_id", studentId)
      .maybeSingle();

    // Get attendance rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", studentId)
      .gte("date", thirtyDaysAgoStr);

    let attendanceRate = 0;
    if (attendanceData && attendanceData.length > 0) {
      const presentCount = attendanceData.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
    }

    // Get activities count (simplified - count of competition entries)
    const { count: activitiesCount } = await supabase
      .from("competition_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", studentId);

    const churchData = student.churches as unknown as { name: string } | null;

    return NextResponse.json({
      id: student.id,
      fullName: student.full_name || "Unknown Student",
      avatarUrl: student.avatar_url,
      userCode: student.user_code,
      className: classInfo?.name || "No Class",
      churchName: churchData?.name || "",
      parentName: parentInfo?.full_name,
      parentPhone: parentInfo?.phone,
      parentEmail: parentInfo?.email,
      notes: student.notes,
      pointsBalance: pointsData?.available_points || 0,
      attendanceRate,
      activitiesCount: activitiesCount || 0,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}
