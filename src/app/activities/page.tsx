import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getAvailableActivitiesAction, getMyCompletionsAction } from "./actions";
import ActivitiesClient from "./ActivitiesClient";

export default async function ActivitiesPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch available activities and user's completions
  const [activitiesResult, completionsResult] = await Promise.all([
    getAvailableActivitiesAction(),
    getMyCompletionsAction(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <ActivitiesClient
        activities={activitiesResult.data}
        completionsData={completionsResult.data}
        userProfile={profile}
      />
    </div>
  );
}
