import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import AttendanceHistoryClient from "./AttendanceHistoryClient";

export default async function AttendanceHistoryPage() {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch classes based on role
  let classes: any[] = [];

  if (profile.role === "super_admin") {
    const { data } = await supabase
      .from("classes")
      .select("id, name, church_id, churches(name)")
      .order("name");
    classes = data || [];
  } else if (profile.role === "church_admin" && profile.church_id) {
    const { data } = await supabase
      .from("classes")
      .select("id, name, church_id, churches(name)")
      .eq("church_id", profile.church_id)
      .order("name");
    classes = data || [];
  } else if (profile.role === "teacher") {
    const { data } = await supabase
      .from("class_assignments")
      .select("class_id, classes(id, name, church_id, churches(name))")
      .eq("user_id", profile.id)
      .eq("assignment_type", "teacher")
      .eq("is_active", true);
    classes = data?.map(a => a.classes).filter(Boolean) || [];
  }

  return (
    <AdminLayout>
      <AttendanceHistoryClient
        classes={classes}
        userRole={profile.role}
      />
    </AdminLayout>
  );
}
