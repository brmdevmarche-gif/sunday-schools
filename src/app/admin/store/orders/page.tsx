import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getAllOrdersAction } from "./actions";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import OrdersManagementClient from "./OrdersManagementClient";

export default async function AdminOrdersPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin
  if (!["super_admin", "diocese_admin", "church_admin", "store_manager"].includes(profile.role)) {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch all orders based on admin's scope
  const { data: orders } = await getAllOrdersAction();

  // Fetch filter options
  const [diocesesResult, churchesResult, classesResult] = await Promise.all([
    supabase.from("dioceses").select("id, name").order("name"),
    supabase.from("churches").select("id, name, diocese_id").order("name"),
    supabase.from("classes").select("id, name, church_id").order("name"),
  ]);

  return (
    <AdminLayout>
      <OrdersManagementClient
        orders={orders}
        userProfile={profile}
        dioceses={diocesesResult.data || []}
        churches={churchesResult.data || []}
        classes={classesResult.data || []}
      />
    </AdminLayout>
  );
}
