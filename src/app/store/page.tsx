import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getMyCompletionsAction } from "../activities/actions";
import { getWishlistAction } from "./wishlist-actions";
import StoreClient from "./StoreClient";

export default async function StorePage() {
  const supabase = await createClient();
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Use admin client to fetch store items available to the user
  const adminClient = createAdminClient();

  // Get user's class assignments to determine available items
  const { data: classAssignments } = await adminClient
    .from("class_assignments")
    .select("class_id")
    .eq("user_id", profile.id)
    .eq("is_active", true);

  const classIds = classAssignments?.map((a) => a.class_id) || [];

  // Fetch available store items
  // Items are available if:
  // 1. They're available to all classes (is_available_to_all_classes = true)
  // 2. OR they're assigned to the user's classes
  // 3. OR they're assigned to the user's church
  // 4. OR they're assigned to the user's diocese

  let query = adminClient
    .from("store_items")
    .select(`
      *,
      store_item_churches (church_id),
      store_item_dioceses (diocese_id),
      store_item_classes (class_id)
    `)
    .eq("is_active", true);

  const { data: allItems, error } = await query;

  if (error) {
    console.error("Error fetching store items:", error);
  }

  // Filter items based on user's access
  const availableItems = allItems?.filter((item) => {
    // Item available to all classes
    if (item.is_available_to_all_classes) {
      return true;
    }

    // Item assigned to user's classes
    if (item.store_item_classes?.some((sic: any) => classIds.includes(sic.class_id))) {
      return true;
    }

    // Item assigned to user's church
    if (item.store_item_churches?.some((sic: any) => sic.church_id === profile.church_id)) {
      return true;
    }

    // Item assigned to user's diocese
    if (item.store_item_dioceses?.some((sid: any) => sid.diocese_id === profile.diocese_id)) {
      return true;
    }

    return false;
  }) || [];

  // Fetch user's points and wishlist
  const [pointsResult, wishlistResult] = await Promise.all([
    getMyCompletionsAction(),
    getWishlistAction(),
  ]);

  const pointsData = pointsResult.data || { totalPoints: 0, pendingPoints: 0 };
  const wishlistItemIds = wishlistResult.data || [];

  return (
    <div className="min-h-screen bg-background">
      <StoreClient
        items={availableItems}
        userProfile={profile}
        userClassIds={classIds}
        pointsData={pointsData}
        wishlistItemIds={wishlistItemIds}
      />
    </div>
  );
}
