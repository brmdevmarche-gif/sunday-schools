import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import DashboardNavbar from "../DashboardNavbar";
import { ParentDashboardClient } from "./ParentDashboardClient";
import {
  getParentChildrenAction,
  getPendingApprovalsAction,
  getNotificationsAction,
  getNotificationSummaryAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations("parents");

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

  // Fetch all data in parallel
  const [childrenResult, approvalsResult, notificationsResult, summaryResult] =
    await Promise.all([
      getParentChildrenAction(),
      getPendingApprovalsAction(),
      getNotificationsAction(false, 10),
      getNotificationSummaryAction(),
    ]);

  const children = childrenResult.success ? childrenResult.data! : [];
  const pendingApprovals = approvalsResult.success ? approvalsResult.data! : [];
  const notifications = notificationsResult.success
    ? notificationsResult.data!
    : [];
  const unreadCount = summaryResult.success
    ? summaryResult.data!.unread
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardNavbar userName={profile.full_name} />

      <div className="container mx-auto px-4 py-6">
        <ParentDashboardClient
          parentName={profile.full_name}
          parentAvatar={profile.avatar_url}
          children={children}
          pendingApprovals={pendingApprovals}
          notifications={notifications}
          unreadNotificationsCount={unreadCount}
        />
      </div>
    </div>
  );
}
