import { createClient } from "../supabase/client";
import type { ExtendedUser, UserRole } from "../types/sunday-school";

/**
 * Get all users with optional filters
 */
export async function getUsers(filters?: {
  role?: UserRole;
  churchId?: string;
  dioceseId?: string;
  isActive?: boolean;
}): Promise<ExtendedUser[]> {
  const supabase = createClient();

  let query = supabase
    .from("users")
    .select("*")
    .order("full_name", { ascending: true });

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }
  if (filters?.churchId) {
    query = query.eq("church_id", filters.churchId);
  }
  if (filters?.dioceseId) {
    query = query.eq("diocese_id", filters.dioceseId);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ExtendedUser[];
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<ExtendedUser | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as ExtendedUser;
}

/**
 * Update user information
 */
export async function updateUser(
  id: string,
  updates: Partial<Omit<ExtendedUser, "id" | "email" | "created_at">>
): Promise<ExtendedUser> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ExtendedUser;
}

/**
 * Update user role and organizational assignment
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
  dioceseId?: string | null,
  churchId?: string | null
): Promise<ExtendedUser> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .update({
      role,
      diocese_id: dioceseId,
      church_id: churchId,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as ExtendedUser;
}

/**
 * Get current user's extended profile (client-side safe)
 * This function uses the API route and can be called from client components
 *
 * For server components, use getCurrentUserProfile from './users.server.ts'
 */
export async function getCurrentUserProfileClient(): Promise<ExtendedUser | null> {
  try {
    const response = await fetch('/api/auth/profile');
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error('Failed to fetch profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get teachers available for assignment
 */
export async function getAvailableTeachers(
  churchId: string
): Promise<ExtendedUser[]> {
  return getUsers({
    role: "teacher",
    churchId,
    isActive: true,
  });
}

/**
 * Get students for a church
 */
export async function getStudents(churchId: string): Promise<ExtendedUser[]> {
  return getUsers({
    role: "student",
    churchId,
    isActive: true,
  });
}

/**
 * Get parent-student relationships
 */
export async function getParentStudents(parentId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_relationships")
    .select(
      `
      *,
      student:users!user_relationships_student_id_fkey(*)
    `
    )
    .eq("parent_id", parentId);

  if (error) throw error;
  return data;
}

/**
 * Link parent to student
 */
export async function linkParentToStudent(
  parentId: string,
  studentId: string,
  relationshipType: "parent" | "guardian" = "parent"
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_relationships")
    .insert({
      parent_id: parentId,
      student_id: studentId,
      relationship_type: relationshipType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deactivate user
 */
export async function deactivateUser(userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Activate user
 */
export async function activateUser(userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: true })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Create a new user (admin only)
 */
export async function createUser(input: {
  email: string;
  password: string;
  role: UserRole;
  username?: string;
  full_name?: string;
  church_id?: string;
  diocese_id?: string;
}): Promise<ExtendedUser> {
  const response = await fetch("/api/admin/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  // Check if response has content before parsing JSON
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse response:", text);
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    throw new Error(data.error || "Failed to create user");
  }

  return data.user;
}
