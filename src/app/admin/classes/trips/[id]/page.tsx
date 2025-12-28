import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripDetailsForAllClassesAction } from "../../actions";
import TripClassStudentsClient from "./TripClassStudentsClient";
import AdminLayout from "@/components/admin/AdminLayout";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TripClassStudentsPage({ params }: PageProps) {
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

  // Fetch trip details with all class students
  const tripData = await getTripDetailsForAllClassesAction(id);

  if (!tripData) {
    notFound();
  }

  return (
    <AdminLayout>
      <TripClassStudentsClient
        tripData={tripData}
        userProfile={profile}
      />
    </AdminLayout>
  );
}

