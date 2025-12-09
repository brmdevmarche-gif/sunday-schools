import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getActivityByIdAction } from "../actions";
import EditActivityClient from "./EditActivityClient";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user has permission
  const allowedRoles = ["super_admin", "diocese_admin", "church_admin", "teacher"];
  if (!allowedRoles.includes(profile.role)) {
    redirect("/admin/dashboard");
  }

  // Fetch activity
  const result = await getActivityByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <EditActivityClient activity={result.data} userProfile={profile} />;
}
