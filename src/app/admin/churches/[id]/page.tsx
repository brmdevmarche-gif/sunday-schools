import AdminLayout from "@/components/admin/AdminLayout";
import { ChurchDetailsClient } from "./ChurchDetailsClient";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Church, Diocese, Class, ExtendedUser } from "@/lib/types/sunday-school";

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

  return (
    <AdminLayout>
      <ChurchDetailsClient
        church={church as Church}
        diocese={diocese}
        classes={(classes as Class[]) || []}
        users={(users as ExtendedUser[]) || []}
        isSuperAdmin={isSuperAdmin}
        isChurchAdmin={isChurchAdmin}
      />
    </AdminLayout>
  );
}
