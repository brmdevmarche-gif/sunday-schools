import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import ClassDetailsClient from "./ClassDetailsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailsPage({ params }: PageProps) {
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

  // Use admin client to fetch roster to bypass RLS
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();

  // Fetch class roster (teachers and students)
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
        avatar_url
      )
    `)
    .eq("class_id", id)
    .eq("is_active", true)
    .order("assignment_type", { ascending: false });

  if (rosterError) {
    console.error("Error fetching roster:", rosterError);
  }

  // Fetch activities for this class, church, and diocese
  const churchId = classData.churches?.id;
  const dioceseId = classData.churches?.diocese_id;

  const { data: activitiesData } = await supabase
    .from("activities")
    .select(`
      *,
      churches (
        id,
        name
      ),
      classes (
        id,
        name
      )
    `)
    .or(`class_id.eq.${id},church_id.eq.${churchId},church_id.in.(select id from churches where diocese_id=${dioceseId})`)
    .order("activity_date", { ascending: false });

  return (
    <AdminLayout>
      <ClassDetailsClient
        classData={classData}
        rosterData={rosterData || []}
        activitiesData={activitiesData || []}
        userProfile={profile}
      />
    </AdminLayout>
  );
}
