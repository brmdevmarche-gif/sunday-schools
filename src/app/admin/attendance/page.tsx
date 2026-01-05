import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import AttendanceClient from "./AttendanceClient";

export default async function AttendancePage() {
  const supabase = await createClient();

  // Get current user profile
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch classes based on role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let classes: any[] = [];

  if (profile.role === "super_admin") {
    // Super admin can see all classes
    const { data } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        church_id,
        churches (name),
        dioceses:churches!inner(diocese_id, dioceses(name))
      `)
      .order("name");
    classes = data || [];
  } else if (profile.role === "church_admin" && profile.church_id) {
    // Church admin can see their church's classes
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
  } else if (profile.role === "teacher") {
    // Teachers can see their assigned classes
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
      .eq("is_active", true);

    classes = data?.map(a => a.classes).filter(Boolean) || [];
  }

  return (
    <AdminLayout>
      <AttendanceClient
        classes={classes as unknown as Array<{ id: string; name: string; church_id: string; churches: { name: string } | null }>}
        userRole={profile.role}
      />
    </AdminLayout>
  );
}
