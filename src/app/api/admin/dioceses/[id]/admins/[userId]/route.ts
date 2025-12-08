import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/admin/dioceses/[id]/admins/[userId] - Revoke diocese admin access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("diocese_admins")
      .update({ is_active: false })
      .eq("diocese_id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error revoking diocese admin:", error);
      return NextResponse.json(
        { error: "Failed to revoke diocese admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error in DELETE /api/admin/dioceses/[id]/admins/[userId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/dioceses/[id]/admins/[userId] - Reactivate diocese admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { is_active, notes } = body;

    // Update diocese admin
    const { error } = await supabase
      .from("diocese_admins")
      .update({
        is_active: is_active !== undefined ? is_active : true,
        notes: notes !== undefined ? notes : undefined,
      })
      .eq("diocese_id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating diocese admin:", error);
      return NextResponse.json(
        { error: "Failed to update diocese admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error in PATCH /api/admin/dioceses/[id]/admins/[userId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
