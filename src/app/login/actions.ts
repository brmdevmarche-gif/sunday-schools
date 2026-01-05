"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Look up a user's email by their user_code
 * Uses admin client to bypass RLS policies
 */
export async function getEmailByUserCode(userCode: string): Promise<string | null> {
  const adminClient = createAdminClient();

  const { data: user, error } = await adminClient
    .from("users")
    .select("email")
    .eq("user_code", userCode)
    .single();

  if (error || !user) {
    return null;
  }

  return user.email;
}
