import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateActivityClient from "./CreateActivityClient";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export default async function CreateActivityPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <AdminLayout>
      <PageWithPermissions permission="activities.create">
        <CreateActivityClient userProfile={profile} />
      </PageWithPermissions>
    </AdminLayout>
  );
}
