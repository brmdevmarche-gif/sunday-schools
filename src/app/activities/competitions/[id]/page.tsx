import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getCompetitionByIdAction } from "../actions";
import CompetitionDetailClient from "./CompetitionDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const result = await getCompetitionByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <CompetitionDetailClient
        competition={result.data}
        userProfile={profile}
      />
    </div>
  );
}
