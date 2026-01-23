import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getAllOrdersAction } from "./actions";
import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import OrdersManagementClient from "./OrdersManagementClient";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Check if user is admin
  if (
    !["super_admin", "diocese_admin", "church_admin", "store_manager"].includes(
      profile.role
    )
  ) {
    redirect("/");
  }

  const supabase = await createClient();
  const sp = await searchParams;

  const page = Math.max(
    1,
    parseInt(Array.isArray(sp.page) ? sp.page[0] : (sp.page ?? "1"), 10) || 1
  );
  const pageSize = Math.max(
    1,
    Math.min(
      100,
      parseInt(
        Array.isArray(sp.pageSize) ? sp.pageSize[0] : (sp.pageSize ?? "25"),
        10
      ) || 25
    )
  );
  const from = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const to = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  // Fetch orders based on admin's scope + pagination + date filter
  const { data: orders, count = 0 } = await getAllOrdersAction({
    from,
    to,
    page,
    pageSize,
  });

  // Scope filter options based on admin role so dropdowns don't show everything
  let diocesesQuery = supabase.from("dioceses").select("id, name").order("name");
  let churchesQuery = supabase
    .from("churches")
    .select("id, name, diocese_id")
    .order("name");
  let classesQuery = supabase
    .from("classes")
    .select("id, name, church_id")
    .order("name");

  if (profile.role === "diocese_admin" && profile.diocese_id) {
    diocesesQuery = diocesesQuery.eq("id", profile.diocese_id);
    churchesQuery = churchesQuery.eq("diocese_id", profile.diocese_id);
  }

  if (profile.role === "church_admin" && profile.church_id) {
    churchesQuery = churchesQuery.eq("id", profile.church_id);
    classesQuery = classesQuery.eq("church_id", profile.church_id);
    if (profile.diocese_id) {
      diocesesQuery = diocesesQuery.eq("id", profile.diocese_id);
    }
  }

  const [diocesesResult, churchesResult, classesResult] = await Promise.all([
    diocesesQuery,
    churchesQuery,
    classesQuery,
  ]);

  return (
    <AdminLayout>
      <OrdersManagementClient
        orders={orders}
        totalCount={count}
        page={page}
        pageSize={pageSize}
        from={from ?? null}
        to={to ?? null}
        userProfile={profile}
        dioceses={diocesesResult.data || []}
        churches={churchesResult.data || []}
        classes={classesResult.data || []}
      />
    </AdminLayout>
  );
}
