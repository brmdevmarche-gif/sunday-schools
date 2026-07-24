import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdminApiUser, isAuthError } from "@/lib/api/auth";
import { validateCsrf } from "@/lib/api/csrf";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE /api/admin/dioceses/[id]/admins/[userId] - Revoke diocese admin access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const { id, userId } = await params;
    const auth = await requireAdminApiUser();
    if (isAuthError(auth)) return auth.error;
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("diocese_admins")
      .update({ is_active: false })
      .eq("diocese_id", id)
      .eq("user_id", userId);

    if (error) {
      logger.error("Error revoking diocese admin:", error);
      return apiError("Failed to revoke diocese admin", 500);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error("Error in DELETE /api/admin/dioceses/[id]/admins/[userId]:", error);
    return apiError("Internal server error", 500);
  }
}

// PATCH /api/admin/dioceses/[id]/admins/[userId] - Reactivate diocese admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const { id, userId } = await params;
    const auth = await requireAdminApiUser();
    if (isAuthError(auth)) return auth.error;
    const adminClient = createAdminClient();

    const body = await request.json();
    const { is_active, notes } = body;

    const { error } = await adminClient
      .from("diocese_admins")
      .update({
        is_active: is_active !== undefined ? is_active : true,
        notes: notes !== undefined ? notes : undefined,
      })
      .eq("diocese_id", id)
      .eq("user_id", userId);

    if (error) {
      logger.error("Error updating diocese admin:", error);
      return apiError("Failed to update diocese admin", 500);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error("Error in PATCH /api/admin/dioceses/[id]/admins/[userId]:", error);
    return apiError("Internal server error", 500);
  }
}
