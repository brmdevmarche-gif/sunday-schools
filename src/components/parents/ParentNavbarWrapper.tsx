import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ParentDashboardNavbar } from "./ParentDashboardNavbar";
import type { ParentChild } from "@/lib/types";

interface ParentNavbarWrapperProps {
  children: React.ReactNode;
}

export async function ParentNavbarWrapper({
  children,
}: ParentNavbarWrapperProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <>{children}</>;
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  // Only show navbar for parents
  if (!profile || profile.role !== "parent") {
    return <>{children}</>;
  }

  const adminClient = createAdminClient();

  // Fetch children for the parent
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

  let parentChildren: ParentChild[] = [];

  if (relationships && relationships.length > 0) {
    const childIds = relationships.map((r) => r.student_id);

    // Get points balance for each child
    const { data: balances } = await adminClient
      .from("student_points_balance")
      .select("user_id, available_points, total_earned")
      .in("user_id", childIds);

    const balanceMap = new Map(
      balances?.map((b) => [
        b.user_id,
        { available: b.available_points, total: b.total_earned },
      ]) || []
    );

    // Get pending approvals count
    const { data: pendingData } = await adminClient
      .from("points_transactions")
      .select("user_id")
      .in("user_id", childIds)
      .eq("status", "pending");

    const pendingCountMap = new Map<string, number>();
    pendingData?.forEach((p) => {
      pendingCountMap.set(p.user_id, (pendingCountMap.get(p.user_id) || 0) + 1);
    });

    parentChildren = relationships.map((r) => {
      const userData = r.users as unknown as {
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
      const activeClass = userData?.class_assignments?.[0];
      const balance = balanceMap.get(userData.id);
      return {
        id: userData.id,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        email: userData.email,
        church_id: userData.church_id,
        class_id: activeClass?.class_id,
        class_name: activeClass?.classes?.name,
        points_balance: balance?.available || 0,
        total_earned: balance?.total || 0,
        pending_approvals_count: pendingCountMap.get(userData.id) || 0,
      };
    });
  }

  // Calculate total pending approvals count from the data we already have
  const pendingApprovalsCount = parentChildren.reduce(
    (sum, child) => sum + (child.pending_approvals_count || 0),
    0
  );

  // Get unread notifications count
  const { data: notificationData } = await adminClient
    .from("notifications")
    .select("id")
    .eq("user_id", profile.id)
    .eq("is_read", false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ParentDashboardNavbar
        parentName={profile.full_name}
        parentAvatar={profile.avatar_url}
        parentChildren={parentChildren}
        pendingApprovalsCount={pendingApprovalsCount}
        unreadNotificationsCount={notificationData?.length || 0}
      />
      <main className="pt-14">{children}</main>
    </div>
  );
}
