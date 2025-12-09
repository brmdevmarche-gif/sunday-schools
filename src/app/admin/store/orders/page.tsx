import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getAllOrdersAction } from "./actions";
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

  // Fetch all orders based on admin's scope
  const { data: orders } = await getAllOrdersAction();

  return (
    <div className="min-h-screen bg-background">
      <OrdersManagementClient orders={orders} userProfile={profile} />
    </div>
  );
}
