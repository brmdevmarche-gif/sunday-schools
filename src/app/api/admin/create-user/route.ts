import { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { requireAdminApiUser, isAuthError } from "@/lib/api/auth";
import { validateCsrf } from "@/lib/api/csrf";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { USER_ROLES } from "@/lib/constants/roles";

export const dynamic = "force-dynamic";

const ROLE_HIERARCHY: Record<string, number> = Object.fromEntries(
  USER_ROLES.map((role, index) => [role, index])
);

const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  role: z.enum(USER_ROLES),
  username: z.string().min(1).max(100).optional(),
  full_name: z.string().min(1).max(200).optional(),
  church_id: z.string().uuid().optional().nullable(),
  diocese_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const auth = await requireAdminApiUser();
  if (isAuthError(auth)) return auth.error;
  const { profile } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      details[key] = details[key] || [];
      details[key].push(issue.message);
    }
    return apiError("Validation failed", 400, details);
  }

  const { email, password, role, username, full_name, church_id, diocese_id } =
    parsed.data;

  const creatorLevel = ROLE_HIERARCHY[profile.role] ?? Infinity;
  const targetLevel = ROLE_HIERARCHY[role] ?? -1;
  if (targetLevel <= creatorLevel) {
    return apiError(
      "You cannot create a user with a role equal to or above your own",
      403
    );
  }

  const supabaseAdmin = createAdminClient();

  try {
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
      logger.error("Auth error creating user", { error: authError.message });
      return apiError(authError.message, 400);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        role,
        username: username || null,
        full_name: full_name || null,
        church_id: church_id || null,
        diocese_id: diocese_id || null,
        is_active: true,
      })
      .eq("id", authData.user.id);

    if (updateError) {
      logger.error("Profile update error after user creation", {
        userId: authData.user.id,
        error: updateError.message,
      });
    }

    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, role, username, full_name, church_id, diocese_id, is_active, created_at")
      .eq("id", authData.user.id)
      .single();

    if (fetchError) {
      logger.error("Failed to fetch created user profile", {
        userId: authData.user.id,
        error: fetchError.message,
      });
    }

    return apiSuccess(
      userData || { id: authData.user.id, email, role },
      201
    );
  } catch (error) {
    logger.error("Create user error", { error });
    return apiError("Failed to create user", 500);
  }
}
