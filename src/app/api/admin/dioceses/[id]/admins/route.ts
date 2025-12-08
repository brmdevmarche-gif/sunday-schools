import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/dioceses/[id]/admins - Get all admins for a diocese
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get diocese admins with user details
    const { data, error } = await supabase
      .from("diocese_admins")
      .select(
        `
        *,
        user:users!diocese_admins_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        ),
        assigned_by_user:users!diocese_admins_assigned_by_fkey (
          id,
          full_name
        )
      `
      )
      .eq("diocese_id", id)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Error fetching diocese admins:", error);
      return NextResponse.json(
        { error: "Failed to fetch diocese admins" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/admin/dioceses/[id]/admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/dioceses/[id]/admins - Assign a user as diocese admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { user_id, notes } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Insert diocese admin assignment
    const { data, error } = await supabase
      .from("diocese_admins")
      .insert({
        diocese_id: id,
        user_id,
        assigned_by: user.id,
        notes,
      })
      .select(
        `
        *,
        user:users!diocese_admins_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error("Error assigning diocese admin:", error);

      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "User is already an admin of this diocese" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to assign diocese admin" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/dioceses/[id]/admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
