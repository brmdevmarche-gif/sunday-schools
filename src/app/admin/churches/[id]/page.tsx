import AdminLayout from "@/components/admin/AdminLayout";
import { ChurchDetailsClient } from "./ChurchDetailsClient";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Church, Diocese, Class, UserWithClassAssignments } from "@/lib/types/sunday-school";

export const dynamic = "force-dynamic";

interface ChurchDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChurchDetailsPage({ params }: ChurchDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("users")
    .select("role, church_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return notFound();
  }

  const isSuperAdmin = profile.role === "super_admin";
  const isChurchAdmin = profile.role === "church_admin" && profile.church_id === id;

  // Fetch church details
  const { data: church, error: churchError } = await supabase
    .from("churches")
    .select("*")
    .eq("id", id)
    .single();

  if (churchError || !church) {
    return notFound();
  }

  // Fetch diocese if church has one
  let diocese: Diocese | null = null;
  if (church.diocese_id) {
    const { data: dioceseData } = await supabase
      .from("dioceses")
      .select("*")
      .eq("id", church.diocese_id)
      .single();
    diocese = dioceseData;
  }

  // Fetch classes for this church
  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("church_id", id)
    .order("name", { ascending: true });

  // Fetch users (teachers and students) associated with this church
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("church_id", id)
    .in("role", ["teacher", "student"])
    .order("full_name", { ascending: true });

  // Fetch class assignments for these users
  const userIds = users?.map(u => u.id) || [];
  const { data: assignments } = userIds.length > 0 ? await supabase
    .from("class_assignments")
    .select(`
      class_id,
      user_id,
      assignment_type,
      classes:classes(id, name)
    `)
    .in("user_id", userIds)
    .eq("is_active", true) : { data: null };

  // Map assignments to users
  const usersWithAssignments = users?.map(user => ({
    ...user,
    classAssignments: assignments
      ?.filter(a => a.user_id === user.id)
      .map(a => ({
        class_id: a.class_id!,
        class_name: (a.classes as unknown as { name?: string } | null)?.name || 'Unknown',
        assignment_type: a.assignment_type,
      })) || []
  })) || [];

  return (
    <AdminLayout>
      <ChurchDetailsClient
        church={church as Church}
        diocese={diocese}
        classes={(classes as Class[]) || []}
        users={(usersWithAssignments as UserWithClassAssignments[]) || []}
        isSuperAdmin={isSuperAdmin}
        isChurchAdmin={isChurchAdmin}
      />
    </AdminLayout>
  );
}
