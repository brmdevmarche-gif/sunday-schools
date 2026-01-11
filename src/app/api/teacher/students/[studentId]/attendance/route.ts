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
    // Get attendance records for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const { data: records } = await supabase
      .from("attendance_records")
      .select("id, date, status, notes")
      .eq("student_id", studentId)
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: false })
      .limit(20);

    // Calculate stats
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let excusedDays = 0;

    if (records) {
      for (const record of records) {
        switch (record.status) {
          case "present":
            presentDays++;
            break;
          case "absent":
            absentDays++;
            break;
          case "late":
            lateDays++;
            break;
          case "excused":
            excusedDays++;
            break;
        }
      }
    }

    const totalDays = records?.length || 0;
    const attendedDays = presentDays + lateDays;
    const rate = totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 0;

    return NextResponse.json({
      rate,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      records:
        records?.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          notes: r.notes,
        })) || [],
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
