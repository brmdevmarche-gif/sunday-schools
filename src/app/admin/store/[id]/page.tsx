import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import StoreItemDetailsClient from "./StoreItemDetailsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreItemDetailsPage({ params }: PageProps) {
  const { id } = await params;
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

  // Fetch store item details
  const { data: item, error } = await supabase
    .from("store_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    return notFound();
  }

  // Fetch orders containing this item with aggregated stats
  const { data: rawOrderItems } = await supabase
    .from("order_items")
    .select(
      `
      id,
      quantity,
      price_tier,
      unit_price,
      total_price,
      created_at,
      orders:order_id (
        id,
        status,
        created_at,
        users:user_id (
          id,
          full_name,
          email,
          user_code
        )
      )
    `
    )
    .eq("store_item_id", id)
    .order("created_at", { ascending: false });

  // Transform the data to flatten the nested arrays from Supabase
  const orderItems = (rawOrderItems || []).map((oi: any) => ({
    id: oi.id,
    quantity: oi.quantity,
    price_tier: oi.price_tier,
    unit_price: oi.unit_price,
    total_price: oi.total_price,
    created_at: oi.created_at,
    orders: oi.orders
      ? {
          id: oi.orders.id,
          status: oi.orders.status,
          created_at: oi.orders.created_at,
          users: oi.orders.users || null,
        }
      : null,
  }));

  // Calculate stats
  const stats = {
    totalOrders: orderItems?.length || 0,
    totalQuantity:
      orderItems?.reduce((sum, oi) => sum + oi.quantity, 0) || 0,
    totalRevenue:
      orderItems?.reduce((sum, oi) => sum + oi.total_price, 0) || 0,
    pendingOrders:
      orderItems?.filter((oi) => (oi.orders as any)?.status === "pending")
        .length || 0,
    approvedOrders:
      orderItems?.filter((oi) => (oi.orders as any)?.status === "approved")
        .length || 0,
    fulfilledOrders:
      orderItems?.filter((oi) => (oi.orders as any)?.status === "fulfilled")
        .length || 0,
    cancelledOrders:
      orderItems?.filter(
        (oi) =>
          (oi.orders as any)?.status === "cancelled" ||
          (oi.orders as any)?.status === "rejected"
      ).length || 0,
  };

  // Get orders by month for chart (last 6 months)
  const now = new Date();
  const monthlyData: { month: string; orders: number; quantity: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthOrders =
      orderItems?.filter((oi) => {
        const orderDate = new Date(oi.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      }) || [];

    monthlyData.push({
      month: `${monthName} ${year}`,
      orders: monthOrders.length,
      quantity: monthOrders.reduce((sum, oi) => sum + oi.quantity, 0),
    });
  }

  // Price tier distribution
  const tierDistribution = {
    normal:
      orderItems?.filter((oi) => oi.price_tier === "normal").length || 0,
    mastor:
      orderItems?.filter((oi) => oi.price_tier === "mastor").length || 0,
    botl: orderItems?.filter((oi) => oi.price_tier === "botl").length || 0,
  };

  return (
    <AdminLayout>
      <StoreItemDetailsClient
        item={item}
        orderItems={orderItems || []}
        stats={stats}
        monthlyData={monthlyData}
        tierDistribution={tierDistribution}
      />
    </AdminLayout>
  );
}
