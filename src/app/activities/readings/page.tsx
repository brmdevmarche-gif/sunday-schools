import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getReadingSchedulesAction } from "./actions";
import ReadingsClient from "./ReadingsClient";

export const metadata: Metadata = {
  title: "Readings",
};

export default async function ReadingsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const schedulesResult = await getReadingSchedulesAction({ current_only: false });

  return (
    <div className="min-h-screen bg-background">
      <ReadingsClient
        schedules={schedulesResult.data || []}
        userProfile={profile}
      />
    </div>
  );
}
