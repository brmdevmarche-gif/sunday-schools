import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getAvailableTripsAction } from "./actions";
import TripsClient from "./TripsClient";
import type { ParentChild } from "@/lib/types";

interface TripsPageProps {
  searchParams: Promise<{ for?: string }>;
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const params = await searchParams;
  const forChildId = params.for;

  // Check if parent is booking for a child
  let childContext: ParentChild | null = null;
  let allChildren: ParentChild[] = [];

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
        }
      }
    }
  }

  // Fetch available trips
  const tripsResult = await getAvailableTripsAction();

  return (
    <div className="min-h-screen bg-background">
      <TripsClient
        trips={tripsResult.data}
        userProfile={profile}
        childContext={childContext}
        allChildren={allChildren}
      />
    </div>
  );
}


