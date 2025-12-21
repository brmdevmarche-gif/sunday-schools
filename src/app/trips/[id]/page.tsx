import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getTripDetailsAction } from "../actions";
import TripDetailsClient from "./TripDetailsClient";

interface TripDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripDetailsPage({ params }: TripDetailsPageProps) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch trip details
  const tripResult = await getTripDetailsAction(id);

  if (!tripResult.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <TripDetailsClient trip={tripResult.data} userProfile={profile} />
    </div>
  );
}
