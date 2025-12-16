import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getAvailableTripsAction } from "./actions";
import TripsClient from "./TripsClient";

export default async function TripsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch available trips
  const tripsResult = await getAvailableTripsAction();

  return (
    <div className="min-h-screen bg-background">
      <TripsClient trips={tripsResult.data} userProfile={profile} />
    </div>
  );
}

