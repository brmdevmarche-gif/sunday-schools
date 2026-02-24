import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripByIdAction, getTripParticipantsAction, getTripDetailsAction, getTripOrganizersAction } from "../actions";
import TripDetailsClient from "./TripDetailsClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

export default async function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch trip details, participants, and organizers
  const [tripResult, participantsResult, detailsResult, organizersResult] = await Promise.all([
    getTripByIdAction(id),
    getTripParticipantsAction(id),
    getTripDetailsAction(id),
    getTripOrganizersAction(id),
  ]);

  if (!tripResult.success || !tripResult.data) {
    notFound();
  }

  return (
    <AdminLayout>
      <PageWithPermissions permission="trips.view_detail">
        <TripDetailsClient
          trip={tripResult.data}
          participants={participantsResult.data}
          organizers={organizersResult.data || []}
          stats={detailsResult.data.participantsStats}
          userProfile={profile}
        />
      </PageWithPermissions>
    </AdminLayout>
  );
}

