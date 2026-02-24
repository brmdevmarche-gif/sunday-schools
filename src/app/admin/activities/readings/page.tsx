import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getReadingSchedulesAction } from "@/app/activities/readings/actions";
import ReadingsAdminClient from "./ReadingsAdminClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export default async function ReadingsAdminPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const schedulesResult = await getReadingSchedulesAction();

  return (
    <AdminLayout>
      <PageWithPermissions permission="activities.view_readings">
        <ReadingsAdminClient
          schedules={schedulesResult.data || []}
          userProfile={profile}
        />
      </PageWithPermissions>
    </AdminLayout>
  );
}
