import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardClient from "./dashboard/DashboardClient";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch stats based on user role
  let stats = {
    dioceses: 0,
    churches: 0,
    classes: 0,
    users: 0,
  };

  try {
    if (profile.role === "super_admin") {
      // Super admin can see all stats
      const [diocesesCount, churchesCount, classesCount, usersCount] =
        await Promise.all([
          supabase
            .from("dioceses")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("churches")
            .select("id", { count: "exact", head: true }),
          supabase.from("classes").select("id", { count: "exact", head: true }),
          supabase.from("users").select("id", { count: "exact", head: true }),
        ]);

      stats = {
        dioceses: diocesesCount.count || 0,
        churches: churchesCount.count || 0,
        classes: classesCount.count || 0,
        users: usersCount.count || 0,
      };
    } else if (profile.role === "diocese_admin" && profile.diocese_id) {
      // Diocese admin sees stats for their diocese
      // First get church IDs for this diocese
      const { data: churchIds } = await supabase
        .from("churches")
        .select("id")
        .eq("diocese_id", profile.diocese_id);

      const churchIdList = churchIds?.map((c) => c.id) || [];

      const [churchesCount, classesCount, usersCount] = await Promise.all([
        supabase
          .from("churches")
          .select("id", { count: "exact", head: true })
          .eq("diocese_id", profile.diocese_id),
        churchIdList.length > 0
          ? supabase
              .from("classes")
              .select("id", { count: "exact", head: true })
              .in("church_id", churchIdList)
          : { count: 0 },
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("diocese_id", profile.diocese_id),
      ]);

      stats = {
        dioceses: 1,
        churches: churchesCount.count || 0,
        classes: classesCount.count || 0,
        users: usersCount.count || 0,
      };
    } else if (profile.role === "church_admin" && profile.church_id) {
      // Church admin sees stats for their church
      const [classesCount, usersCount] = await Promise.all([
        supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .eq("church_id", profile.church_id),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("church_id", profile.church_id),
      ]);

      stats = {
        dioceses: 0,
        churches: 1,
        classes: classesCount.count || 0,
        users: usersCount.count || 0,
      };
    } else if (profile.role === "teacher") {
      // Teachers see their class stats
      const classesCount = await supabase
        .from("class_assignments")
        .select("class_id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("assignment_type", "teacher")
        .eq("is_active", true);

      stats = {
        dioceses: 0,
        churches: 0,
        classes: classesCount.count || 0,
        users: 0,
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }

  return (
    <AdminLayout>
      <DashboardClient userProfile={profile} stats={stats} />
    </AdminLayout>
  );
}
