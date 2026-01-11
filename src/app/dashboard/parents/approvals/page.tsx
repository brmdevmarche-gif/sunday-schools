import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPendingApprovalsAction, getApprovalHistoryAction } from "../actions";
import { ApprovalsClient } from "./ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify user is a parent
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    redirect("/dashboard");
  }

  // Fetch pending approvals and history in parallel
  const [pendingResult, historyResult] = await Promise.all([
    getPendingApprovalsAction(),
    getApprovalHistoryAction(),
  ]);

  const pendingApprovals = pendingResult.success ? pendingResult.data || [] : [];
  const approvalHistory = historyResult.success ? historyResult.data || [] : [];

  return (
    <div className="container mx-auto px-4 py-6">
      <ApprovalsClient
        pendingApprovals={pendingApprovals}
        approvalHistory={approvalHistory}
      />
    </div>
  );
}
