"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AnnouncementType } from "@/components/teacher";

export interface TeacherAnnouncement {
  id: string;
  title: string;
  preview: string | null;
  content: string;
  type: AnnouncementType;
  isRead: boolean;
  sender: {
    name: string;
    avatarUrl: string | null;
  } | null;
  publishedAt: string;
  expiresAt: string | null;
}

/**
 * Get announcements relevant to the teacher
 */
export async function getTeacherAnnouncements(
  filter?: "all" | "unread" | "urgent"
): Promise<TeacherAnnouncement[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get teacher's profile with church
  const { data: profile } = await supabase
    .from("users")
    .select("id, church_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return [];
  }

  const now = new Date().toISOString();

  // Build query for announcements
  let query = supabase
    .from("announcements")
    .select(
      `
      id,
      title,
      description,
      types,
      target_roles,
      publish_from,
      publish_to,
      created_by,
      users!announcements_created_by_fkey(full_name, avatar_url)
    `
    )
    .eq("is_deleted", false)
    .lte("publish_from", now)
    .or(`publish_to.is.null,publish_to.gte.${now}`);

  // Get announcements
  const { data: announcements, error } = await query.order("publish_from", {
    ascending: false,
  });

  if (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }

  if (!announcements) {
    return [];
  }

  // Get read status for announcements
  const announcementIds = announcements.map((a) => a.id);
  const { data: readRecords } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", user.id)
    .in("announcement_id", announcementIds);

  const readSet = new Set(readRecords?.map((r) => r.announcement_id) || []);

  // Filter announcements based on target roles
  const teacherAnnouncements = announcements.filter((a) => {
    const targetRoles = a.target_roles as string[] | null;
    // If no target roles or empty, it's for everyone
    if (!targetRoles || targetRoles.length === 0) return true;
    // Check if teacher is in target roles
    return targetRoles.includes("teacher");
  });

  // Map to TeacherAnnouncement type
  const result: TeacherAnnouncement[] = teacherAnnouncements.map((a) => {
    const senderData = a.users as unknown as {
      full_name: string | null;
      avatar_url: string | null;
    } | null;

    // Determine announcement type from types array
    const types = a.types as string[] | null;
    let type: AnnouncementType = "general";
    if (types?.includes("urgent")) {
      type = "urgent";
    } else if (types?.includes("class")) {
      type = "class";
    }

    return {
      id: a.id,
      title: a.title,
      preview: a.description,
      content: a.description || "",
      type,
      isRead: readSet.has(a.id),
      sender: senderData
        ? {
            name: senderData.full_name || "Unknown",
            avatarUrl: senderData.avatar_url,
          }
        : null,
      publishedAt: a.publish_from,
      expiresAt: a.publish_to,
    };
  });

  // Apply filter
  if (filter === "unread") {
    return result.filter((a) => !a.isRead);
  } else if (filter === "urgent") {
    return result.filter((a) => a.type === "urgent");
  }

  return result;
}

/**
 * Mark an announcement as read
 */
export async function markAnnouncementRead(
  announcementId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  // Check if already read
  const { data: existing } = await supabase
    .from("announcement_reads")
    .select("id")
    .eq("user_id", user.id)
    .eq("announcement_id", announcementId)
    .maybeSingle();

  if (existing) {
    // Already read
    return { success: true };
  }

  // Insert read record
  const { error } = await supabase.from("announcement_reads").insert({
    user_id: user.id,
    announcement_id: announcementId,
    read_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error marking announcement read:", error);
    return { success: false };
  }

  revalidatePath("/dashboard/teacher/announcements");
  revalidatePath("/dashboard/teacher");

  return { success: true };
}

/**
 * Get unread count for announcements
 */
export async function getUnreadAnnouncementCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const now = new Date().toISOString();

  // Get all active announcements for teachers
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, target_roles")
    .eq("is_deleted", false)
    .lte("publish_from", now)
    .or(`publish_to.is.null,publish_to.gte.${now}`);

  if (!announcements) {
    return 0;
  }

  // Filter for teacher-targeted
  const teacherAnnouncements = announcements.filter((a) => {
    const targetRoles = a.target_roles as string[] | null;
    if (!targetRoles || targetRoles.length === 0) return true;
    return targetRoles.includes("teacher");
  });

  if (teacherAnnouncements.length === 0) {
    return 0;
  }

  // Get read records
  const announcementIds = teacherAnnouncements.map((a) => a.id);
  const { data: readRecords } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", user.id)
    .in("announcement_id", announcementIds);

  const readCount = readRecords?.length || 0;
  return teacherAnnouncements.length - readCount;
}

/**
 * Get a single announcement by ID
 */
export async function getAnnouncementById(
  announcementId: string
): Promise<TeacherAnnouncement | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: announcement, error } = await supabase
    .from("announcements")
    .select(
      `
      id,
      title,
      description,
      types,
      target_roles,
      publish_from,
      publish_to,
      created_by,
      users!announcements_created_by_fkey(full_name, avatar_url)
    `
    )
    .eq("id", announcementId)
    .eq("is_deleted", false)
    .single();

  if (error || !announcement) {
    return null;
  }

  // Check if read
  const { data: readRecord } = await supabase
    .from("announcement_reads")
    .select("id")
    .eq("user_id", user.id)
    .eq("announcement_id", announcementId)
    .maybeSingle();

  const senderData = announcement.users as unknown as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;

  const types = announcement.types as string[] | null;
  let type: AnnouncementType = "general";
  if (types?.includes("urgent")) {
    type = "urgent";
  } else if (types?.includes("class")) {
    type = "class";
  }

  return {
    id: announcement.id,
    title: announcement.title,
    preview: announcement.description,
    content: announcement.description || "",
    type,
    isRead: !!readRecord,
    sender: senderData
      ? {
          name: senderData.full_name || "Unknown",
          avatarUrl: senderData.avatar_url,
        }
      : null,
    publishedAt: announcement.publish_from,
    expiresAt: announcement.publish_to,
  };
}
