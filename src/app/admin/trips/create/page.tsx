import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getChurchesForTrips, getDiocesesForTrips } from "../actions";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateTripClient from "./CreateTripClient";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export default async function CreateTripPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [churches, dioceses] = await Promise.all([
    getChurchesForTrips(),
    getDiocesesForTrips(),
  ]);

  return (
    <AdminLayout>
      <PageWithPermissions permission="trips.create">
        <CreateTripClient userProfile={profile} churches={churches} dioceses={dioceses} />
      </PageWithPermissions>
    </AdminLayout>
  );
}


