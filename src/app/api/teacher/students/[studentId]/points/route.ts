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
    // Get points balance
    const { data: balanceData } = await supabase
      .from("student_points_balance")
      .select("available_points, suspended_points, total_earned")
      .eq("user_id", studentId)
      .maybeSingle();

    // Get recent transactions
    const { data: transactions } = await supabase
      .from("point_transactions")
      .select("id, points, reason, created_at, source_type")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      availablePoints: balanceData?.available_points || 0,
      suspendedPoints: balanceData?.suspended_points || 0,
      totalEarned: balanceData?.total_earned || 0,
      transactions:
        transactions?.map((t) => ({
          id: t.id,
          points: t.points,
          reason: t.reason || "Points adjustment",
          createdAt: t.created_at,
          sourceType: t.source_type,
        })) || [],
    });
  } catch (error) {
    console.error("Error fetching student points:", error);
    return NextResponse.json(
      { error: "Failed to fetch points" },
      { status: 500 }
    );
  }
}
