import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import { getAvailableActivitiesAction, getMyCompletionsAction } from "./actions";
import ActivitiesClient from "./ActivitiesClient";
import { StudentSelectionGate } from "@/components/access-gates";
import { ParentNavbarWrapper } from "@/components/parents/ParentNavbarWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity } from "lucide-react";
import type { ParentChild } from "@/lib/types";

interface ActivitiesPageProps {
  searchParams: Promise<{ for?: string }>;
}

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const profile = await getCurrentUserProfile();
  const t = await getTranslations();

  if (!profile) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const params = await searchParams;
  const forUserId = params.for;

  // Track child context for parent navbar
  let childContext: ParentChild | null = null;

  // ==========================================
  // PARENT FLOW: Must select child first
  // ==========================================
  if (profile.role === "parent") {
    // Fetch all children for the parent
    const { data: relationships } = await adminClient
      .from("user_relationships")
      .select(
        `
        student_id,
        users!user_relationships_student_id_fkey (
          id,
          full_name,
          avatar_url,
          email,
          church_id,
          class_assignments (
            class_id,
            classes (id, name)
          )
        )
      `
      )
      .eq("parent_id", profile.id)
      .eq("is_active", true);

    let allChildren: ParentChild[] = [];

    if (relationships && relationships.length > 0) {
      // Get points balance for each child
      const childIds = relationships.map((r) => r.student_id);
      const { data: balances } = await adminClient
        .from("student_points_balance")
        .select("user_id, available_points")
        .in("user_id", childIds);

      const balanceMap = new Map(
        balances?.map((b) => [b.user_id, b.available_points]) || []
      );

      allChildren = relationships.map((r) => {
        const user = r.users as unknown as {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          email?: string | null;
          church_id?: string | null;
          class_assignments?: Array<{
            class_id: string;
            classes: { id: string; name: string };
          }>;
        };
        const activeClass = user?.class_assignments?.[0];
        return {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          email: user.email,
          church_id: user.church_id,
          class_id: activeClass?.class_id,
          class_name: activeClass?.classes?.name,
          points_balance: balanceMap.get(user.id) || 0,
          total_earned: 0,
          pending_approvals_count: 0,
        };
      });

      // If forUserId is specified, verify it's a valid child
      if (forUserId) {
        const selectedChild = allChildren.find((c) => c.id === forUserId);
        if (selectedChild) {
          // Set child context for navbar
          childContext = selectedChild;
        }
        // Invalid child ID will fall through to the empty state below
      }
    }

    // Parent must select a child - show navbar with empty state
    if (!forUserId || !childContext) {
      return (
        <ParentNavbarWrapper>
          <div className="container mx-auto px-4 py-12">
            <EmptyState
              icon="Activity"
              title={t("parents.nav.selectChildForActivities")}
              description={t("activities.selectChildDescription")}
            />
          </div>
        </ParentNavbarWrapper>
      );
    }
  }

  // ==========================================
  // TEACHER FLOW: Must select student first
  // ==========================================
  if (profile.role === "teacher") {
    // Fetch teacher's classes and students
    const { data: teacherClasses } = await adminClient
      .from("class_assignments")
      .select(
        `
        class_id,
        classes (
          id,
          name
        )
      `
      )
      .eq("user_id", profile.id)
      .eq("role", "teacher")
      .eq("is_active", true);

    const classIds = teacherClasses?.map((tc) => tc.class_id) || [];

    if (classIds.length > 0) {
      // Fetch all students from teacher's classes
      const { data: studentAssignments } = await adminClient
        .from("class_assignments")
        .select(
          `
          class_id,
          classes (id, name),
          users!class_assignments_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .in("class_id", classIds)
        .eq("role", "student")
        .eq("is_active", true);

      // Get points balance for students
      const studentIds =
        studentAssignments?.map(
          (sa) =>
            (sa.users as unknown as { id: string; full_name: string }).id
        ) || [];

      const { data: balances } = await adminClient
        .from("student_points_balance")
        .select("user_id, available_points")
        .in("user_id", studentIds);

      const balanceMap = new Map(
        balances?.map((b) => [b.user_id, b.available_points]) || []
      );

      const students = studentAssignments?.map((sa) => {
        const user = sa.users as unknown as {
          id: string;
          full_name: string;
          avatar_url?: string | null;
        };
        const cls = sa.classes as unknown as { id: string; name: string };
        return {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          points_balance: balanceMap.get(user.id) || 0,
          class_id: cls?.id,
          class_name: cls?.name,
        };
      }) || [];

      const classes = teacherClasses?.map((tc) => {
        const cls = tc.classes as unknown as { id: string; name: string };
        return {
          id: cls.id,
          name: cls.name,
        };
      }) || [];

      // Verify the selected student belongs to teacher's classes
      if (forUserId) {
        const selectedStudent = students.find((s) => s.id === forUserId);
        if (!selectedStudent) {
          // Invalid student ID, show selection gate
          return (
            <div className="min-h-screen bg-background">
              <StudentSelectionGate
                students={students}
                classes={classes}
                basePath="/activities"
                title={t("teacher.nav.selectStudentForActivities")}
                description={t("activities.selectStudentDescription")}
                icon={<Activity className="h-6 w-6 text-primary" />}
              />
            </div>
          );
        }
      }

      // Teacher must select a student - show selection gate if not selected
      if (!forUserId) {
        return (
          <div className="min-h-screen bg-background">
            <StudentSelectionGate
              students={students}
              classes={classes}
              basePath="/activities"
              title={t("teacher.nav.selectStudentForActivities")}
              description={t("activities.selectStudentDescription")}
              icon={<Activity className="h-6 w-6 text-primary" />}
            />
          </div>
        );
      }
    }
  }

  // ==========================================
  // COMMON: Fetch activities and render
  // ==========================================

  // Fetch available activities and user's completions
  const [activitiesResult, completionsResult] = await Promise.all([
    getAvailableActivitiesAction(),
    getMyCompletionsAction(),
  ]);

  const activitiesContent = (
    <ActivitiesClient
      activities={activitiesResult.data}
      completionsData={completionsResult.data}
      userProfile={profile}
    />
  );

  // Wrap with parent navbar if parent is viewing for a child
  if (profile.role === "parent" && childContext) {
    return <ParentNavbarWrapper>{activitiesContent}</ParentNavbarWrapper>;
  }

  return <div className="min-h-screen bg-background">{activitiesContent}</div>;
}
