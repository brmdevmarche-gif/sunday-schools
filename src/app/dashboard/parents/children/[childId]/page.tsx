import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import DashboardNavbar from "../../../DashboardNavbar";
import { ChildProfileClient } from "./ChildProfileClient";
import { getChildDetailsAction } from "../../actions";

export const dynamic = "force-dynamic";

interface ChildProfilePageProps {
  params: Promise<{
    childId: string;
  }>;
}

export default async function ChildProfilePage({
  params,
}: ChildProfilePageProps) {
  const { childId } = await params;
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
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    redirect("/dashboard");
  }

  // Fetch child details
  const result = await getChildDetailsAction(childId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardNavbar userName={profile.full_name} />

      <div className="container mx-auto px-4 py-6">
        <ChildProfileClient childData={result.data} />
      </div>
    </div>
  );
}
