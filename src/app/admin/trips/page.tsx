import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripsAction } from "./actions";
import TripsManagementClient from "./TripsManagementClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export const metadata: Metadata = {
  title: "Trips",
};

export default async function AdminTripsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch trips
  const { data: trips } = await getTripsAction();

  return (
    <AdminLayout>
      <PageWithPermissions permission="trips.view">
        <TripsManagementClient trips={trips} userProfile={profile} />
      </PageWithPermissions>
    </AdminLayout>
  );
}


