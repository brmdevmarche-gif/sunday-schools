import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import BirthdaysClient from "./BirthdaysClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BirthdaysPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch class details
  const { data: classData, error } = await supabase
    .from("classes")
    .select(`
      *,
      churches (
        id,
        name,
        diocese_id,
        dioceses (
          id,
          name
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !classData) {
    redirect("/admin/classes");
  }

  // Use admin client to fetch roster with date_of_birth
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();

  // Fetch class roster (teachers and students) with date_of_birth
  const { data: rosterData, error: rosterError } = await adminClient
    .from("class_assignments")
    .select(`
      id,
      assignment_type,
      is_active,
      user:users!class_assignments_user_id_fkey (
        id,
        full_name,
        email,
        phone,
        avatar_url,
        date_of_birth
      )
    `)
    .eq("class_id", id)
    .eq("is_active", true)
    .order("assignment_type", { ascending: false });

  if (rosterError) {
    console.error("Error fetching roster:", rosterError);
  }

  return (
    <AdminLayout>
      <BirthdaysClient
        classData={classData}
        rosterData={rosterData || []}
      />
    </AdminLayout>
  );
}
