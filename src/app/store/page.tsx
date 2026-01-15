import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserProfile } from "@/lib/sunday-school/users.server";
import StoreClient from "./StoreClient";
import { StudentSelectionGate } from "@/components/access-gates";
import { ParentNavbarWrapper } from "@/components/parents/ParentNavbarWrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingBag } from "lucide-react";
import type { ParentChild } from "@/lib/types";

interface StorePageProps {
  searchParams: Promise<{ for?: string }>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const profile = await getCurrentUserProfile();
  const t = await getTranslations();

  if (!profile) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const params = await searchParams;
  const forUserId = params.for;

  // Check if parent is ordering for a child
  let childContext: ParentChild | null = null;
  let allChildren: ParentChild[] = [];
  let targetUserId = profile.id;
  let targetUserChurchId = profile.church_id;
  let targetUserDioceseId = profile.diocese_id;

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
          diocese_id,
          class_assignments (
            class_id,
            classes (id, name)
          )
        )
      `
      )
      .eq("parent_id", profile.id)
      .eq("is_active", true);

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
          diocese_id?: string | null;
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

      // If forUserId is specified, verify and use that child
      if (forUserId) {
        const selectedChild = allChildren.find((c) => c.id === forUserId);
        if (selectedChild) {
          childContext = selectedChild;
          targetUserId = selectedChild.id;
          targetUserChurchId = selectedChild.church_id || null;
          targetUserDioceseId = null;
        }
      }
    }

    // Parent must select a child - show navbar with empty state
    if (!forUserId || !childContext) {
      return (
        <ParentNavbarWrapper>
          <div className="container mx-auto px-4 py-12">
            <EmptyState
              icon="ShoppingBag"
              title={t("parents.nav.selectChildForStore")}
              description={t("store.selectChildDescription")}
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
        if (selectedStudent) {
          targetUserId = selectedStudent.id;
          // Get student's church/diocese
          const { data: studentProfile } = await adminClient
            .from("users")
            .select("church_id, diocese_id")
            .eq("id", forUserId)
            .single();
          targetUserChurchId = studentProfile?.church_id || null;
          targetUserDioceseId = studentProfile?.diocese_id || null;
        }
      }

      // Teacher must select a student - show selection gate if not selected
      if (!forUserId) {
        return (
          <div className="min-h-screen bg-background">
            <StudentSelectionGate
              students={students}
              classes={classes}
              basePath="/store"
              title={t("teacher.nav.selectStudentForStore")}
              description={t("store.selectStudentDescription")}
              icon={<ShoppingBag className="h-6 w-6 text-primary" />}
            />
          </div>
        );
      }
    }
  }

  // ==========================================
  // COMMON: Fetch store items and render
  // ==========================================

  // Get target user's class assignments to determine available items
  const { data: classAssignments } = await adminClient
    .from("class_assignments")
    .select("class_id")
    .eq("user_id", targetUserId)
    .eq("is_active", true);

  const classIds = classAssignments?.map((a) => a.class_id) || [];

  // Fetch available store items with special offers
  const query = adminClient
    .from("store_items")
    .select(
      `
      *,
      store_item_churches (church_id),
      store_item_dioceses (diocese_id),
      store_item_classes (class_id),
      special_offers:store_item_special_offers (*)
    `
    )
    .eq("is_active", true);

  const { data: allItems, error } = await query;

  if (error) {
    console.error("Error fetching store items:", error);
  }

  // Filter items based on target user's access
  const availableItems =
    allItems?.filter((item) => {
      if (item.is_available_to_all_classes) {
        return true;
      }

      if (
        item.store_item_classes?.some((sic: { class_id: string }) =>
          classIds.includes(sic.class_id)
        )
      ) {
        return true;
      }

      if (
        targetUserChurchId &&
        item.store_item_churches?.some(
          (sic: { church_id: string }) => sic.church_id === targetUserChurchId
        )
      ) {
        return true;
      }

      if (
        targetUserDioceseId &&
        item.store_item_dioceses?.some(
          (sid: { diocese_id: string }) => sid.diocese_id === targetUserDioceseId
        )
      ) {
        return true;
      }

      return false;
    }) || [];

  // Get points balance for the target user
  let pointsBalance = {
    available_points: 0,
    suspended_points: 0,
    total_earned: 0,
  };
  const { data: balanceData } = await adminClient
    .from("student_points_balance")
    .select("available_points, suspended_points, total_earned")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (balanceData) {
    pointsBalance = balanceData;
  }

  const storeContent = (
    <StoreClient
      items={availableItems}
      userProfile={profile}
      userClassIds={classIds}
      pointsBalance={pointsBalance}
      childContext={childContext}
      allChildren={allChildren}
    />
  );

  // Wrap with parent navbar if parent is viewing for a child
  if (profile.role === "parent" && childContext) {
    return <ParentNavbarWrapper>{storeContent}</ParentNavbarWrapper>;
  }

  return <div className="min-h-screen bg-background">{storeContent}</div>;
}
