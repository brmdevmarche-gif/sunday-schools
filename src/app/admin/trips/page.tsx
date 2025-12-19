import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripsAction } from "./actions";
import TripsManagementClient from "./TripsManagementClient";
import AdminLayout from "@/components/admin/AdminLayout";

export default async function AdminTripsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin
  if (!["super_admin", "diocese_admin", "church_admin", "teacher"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch trips
  const { data: trips } = await getTripsAction();

  return (
    <AdminLayout>
      <TripsManagementClient trips={trips} userProfile={profile} />
    </AdminLayout>
  );
}


