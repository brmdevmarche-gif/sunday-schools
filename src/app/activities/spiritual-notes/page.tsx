import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getMySpiritualNotesAction, getSpiritualActivityTemplatesAction } from "./actions";
import SpiritualNotesClient from "./SpiritualNotesClient";

export default async function SpiritualNotesPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [notesResult, templatesResult] = await Promise.all([
    getMySpiritualNotesAction(),
    getSpiritualActivityTemplatesAction(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SpiritualNotesClient
        notes={notesResult.data || []}
        templates={templatesResult.data || []}
        userProfile={profile}
      />
    </div>
  );
}
