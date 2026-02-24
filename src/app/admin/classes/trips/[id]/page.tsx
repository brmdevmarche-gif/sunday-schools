import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripDetailsForAllClassesAction } from "../../actions";
import TripClassStudentsClient from "./TripClassStudentsClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { PageWithPermissions } from "@/components/admin/PageWithPermissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TripClassStudentsPage({ params }: PageProps) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Permission check will be done by PageWithPermissions

  // Fetch trip details with all class students
  const tripData = await getTripDetailsForAllClassesAction(id);

  if (!tripData) {
    notFound();
  }

  return (
    <AdminLayout>
      <PageWithPermissions permission={["trips.view_detail", "classes.view_detail"]}>
        <TripClassStudentsClient
          tripData={tripData}
          userProfile={profile}
        />
      </PageWithPermissions>
    </AdminLayout>
  );
}

