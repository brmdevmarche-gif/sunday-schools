import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import {
  getCompetitionsAction,
  getCompetitionSubmissionsAction,
} from "@/app/activities/competitions/actions";
import CompetitionsAdminClient from "./CompetitionsAdminClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export const metadata: Metadata = {
  title: "Competitions",
};

export default async function CompetitionsAdminPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [competitionsResult, submissionsResult] = await Promise.all([
    getCompetitionsAction(),
    getCompetitionSubmissionsAction({ status: "submitted" }),
  ]);

  return (
    <AdminLayout>
      <PageWithPermissions permission={["activities.view_competitions", "activities.manage_participants"]}>
        <CompetitionsAdminClient
          competitions={competitionsResult.data || []}
          pendingSubmissions={submissionsResult.data || []}
          userProfile={profile}
        />
      </PageWithPermissions>
    </AdminLayout>
  );
}
