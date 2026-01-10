import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import {
  getCompetitionsAction,
  getCompetitionSubmissionsAction,
} from "@/app/activities/competitions/actions";
import CompetitionsAdminClient from "./CompetitionsAdminClient";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function CompetitionsAdminPage() {
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
    redirect("/activities/competitions");
  }

  const [competitionsResult, submissionsResult] = await Promise.all([
    getCompetitionsAction(),
    getCompetitionSubmissionsAction({ status: "submitted" }),
  ]);

  return (
    <AdminLayout>
      <CompetitionsAdminClient
        competitions={competitionsResult.data || []}
        pendingSubmissions={submissionsResult.data || []}
        userProfile={profile}
      />
    </AdminLayout>
  );
}
