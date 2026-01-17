import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripDetailsAction } from "../actions";
import TripDetailsClient from "./TripDetailsClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { ParentNavbarWrapper } from "@/components/parents/ParentNavbarWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { getTranslations } from "next-intl/server";
import type { ParentChild } from "@/lib/types";

interface TripDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TripDetailsPage({ 
  params,
  searchParams 
}: TripDetailsPageProps) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const t = await getTranslations();
  const adminClient = createAdminClient();
  const params_search = await searchParams;
  const forUserId = params_search?.for as string | undefined;

  if (!profile) {
    redirect("/login");
  }

  // Check if parent is booking for a child
  let childContext: ParentChild | null = null;
  let allChildren: ParentChild[] = [];

  if (profile.role === "parent") {
    // Fetch all children for the parent
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
      // Get points balance and price_tier for each child
      const childIds = relationships.map((r) => r.student_id);
      const [balancesResult, childrenProfilesResult] = await Promise.all([
        adminClient
          .from("student_points_balance")
          .select("user_id, available_points")
          .in("user_id", childIds),
        adminClient
          .from("users")
          .select("id, price_tier")
          .in("id", childIds),
      ]);

      const balanceMap = new Map(
        balancesResult.data?.map((b) => [b.user_id, b.available_points]) || []
      );
      const priceTierMap = new Map(
        childrenProfilesResult.data?.map((u) => [u.id, u.price_tier || "normal"]) || []
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
          price_tier: priceTierMap.get(user.id) || "normal",
        };
      });

      // If forUserId is specified, verify and use that child
      if (forUserId) {
        const selectedChild = allChildren.find((c) => c.id === forUserId);
        if (selectedChild) {
          childContext = selectedChild;
        }
      }
    }

    // Parent must select a child - show navbar with empty state
    if (!forUserId || !childContext) {
      return (
        <ParentNavbarWrapper>
          <div className="container mx-auto px-4 py-12">
            <EmptyState
              icon="Plane"
              title={t("parents.nav.selectChildForTrips")}
              description={t("trips.selectChildDescription")}
            />
          </div>
        </ParentNavbarWrapper>
      );
    }
  }

  // Fetch trip details
  const tripResult = await getTripDetailsAction(id);

  if (!tripResult.data) {
    notFound();
  }

  const tripContent = (
    <TripDetailsClient 
      trip={tripResult.data} 
      userProfile={profile}
      childContext={childContext}
      allChildren={allChildren}
    />
  );

  // Wrap with parent navbar if parent is viewing for a child
  if (profile.role === "parent" && childContext) {
    return <ParentNavbarWrapper>{tripContent}</ParentNavbarWrapper>;
  }

  return (
    <div className="min-h-screen bg-background">
      {tripContent}
    </div>
  );
}
