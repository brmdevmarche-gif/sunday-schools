import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripByIdAction, getChurchesForTrips, getDiocesesForTrips } from "../../actions";
import AdminLayout from "@/components/admin/AdminLayout";
import EditTripClient from "../EditTripClient";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export const metadata: Metadata = {
  title: "Edit Trip",
};

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

  // Permission check will be done by PageWithPermissions

  // Fetch trip
  const result = await getTripByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const [churches, dioceses] = await Promise.all([
    getChurchesForTrips(),
    getDiocesesForTrips(),
  ]);

  return (
    <AdminLayout>
      <PageWithPermissions permission="trips.update">
        <EditTripClient trip={result.data} userProfile={profile} churches={churches} dioceses={dioceses} />
      </PageWithPermissions>
    </AdminLayout>
  );
}

