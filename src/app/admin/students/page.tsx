import AdminLayout from "@/components/admin/AdminLayout";
import StudentsClient from "./StudentsClient";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { ExtendedUser, Diocese, Church, Class } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
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
    .select("role, church_id, diocese_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return notFound();
  }

  const isSuperAdmin = profile.role === "super_admin";
  const isDioceseAdmin = profile.role === "diocese_admin";
  const isChurchAdmin = profile.role === "church_admin";

  // Build query based on permissions
  let studentsQuery = supabase
    .from("users")
    .select("*")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  // Filter based on role
  if (isChurchAdmin && profile.church_id) {
    studentsQuery = studentsQuery.eq("church_id", profile.church_id);
  } else if (isDioceseAdmin && profile.diocese_id) {
    studentsQuery = studentsQuery.eq("diocese_id", profile.diocese_id);
  }

  const { data: students } = await studentsQuery;

  // Fetch dioceses
  const { data: dioceses } = await supabase
    .from("dioceses")
    .select("*")
    .order("name", { ascending: true });

  // Fetch churches based on permissions
  let churchesQuery = supabase
    .from("churches")
    .select("*")
    .order("name", { ascending: true });

  if (isDioceseAdmin && profile.diocese_id) {
    churchesQuery = churchesQuery.eq("diocese_id", profile.diocese_id);
  } else if (isChurchAdmin && profile.church_id) {
    churchesQuery = churchesQuery.eq("id", profile.church_id);
  }

  const { data: churches } = await churchesQuery;

  // Fetch classes based on permissions
  let classesQuery = supabase
    .from("classes")
    .select("*")
    .order("name", { ascending: true });

  if (isChurchAdmin && profile.church_id) {
    classesQuery = classesQuery.eq("church_id", profile.church_id);
  }

  const { data: classes } = await classesQuery;

  // Fetch class assignments for students
  const studentIds = students?.map((s) => s.id) || [];
  const { data: assignments } =
    studentIds.length > 0
      ? await supabase
          .from("class_assignments")
          .select(
            `
      class_id,
      user_id,
      assignment_type,
      classes:classes(id, name)
    `
          )
          .in("user_id", studentIds)
          .eq("assignment_type", "student")
          .eq("is_active", true)
      : { data: null };

  // Map assignments to students
  const studentsWithAssignments =
    students?.map((student) => ({
      ...student,
      classAssignments:
        assignments
          ?.filter((a) => a.user_id === student.id)
          .map((a) => ({
            class_id: a.class_id!,
            class_name: (a.classes as any)?.name || "Unknown",
            assignment_type: a.assignment_type,
          })) || [],
    })) || [];

  return (
    <AdminLayout>
      <StudentsClient
        initialStudents={studentsWithAssignments as any}
        dioceses={(dioceses as Diocese[]) || []}
        churches={(churches as Church[]) || []}
        classes={(classes as Class[]) || []}
        canCreate={isSuperAdmin || isDioceseAdmin || isChurchAdmin}
        canEdit={isSuperAdmin || isDioceseAdmin || isChurchAdmin}
        canDelete={isSuperAdmin}
      />
    </AdminLayout>
  );
}
