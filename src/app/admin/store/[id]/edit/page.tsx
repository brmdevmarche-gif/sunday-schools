import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import AdminLayout from "@/components/admin/AdminLayout";
import EditStoreItemClient from "./EditStoreItemClient";
import type { StoreItem } from "@/lib/types";
import type { StoreItemSpecialOffer } from "@/lib/types";

interface Church {
  id: string;
  name: string;
  diocese_id: string;
}

export default async function EditStoreItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const canManageStore =
    profile.role === "super_admin" || profile.role === "church_admin";
  if (!canManageStore) redirect("/admin/store");

  // Use normal client for auth context if needed, but admin client for data to avoid RLS edge-cases
  await createClient();
  const adminClient = createAdminClient();

  const { data: item, error: itemError } = await adminClient
    .from("store_items")
    .select("*")
    .eq("id", id)
    .single();

  if (itemError || !item) {
    redirect("/admin/store");
  }

  const [churchLinks, dioceseLinks, classLinks, offersRes] = await Promise.all([
    adminClient
      .from("store_item_churches")
      .select("church_id")
      .eq("store_item_id", id),
    adminClient
      .from("store_item_dioceses")
      .select("diocese_id")
      .eq("store_item_id", id),
    adminClient
      .from("store_item_classes")
      .select("class_id")
      .eq("store_item_id", id),
    adminClient
      .from("store_item_special_offers")
      .select("id, store_item_id, price, start_at, end_at, created_at, updated_at")
      .eq("store_item_id", id)
      .order("start_at", { ascending: true }),
  ]);

  const initialChurchIds =
    churchLinks.data?.map((r) => r.church_id).filter(Boolean) || [];
  const initialDioceseIds =
    dioceseLinks.data?.map((r) => r.diocese_id).filter(Boolean) || [];
  const initialClassIds =
    classLinks.data?.map((r) => r.class_id).filter(Boolean) || [];

  const initialSpecialOffers =
    (offersRes.data as unknown as StoreItemSpecialOffer[]) || [];

  // Fetch selection data based on role (same approach as store management page)
  let churches: Church[] = [];
  let dioceses: { id: string; name: string }[] = [];
  let classes: { id: string; name: string; church_id: string }[] = [];

  if (profile.role === "super_admin") {
    const [{ data: churchesData }, { data: diocesesData }, { data: classesData }] =
      await Promise.all([
        adminClient.from("churches").select("id, name, diocese_id").order("name"),
        adminClient.from("dioceses").select("id, name").order("name"),
        adminClient.from("classes").select("id, name, church_id").order("name"),
      ]);

    churches = (churchesData as unknown as Church[]) || [];
    dioceses = diocesesData || [];
    classes = classesData || [];
  } else if (profile.role === "church_admin" && profile.church_id) {
    const { data: classesData } = await adminClient
      .from("classes")
      .select("id, name, church_id")
      .eq("church_id", profile.church_id)
      .order("name");
    classes = classesData || [];
  }

  return (
    <AdminLayout>
      <EditStoreItemClient
        userProfile={profile}
        item={item as StoreItem}
        churches={churches}
        dioceses={dioceses}
        classes={classes}
        initialChurchIds={initialChurchIds}
        initialDioceseIds={initialDioceseIds}
        initialClassIds={initialClassIds}
        initialSpecialOffers={initialSpecialOffers}
      />
    </AdminLayout>
  );
}


