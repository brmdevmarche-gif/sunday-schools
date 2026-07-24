import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdminApiUser, isAuthError } from "@/lib/api/auth";
import { validateCsrf } from "@/lib/api/csrf";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/dioceses/[id]/admins - Get all admins for a diocese
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdminApiUser();
    if (isAuthError(auth)) return auth.error;

    // Use admin client to bypass RLS for diocese_admins reads
    const adminClient = createAdminClient();

    // Note: assigned_by references auth.users, not public.users — can't join via PostgREST
    const { data, error } = await adminClient
      .from("diocese_admins")
      .select(
        `
        id, diocese_id, user_id, assigned_at, assigned_by, is_active, notes, created_at, updated_at,
        user:users(id, email, full_name, avatar_url)
      `
      )
      .eq("diocese_id", id)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false });

    if (error) {
      logger.error("Error fetching diocese admins:", error);
      return apiError("Failed to fetch diocese admins", 500);
    }

    return apiSuccess(data);
  } catch (error) {
    logger.error("Error in GET /api/admin/dioceses/[id]/admins:", error);
    return apiError("Internal server error", 500);
  }
}

// POST /api/admin/dioceses/[id]/admins - Assign a user as diocese admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const { id } = await params;
    const auth = await requireAdminApiUser();
    if (isAuthError(auth)) return auth.error;
    const { user } = auth;

    const body = await request.json();
    const { user_id, notes } = body;

    if (!user_id) {
      return apiError("user_id is required", 400);
    }

    // Use admin client to bypass RLS for diocese_admins insert
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("diocese_admins")
      .insert({
        diocese_id: id,
        user_id,
        assigned_by: user.id,
        notes,
      })
      .select(
        `
        id, diocese_id, user_id, assigned_at, assigned_by, is_active, notes, created_at, updated_at,
        user:users(id, email, full_name, avatar_url)
      `
      )
      .single();

    if (error) {
      logger.error("Error assigning diocese admin:", error);
      if (error.code === "23505") {
        return apiError("User is already an admin of this diocese", 409);
      }
      return apiError("Failed to assign diocese admin", 500);
    }

    return apiSuccess({ data }, 201);
  } catch (error) {
    logger.error("Error in POST /api/admin/dioceses/[id]/admins:", error);
    return apiError("Internal server error", 500);
  }
}
