import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getChurchesForTrips } from "../actions";
import CreateTripClient from "./CreateTripClient";

export default async function CreateTripPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user has permission
  const allowedRoles = ["super_admin", "diocese_admin", "church_admin", "teacher"];
  if (!allowedRoles.includes(profile.role)) {
    redirect("/admin/dashboard");
  }

  const churches = await getChurchesForTrips();

  return <CreateTripClient userProfile={profile} churches={churches} />;
}

