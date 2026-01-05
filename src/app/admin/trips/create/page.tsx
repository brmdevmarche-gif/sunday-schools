import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getChurchesForTrips, getDiocesesForTrips } from "../actions";
import AdminLayout from "@/components/admin/AdminLayout";
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

  const [churches, dioceses] = await Promise.all([
    getChurchesForTrips(),
    getDiocesesForTrips(),
  ]);

  return (
    <AdminLayout>
      <CreateTripClient userProfile={profile} churches={churches} dioceses={dioceses} />
    </AdminLayout>
  );
}


