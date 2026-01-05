import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import TeacherAttendanceClient from "./TeacherAttendanceClient";

export default async function TeacherAttendancePage() {
  const supabase = await createClient();

  // Get current user profile
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Only teachers and admins can access this page
  const canAccess = ['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(profile.role);
  if (!canAccess) {
    redirect("/dashboard");
  }

  // Fetch teacher's assigned classes or all classes for admins
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let classes: any[] = [];

  if (profile.role === "teacher") {
    // Teachers see only their assigned classes
    const { data } = await supabase
      .from("class_assignments")
      .select(`
        class_id,
        classes (
          id,
          name,
          church_id,
          churches (name)
        )
      `)
      .eq("user_id", profile.id)
      .eq("assignment_type", "teacher")
      .eq("is_active", true)
      .order("classes(name)");

    classes = data?.map(a => a.classes).filter(Boolean) || [];
  } else if (profile.role === "church_admin" && profile.church_id) {
    // Church admins see their church's classes
    const { data } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        church_id,
        churches (name)
      `)
      .eq("church_id", profile.church_id)
      .order("name");
    classes = data || [];
  } else if (profile.role === "diocese_admin" && profile.diocese_id) {
    // Diocese admins see classes in their diocese
    const { data } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        church_id,
        churches!inner (
          name,
          diocese_id
        )
      `)
      .eq("churches.diocese_id", profile.diocese_id)
      .order("name");
    classes = data || [];
  } else if (profile.role === "super_admin") {
    // Super admins see all classes
    const { data } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        church_id,
        churches (name)
      `)
      .order("name");
    classes = data || [];
  }

  return (
    <TeacherAttendanceClient
      classes={classes as unknown as Array<{ id: string; name: string; church_id: string; churches: { name: string } | null }>}
      userRole={profile.role}
      userName={profile.full_name || profile.email}
    />
  );
}
