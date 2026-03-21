import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getActivitiesAction } from "./actions";
import ActivitiesManagementClient from "./ActivitiesManagementClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export const metadata: Metadata = {
  title: "Activities",
};

export default async function AdminActivitiesPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch activities
  const { data: activities } = await getActivitiesAction();

  return (
    <AdminLayout>
      <PageWithPermissions permission="activities.view">
        <ActivitiesManagementClient activities={activities} userProfile={profile} />
      </PageWithPermissions>
    </AdminLayout>
  );
}
