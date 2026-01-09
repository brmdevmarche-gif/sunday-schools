import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import {
  getSpiritualNotesForReviewAction,
  getSpiritualActivityTemplatesAction,
} from "@/app/activities/spiritual-notes/actions";
import SpiritualNotesAdminClient from "./SpiritualNotesAdminClient";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function SpiritualNotesAdminPage() {
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
    redirect("/activities/spiritual-notes");
  }

  const [notesResult, templatesResult] = await Promise.all([
    getSpiritualNotesForReviewAction({ status: "submitted" }),
    getSpiritualActivityTemplatesAction(),
  ]);

  return (
    <AdminLayout>
      <SpiritualNotesAdminClient
        notes={notesResult.data || []}
        templates={templatesResult.data || []}
        userProfile={profile}
      />
    </AdminLayout>
  );
}
