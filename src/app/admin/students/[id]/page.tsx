import AdminLayout from "@/components/admin/AdminLayout";
import StudentDetailsClient from "./StudentDetailsClient";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  getStudentDetailsAction,
  getStudentActivitiesAction,
  getStudentPointsAction,
} from "./actions";

export const dynamic = "force-dynamic";

interface StudentDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentDetailsPage({
  params,
}: StudentDetailsPageProps) {
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
    .select("role, church_id, diocese_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return notFound();
  }

  // Check if user has permission to view this student
  const { data: student } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("role", "student")
    .single();

  if (!student) {
    return notFound();
  }

  // Permission check
  const isSuperAdmin = profile.role === "super_admin";
  const isDioceseAdmin = profile.role === "diocese_admin";
  const isChurchAdmin = profile.role === "church_admin";

  const hasPermission =
    isSuperAdmin ||
    (isDioceseAdmin && student.diocese_id === profile.diocese_id) ||
    (isChurchAdmin && student.church_id === profile.church_id);

  if (!hasPermission) {
    return notFound();
  }

  // Fetch student details
  const studentDetails = await getStudentDetailsAction(id);
  const activities = await getStudentActivitiesAction(id);
  const points = await getStudentPointsAction(id);

  return (
    <AdminLayout>
      <StudentDetailsClient
        student={studentDetails}
        activities={activities}
        points={points}
      />
    </AdminLayout>
  );
}
