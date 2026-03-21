import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import {
  getSpiritualNotesForReviewAction,
  getSpiritualActivityTemplatesAction,
} from "@/app/activities/spiritual-notes/actions";
import SpiritualNotesAdminClient from "./SpiritualNotesAdminClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export const metadata: Metadata = {
  title: "Spiritual Notes",
};

export default async function SpiritualNotesAdminPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [notesResult, templatesResult] = await Promise.all([
    getSpiritualNotesForReviewAction({ status: "submitted" }),
    getSpiritualActivityTemplatesAction(),
  ]);

  return (
    <AdminLayout>
      <PageWithPermissions permission={["activities.view_spiritual_notes", "activities.manage_participants"]}>
        <SpiritualNotesAdminClient
          notes={notesResult.data || []}
          templates={templatesResult.data || []}
          userProfile={profile}
        />
      </PageWithPermissions>
    </AdminLayout>
  );
}
