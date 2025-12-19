import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripByIdAction, getChurchesForTrips, getDiocesesForTrips } from "../../actions";
import EditTripClient from "../EditTripClient";

export default async function EditTripPage({
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

  // Fetch trip
  const result = await getTripByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const [churches, dioceses] = await Promise.all([
    getChurchesForTrips(),
    getDiocesesForTrips(),
  ]);

  return <EditTripClient trip={result.data} userProfile={profile} churches={churches} dioceses={dioceses} />;
}

