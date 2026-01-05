import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateStoreItemClient from "./CreateStoreItemClient";

export default async function CreateStoreItemPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user has permission
  if (!["super_admin", "church_admin"].includes(profile.role)) {
    redirect("/admin/store");
  }

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
      <CreateStoreItemClient
        userProfile={profile}
        churches={churches || []}
        dioceses={dioceses || []}
        classes={classes || []}
      />
    </AdminLayout>
  );
}
