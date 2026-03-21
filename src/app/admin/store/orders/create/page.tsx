import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateOrderForStudentClient from "./CreateOrderForStudentClient";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export const metadata: Metadata = {
  title: "Create Order",
};

export default async function CreateOrderForStudentPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Permission check will be done by PageWithPermissions

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
      <PageWithPermissions permission="store.orders_create">
        <CreateOrderForStudentClient
          storeItems={storeItems || []}
          userProfile={profile}
        />
      </PageWithPermissions>
    </AdminLayout>
  );
}
