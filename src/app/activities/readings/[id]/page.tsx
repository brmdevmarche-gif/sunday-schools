import { redirect, notFound } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getReadingScheduleByIdAction } from "../actions";
import ReadingScheduleDetailClient from "./ReadingScheduleDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReadingScheduleDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const result = await getReadingScheduleByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <ReadingScheduleDetailClient
        schedule={result.data}
        userProfile={profile}
      />
    </div>
  );
}
