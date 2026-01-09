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

export default async function StorePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  const sp = searchParams ? await searchParams : {};

  const page = Math.max(
    1,
    parseInt(
      Array.isArray(sp.page) ? sp.page[0] : (sp.page ?? "1"),
      10
    ) || 1
  );
  const pageSize = Math.max(
    1,
    Math.min(
      100,
      parseInt(
        Array.isArray(sp.pageSize)
          ? sp.pageSize[0]
          : (sp.pageSize ?? "25"),
        10
      ) || 25
    )
  );
  const from = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const to = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  // Fetch store items based on role + pagination + date filter
  let itemsQuery = supabase
    .from("store_items")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (from) itemsQuery = itemsQuery.gte("created_at", from);
  if (to) itemsQuery = itemsQuery.lte("created_at", to);

  // Filter by church if church admin
  if (profile.role === "church_admin" && profile.church_id) {
    itemsQuery = itemsQuery.or(
      `church_id.eq.${profile.church_id},church_id.is.null`
    );
  }

  const { data: items, error: itemsError, count } = await itemsQuery.range(
    fromIdx,
    toIdx
  );

  // Avoid console.error in server components (can trigger Turbopack sourcemap overlay issues on Windows paths with spaces)

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
        totalCount={count ?? 0}
        page={page}
        pageSize={pageSize}
        from={from ?? null}
        to={to ?? null}
        churches={churches}
        dioceses={dioceses}
        classes={classes}
        userRole={profile.role}
      />
    </AdminLayout>
  );
}
