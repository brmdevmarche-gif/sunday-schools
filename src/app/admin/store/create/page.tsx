import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateStoreItemClient from "./CreateStoreItemClient";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export default async function CreateStoreItemPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Permission check will be done by PageWithPermissions

  const supabase = await createClient();

  // Fetch churches
  const { data: churches } = await supabase
    .from("churches")
    .select("id, name, diocese_id")
    .order("name");

  // Fetch dioceses (for super_admin)
  const { data: dioceses } = await supabase
    .from("dioceses")
    .select("id, name")
    .order("name");

  // Fetch classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, church_id")
    .order("name");

  return (
    <AdminLayout>
      <PageWithPermissions permission="store.create">
        <CreateStoreItemClient
          userProfile={profile}
          churches={churches || []}
          dioceses={dioceses || []}
          classes={classes || []}
        />
      </PageWithPermissions>
    </AdminLayout>
  );
}
