import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getActivitiesAction } from "./actions";
import ActivitiesManagementClient from "./ActivitiesManagementClient";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function AdminActivitiesPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin
  if (!["super_admin", "diocese_admin", "church_admin", "teacher"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch activities
  const { data: activities } = await getActivitiesAction();

  return (
    <AdminLayout>
      <ActivitiesManagementClient activities={activities} userProfile={profile} />
    </AdminLayout>
  );
}
