// =====================================================
// DIOCESE ADMIN MANAGEMENT
// =====================================================

import { createClient } from "@/lib/supabase/server";
import type {
  DioceseAdmin,
  CreateDioceseAdminInput,
} from "@/lib/types/sunday-school";

/**
 * Assign a user as an administrator of a diocese
 */
export async function assignDioceseAdmin(
  input: CreateDioceseAdminInput
): Promise<{ data: DioceseAdmin | null; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("diocese_admins")
      .insert({
        diocese_id: input.diocese_id,
        user_id: input.user_id,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error assigning diocese admin:", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all admins for a specific diocese
 */
export async function getDioceseAdmins(
  dioceseId: string
): Promise<{ data: DioceseAdmin[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("diocese_admins")
      .select("*")
      .eq("diocese_id", dioceseId)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching diocese admins:", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all dioceses where a user is an admin
 */
export async function getUserDioceseAdminRoles(
  userId: string
): Promise<{ data: DioceseAdmin[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("diocese_admins")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching user diocese admin roles:", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Check if a user is an admin of a specific diocese
 */
export async function isDioceseAdmin(
  userId: string,
  dioceseId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("diocese_admins")
      .select("id")
      .eq("user_id", userId)
      .eq("diocese_id", dioceseId)
      .eq("is_active", true)
      .single();

    return !!data && !error;
  } catch (error) {
    console.error("Error checking diocese admin status:", error);
    return false;
  }
}

/**
 * Revoke admin access (soft delete by setting is_active to false)
 */
export async function revokeDioceseAdmin(
  dioceseId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("diocese_admins")
      .update({ is_active: false })
      .eq("diocese_id", dioceseId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error revoking diocese admin:", error);
    return { success: false, error: error as Error };
  }
}

/**
 * Reactivate admin access
 */
export async function reactivateDioceseAdmin(
  dioceseId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("diocese_admins")
      .update({ is_active: true })
      .eq("diocese_id", dioceseId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error reactivating diocese admin:", error);
    return { success: false, error: error as Error };
  }
}

/**
 * Delete diocese admin assignment permanently
 */
export async function deleteDioceseAdmin(
  dioceseId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("diocese_admins")
      .delete()
      .eq("diocese_id", dioceseId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting diocese admin:", error);
    return { success: false, error: error as Error };
  }
}

/**
 * Get diocese admins with user details (joined query)
 */
export async function getDioceseAdminsWithUsers(dioceseId: string): Promise<{
  data:
    | (DioceseAdmin & {
        user: { id: string; email: string; full_name: string | null };
      })[]
    | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("diocese_admins")
      .select(
        `
        *,
        user:users!diocese_admins_user_id_fkey (
          id,
          email,
          full_name
        )
      `
      )
      .eq("diocese_id", dioceseId)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    console.error("Error fetching diocese admins with users:", error);
    return { data: null, error: error as Error };
  }
}
