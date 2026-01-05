import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateOrderForStudentClient from "./CreateOrderForStudentClient";

export default async function CreateOrderForStudentPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin
  if (
    !["super_admin", "diocese_admin", "church_admin", "store_manager"].includes(
      profile.role
    )
  ) {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch store items
  const { data: storeItems } = await supabase
    .from("store_items")
    .select(
      "id, name, image_url, price_normal, price_mastor, price_botl, stock_quantity, stock_type, is_active"
    )
    .eq("is_active", true)
    .order("name");

  return (
    <AdminLayout>
      <CreateOrderForStudentClient
        storeItems={storeItems || []}
        userProfile={profile}
      />
    </AdminLayout>
  );
}
