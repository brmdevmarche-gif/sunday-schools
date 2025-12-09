import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getMyOrdersAction } from "@/app/admin/store/orders/actions";
import MyOrdersClient from "./MyOrdersClient";

export default async function MyOrdersPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch user's orders
  const { data: orders } = await getMyOrdersAction();

  return (
    <div className="min-h-screen bg-background">
      <MyOrdersClient orders={orders} userProfile={profile} />
    </div>
  );
}
