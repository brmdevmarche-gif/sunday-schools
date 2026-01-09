import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getReadingSchedulesAction } from "@/app/activities/readings/actions";
import ReadingsAdminClient from "./ReadingsAdminClient";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function ReadingsAdminPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin
  if (
    !["super_admin", "diocese_admin", "church_admin", "teacher"].includes(
      profile.role
    )
  ) {
    redirect("/activities/readings");
  }

  const schedulesResult = await getReadingSchedulesAction();

  return (
    <AdminLayout>
      <ReadingsAdminClient
        schedules={schedulesResult.data || []}
        userProfile={profile}
      />
    </AdminLayout>
  );
}
