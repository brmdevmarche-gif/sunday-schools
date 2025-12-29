import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripByIdAction, getTripParticipantsAction, getTripDetailsAction, getTripOrganizersAction } from "../actions";
import TripDetailsClient from "./TripDetailsClient";
import AdminLayout from "@/components/admin/AdminLayout";

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

  // Check if user has permission
  const allowedRoles = ["super_admin", "diocese_admin", "church_admin", "teacher"];
  if (!allowedRoles.includes(profile.role)) {
    redirect("/admin/dashboard");
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
      <TripDetailsClient
        trip={tripResult.data}
        participants={participantsResult.data}
        organizers={organizersResult.data || []}
        stats={detailsResult.data.participantsStats}
        userProfile={profile}
      />
    </AdminLayout>
  );
}

