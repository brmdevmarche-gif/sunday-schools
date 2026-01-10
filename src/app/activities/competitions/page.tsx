import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getCompetitionsAction, getMyCompetitionSubmissionsAction } from "./actions";
import CompetitionsClient from "./CompetitionsClient";

export default async function CompetitionsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [competitionsResult, submissionsResult] = await Promise.all([
    getCompetitionsAction({ active_only: true }),
    getMyCompetitionSubmissionsAction(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <CompetitionsClient
        competitions={competitionsResult.data || []}
        mySubmissions={submissionsResult.data || []}
        userProfile={profile}
      />
    </div>
  );
}
