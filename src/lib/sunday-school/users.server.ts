import { createClient } from "../supabase/server";
import { logger } from "@/lib/logger";
import type { ExtendedUser } from "../types/sunday-school";

/**
 * Get current user's extended profile (server-side only)
 * This function should only be used in server components or server actions
 */
export async function getCurrentUserProfile(): Promise<ExtendedUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch user profile from the database
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    logger.error('Error fetching user profile:', error);
    return null;
  }

  return data as ExtendedUser;
}
