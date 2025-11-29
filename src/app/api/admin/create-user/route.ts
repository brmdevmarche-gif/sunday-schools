import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic to prevent evaluation during build
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Validate environment variables
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Missing required environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Create admin client with service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  try {
    const body = await request.json();
    const {
      email,
      password,
      role,
      username,
      full_name,
      church_id,
      diocese_id,
    } = body;

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    // Create user in auth.users
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          full_name,
        },
      });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the user profile with role and organizational links
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        role,
        username,
        full_name,
        church_id: church_id || null,
        diocese_id: diocese_id || null,
        is_active: true,
      })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      // User was created but profile update failed - still return success
      // The admin can update the role manually if needed
    }

    // Fetch the complete user profile
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
    }

    return NextResponse.json({
      success: true,
      user: userData || { id: authData.user.id, email, role },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
