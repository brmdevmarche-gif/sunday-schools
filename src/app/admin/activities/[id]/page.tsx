import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getActivityByIdAction } from "../actions";
import AdminLayout from "@/components/admin/AdminLayout";
import EditActivityClient from "./EditActivityClient";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch activity
  const result = await getActivityByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <AdminLayout>
      <PageWithPermissions permission={["activities.view_detail", "activities.update"]}>
        <EditActivityClient activity={result.data} userProfile={profile} />
      </PageWithPermissions>
    </AdminLayout>
  );
}
