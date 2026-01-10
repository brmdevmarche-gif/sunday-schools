import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { ParentOrdersClient } from "./ParentOrdersClient";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<{ for?: string }>;
}

export default async function ParentOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const profile = await getCurrentUserProfile();
  const t = await getTranslations();

  if (!profile) {
    redirect("/login");
  }

  // Only parents can access this page
  if (profile.role !== "parent") {
    redirect("/dashboard");
  }

  const adminClient = createAdminClient();
  const params = await searchParams;
  const forChildId = params.for;

  // If no child is selected, show a message
  if (!forChildId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <EmptyState
          icon="Users"
          title={t("parents.orders.selectChild")}
          description={t("parents.orders.selectChildHint")}
        />
      </div>
    );
  }

  // Verify the selected child belongs to this parent
  const { data: relationship } = await adminClient
    .from("user_relationships")
    .select("student_id")
    .eq("parent_id", profile.id)
    .eq("student_id", forChildId)
    .eq("is_active", true)
    .single();

  if (!relationship) {
    return (
      <div className="container mx-auto px-4 py-12">
        <EmptyState
          icon="Users"
          title={t("parents.orders.selectChild")}
          description={t("parents.orders.selectChildHint")}
        />
      </div>
    );
  }

  // Get orders for the selected child
  const { data: orders } = await adminClient
    .from("orders")
    .select(
      `
      id,
      user_id,
      status,
      total_points,
      notes,
      created_at,
      updated_at,
      users!user_id (
        id,
        full_name,
        avatar_url
      ),
      order_items (
        id,
        quantity,
        unit_price,
        store_items (
          id,
          name,
          name_ar,
          image_url
        )
      )
    `
    )
    .eq("user_id", forChildId)
    .order("created_at", { ascending: false });

  // Transform orders to match the expected interface
  const transformedOrders = (orders || []).map((order) => {
    const users = order.users as unknown as {
      id: string;
      full_name: string;
      avatar_url?: string | null;
    } | null;

    const order_items = (order.order_items || []).map((item) => {
      const storeItem = item.store_items as unknown as {
        id: string;
        name: string;
        name_ar?: string | null;
        image_url?: string | null;
      } | null;
      return {
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        store_items: storeItem,
      };
    });

    return {
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      total_points: order.total_points,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      users,
      order_items,
    };
  });

  return <ParentOrdersClient orders={transformedOrders} />;
}
