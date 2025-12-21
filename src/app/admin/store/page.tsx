import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import StoreClient from "./StoreClient";
import type { StoreItem } from "@/lib/types";

interface Church {
  id: string;
  name: string;
  diocese_id: string;
  dioceses: { name: string } | null;
}

export default async function StorePage() {
  const supabase = await createClient();

  // Get current user profile
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Only super_admin and church_admin can manage store
  const canManageStore =
    profile.role === "super_admin" || profile.role === "church_admin";

  if (!canManageStore) {
    redirect("/admin");
  }

  // Fetch store items based on role
  let itemsQuery = supabase
    .from("store_items")
    .select("*")
    .order("created_at", { ascending: false });

  // Filter by church if church admin
  if (profile.role === "church_admin" && profile.church_id) {
    itemsQuery = itemsQuery.or(
      `church_id.eq.${profile.church_id},church_id.is.null`
    );
  }

  const { data: items, error: itemsError } = await itemsQuery;

  if (itemsError) {
    console.error("Error fetching store items:", itemsError);
  }

  // Fetch churches for the dropdown (for super admin)
  let churches: Church[] = [];
  if (profile.role === "super_admin") {
    const { data: churchesData } = await supabase
      .from("churches")
      .select("id, name, diocese_id, dioceses(name)")
      .order("name");
    churches = (churchesData as unknown as Church[]) || [];
  }

  // Fetch dioceses for the dropdown (for super admin)
  let dioceses: { id: string; name: string }[] = [];
  if (profile.role === "super_admin") {
    const { data: diocesesData } = await supabase
      .from("dioceses")
      .select("id, name")
      .order("name");
    dioceses = diocesesData || [];
  }

  // Fetch all classes for church admins and super admins
  let classes: { id: string; name: string; church_id: string }[] = [];
  if (profile.role === "super_admin") {
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name, church_id")
      .order("name");
    classes = classesData || [];
  } else if (profile.role === "church_admin" && profile.church_id) {
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name, church_id")
      .eq("church_id", profile.church_id)
      .order("name");
    classes = classesData || [];
  }

  return (
    <AdminLayout>
      <StoreClient
        items={(items as StoreItem[]) || []}
        churches={churches}
        dioceses={dioceses}
        classes={classes}
        userRole={profile.role}
      />
    </AdminLayout>
  );
}
