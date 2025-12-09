import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import CreateActivityClient from "./CreateActivityClient";

export default async function CreateActivityPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user has permission
  const allowedRoles = ["super_admin", "diocese_admin", "church_admin", "teacher"];
  if (!allowedRoles.includes(profile.role)) {
    redirect("/admin/dashboard");
  }

  return <CreateActivityClient userProfile={profile} />;
}
