import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParentDashboardNavbar } from "@/components/parents";
import {
  getParentChildrenAction,
  getPendingApprovalsAction,
  getNotificationSummaryAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch parent profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Only allow parents to access this page
  if (profile.role !== "parent") {
    redirect("/dashboard");
  }

  // Fetch data for navbar
  const [childrenResult, approvalsResult, summaryResult] = await Promise.all([
    getParentChildrenAction(),
    getPendingApprovalsAction(),
    getNotificationSummaryAction(),
  ]);

  const parentChildren = childrenResult.success ? childrenResult.data! : [];
  const pendingApprovals = approvalsResult.success ? approvalsResult.data! : [];
  const unreadCount = summaryResult.success ? summaryResult.data!.unread : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ParentDashboardNavbar
        parentName={profile.full_name}
        parentAvatar={profile.avatar_url}
        parentChildren={parentChildren}
        pendingApprovalsCount={pendingApprovals.length}
        unreadNotificationsCount={unreadCount}
      />
      <main className="pt-14">{children}</main>
    </div>
  );
}
