"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

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

export type LoginResult =
  | { success: true; redirectPath: string }
  | { success: false; error: string };

/**
 * Server-side login - bypasses browser fetch to Supabase.
 * Use when client-side signInWithPassword fails (e.g. network/CORS).
 */
export async function loginAction(
  identifier: string,
  password: string
): Promise<LoginResult> {
  // Rate limit: 5 attempts per minute per IP
  const rateLimitKey = await getRateLimitKey("login");
  const rl = await rateLimit(rateLimitKey, 5, 60_000);
  if (!rl.success) {
    return {
      success: false,
      error: "Too many login attempts. Please wait a minute and try again.",
    };
  }

  let email = identifier;

  if (/^\d{6}$/.test(identifier)) {
    const userEmail = await getEmailByUserCode(identifier);
    if (!userEmail) {
      return { success: false, error: "invalid_user_code" };
    }
    email = userEmail;
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message.toLowerCase().includes("fetch")
          ? "connection_error"
          : error.message,
      };
    }

    const user = data.user;
    if (!user?.id) {
      return { success: false, error: "Unknown error" };
    }

    let redirectPath = "/dashboard";
    const { data: profile } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    // Block inactive users — sign them out immediately
    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return { success: false, error: "account_inactive" };
    }

    if (profile?.role) {
      switch (profile.role) {
        case "super_admin":
        case "diocese_admin":
        case "church_admin":
          redirectPath = "/admin";
          break;
        case "teacher":
          redirectPath = "/dashboard/teacher";
          break;
        case "parent":
          redirectPath = "/dashboard/parents";
          break;
      }
    }

    // Log successful login (server-side)
    try {
      const headersList = await headers();
      const userAgent = headersList.get("user-agent") || "unknown";
      const adminClient = createAdminClient();
      await adminClient.from("login_history").insert({
        user_id: user.id,
        success: true,
        user_agent: userAgent,
        device_info: userAgent.slice(0, 100),
      });
    } catch {
      // Non-critical, ignore
    }

    return { success: true, redirectPath };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: msg.toLowerCase().includes("fetch") ? "connection_error" : msg,
    };
  }
}
