import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import StoreClient from "./StoreClient";
import type { ParentChild } from "@/lib/types";

interface StorePageProps {
  searchParams: Promise<{ for?: string }>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const params = await searchParams;
  const forChildId = params.for;

  // Check if parent is ordering for a child
  let childContext: ParentChild | null = null;
  let allChildren: ParentChild[] = [];
  let targetUserId = profile.id;
  let targetUserChurchId = profile.church_id;
  let targetUserDioceseId = profile.diocese_id;

  if (profile.role === "parent") {
    // Fetch all children for the parent (for child switcher)
    const { data: relationships } = await adminClient
      .from("user_relationships")
      .select(
        `
        student_id,
        users!user_relationships_student_id_fkey (
          id,
          full_name,
          avatar_url,
          email,
          church_id,
          diocese_id,
          class_assignments (
            class_id,
            classes (id, name)
          )
        )
      `
      )
      .eq("parent_id", profile.id)
      .eq("is_active", true);

    if (relationships && relationships.length > 0) {
      // Get points balance for each child
      const childIds = relationships.map((r) => r.student_id);
      const { data: balances } = await adminClient
        .from("student_points_balance")
        .select("user_id, available_points")
        .in("user_id", childIds);

      const balanceMap = new Map(
        balances?.map((b) => [b.user_id, b.available_points]) || []
      );

      allChildren = relationships.map((r) => {
        const user = r.users as unknown as {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          email?: string | null;
          church_id?: string | null;
          diocese_id?: string | null;
          class_assignments?: Array<{
            class_id: string;
            classes: { id: string; name: string };
          }>;
        };
        const activeClass = user?.class_assignments?.[0];
        return {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          email: user.email,
          church_id: user.church_id,
          class_id: activeClass?.class_id,
          class_name: activeClass?.classes?.name,
          points_balance: balanceMap.get(user.id) || 0,
          total_earned: 0,
          pending_approvals_count: 0,
        };
      });

      // If forChildId is specified, verify and use that child
      if (forChildId) {
        const selectedChild = allChildren.find((c) => c.id === forChildId);
        if (selectedChild) {
          childContext = selectedChild;
          targetUserId = selectedChild.id;
          targetUserChurchId = selectedChild.church_id || null;
          targetUserDioceseId = null; // Get from user if needed
        }
      }
    }
  }

  // Get target user's class assignments to determine available items
  const { data: classAssignments } = await adminClient
    .from("class_assignments")
    .select("class_id")
    .eq("user_id", targetUserId)
    .eq("is_active", true);

  const classIds = classAssignments?.map((a) => a.class_id) || [];

  // Fetch available store items
  const query = adminClient
    .from("store_items")
    .select(
      `
      *,
      store_item_churches (church_id),
      store_item_dioceses (diocese_id),
      store_item_classes (class_id)
    `
    )
    .eq("is_active", true);

  const { data: allItems, error } = await query;

  if (error) {
    console.error("Error fetching store items:", error);
  }

  // Filter items based on target user's access
  const availableItems =
    allItems?.filter((item) => {
      if (item.is_available_to_all_classes) {
        return true;
      }

      if (
        item.store_item_classes?.some((sic: { class_id: string }) =>
          classIds.includes(sic.class_id)
        )
      ) {
        return true;
      }

      if (
        targetUserChurchId &&
        item.store_item_churches?.some(
          (sic: { church_id: string }) => sic.church_id === targetUserChurchId
        )
      ) {
        return true;
      }

      if (
        targetUserDioceseId &&
        item.store_item_dioceses?.some(
          (sid: { diocese_id: string }) => sid.diocese_id === targetUserDioceseId
        )
      ) {
        return true;
      }

      return false;
    }) || [];

  // Get points balance for the target user (child if parent ordering, otherwise current user)
  let pointsBalance = {
    available_points: 0,
    suspended_points: 0,
    total_earned: 0,
  };
  const { data: balanceData } = await adminClient
    .from("student_points_balance")
    .select("available_points, suspended_points, total_earned")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (balanceData) {
    pointsBalance = balanceData;
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreClient
        items={availableItems}
        userProfile={profile}
        userClassIds={classIds}
        pointsBalance={pointsBalance}
        childContext={childContext}
        allChildren={allChildren}
      />
    </div>
  );
}
