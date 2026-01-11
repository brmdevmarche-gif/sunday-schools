"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =====================================================
// TYPES
// =====================================================

export interface StudentSearchResult {
  id: string;
  type: "student";
  name: string;
  className: string;
  avatarUrl: string | null;
}

export interface ClassSearchResult {
  id: string;
  type: "class";
  name: string;
  churchName: string;
  studentCount: number;
}

export interface TripSearchResult {
  id: string;
  type: "trip";
  title: string;
  destination: string | null;
  startDate: string;
  status: string;
}

export type SearchResult = StudentSearchResult | ClassSearchResult | TripSearchResult;

export interface SearchResults {
  students: StudentSearchResult[];
  classes: ClassSearchResult[];
  trips: TripSearchResult[];
  totalCount: number;
}

// =====================================================
// SEARCH ALL
// =====================================================

/**
 * Unified search across students, classes, and trips
 */
export async function searchAll(query: string): Promise<SearchResults> {
  if (!query || query.trim().length < 2) {
    return { students: [], classes: [], trips: [], totalCount: 0 };
  }

  const [students, classes, trips] = await Promise.all([
    searchStudents(query),
    searchClasses(query),
    searchTrips(query),
  ]);

  return {
    students,
    classes,
    trips,
    totalCount: students.length + classes.length + trips.length,
  };
}

// =====================================================
// SEARCH STUDENTS
// =====================================================

/**
 * Search students in teacher's classes
 */
export async function searchStudents(query: string): Promise<StudentSearchResult[]> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get teacher's classes
  const { data: teacherClasses } = await adminClient
    .from("class_teachers")
    .select("class_id")
    .eq("user_id", user.id);

  if (!teacherClasses || teacherClasses.length === 0) {
    return [];
  }

  const classIds = teacherClasses.map((c) => c.class_id);

  // Get class details for display
  const { data: classes } = await adminClient
    .from("classes")
    .select("id, name")
    .in("id", classIds);

  const classMap = (classes || []).reduce(
    (acc, c) => {
      acc[c.id] = c.name;
      return acc;
    },
    {} as Record<string, string>
  );

  // Get student enrollments in teacher's classes
  const { data: enrollments } = await adminClient
    .from("class_students")
    .select("user_id, class_id")
    .in("class_id", classIds);

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const studentIds = [...new Set(enrollments.map((e) => e.user_id))];

  // Get student user info with search
  const searchPattern = `%${query}%`;
  const { data: students } = await adminClient
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", studentIds)
    .ilike("full_name", searchPattern)
    .limit(10);

  if (!students) {
    return [];
  }

  // Map enrollments to find class for each student
  const studentClassMap = enrollments.reduce(
    (acc, e) => {
      if (!acc[e.user_id]) {
        acc[e.user_id] = e.class_id;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  return students.map((s) => ({
    id: s.id,
    type: "student" as const,
    name: s.full_name || "Unknown",
    className: classMap[studentClassMap[s.id]] || "Unknown Class",
    avatarUrl: s.avatar_url,
  }));
}

// =====================================================
// SEARCH CLASSES
// =====================================================

/**
 * Search teacher's classes
 */
export async function searchClasses(query: string): Promise<ClassSearchResult[]> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get teacher's classes with search
  const { data: teacherClasses } = await adminClient
    .from("class_teachers")
    .select("class_id")
    .eq("user_id", user.id);

  if (!teacherClasses || teacherClasses.length === 0) {
    return [];
  }

  const classIds = teacherClasses.map((c) => c.class_id);
  const searchPattern = `%${query}%`;

  // Get class details
  const { data: classes } = await adminClient
    .from("classes")
    .select("id, name, church_id")
    .in("id", classIds)
    .ilike("name", searchPattern)
    .limit(10);

  if (!classes || classes.length === 0) {
    return [];
  }

  // Get church names
  const churchIds = [...new Set(classes.map((c) => c.church_id).filter(Boolean))];
  const { data: churches } = await adminClient
    .from("churches")
    .select("id, name")
    .in("id", churchIds);

  const churchMap = (churches || []).reduce(
    (acc, c) => {
      acc[c.id] = c.name;
      return acc;
    },
    {} as Record<string, string>
  );

  // Get student counts
  const { data: studentCounts } = await adminClient
    .from("class_students")
    .select("class_id")
    .in("class_id", classes.map((c) => c.id));

  const countMap = (studentCounts || []).reduce(
    (acc, s) => {
      acc[s.class_id] = (acc[s.class_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return classes.map((c) => ({
    id: c.id,
    type: "class" as const,
    name: c.name,
    churchName: churchMap[c.church_id] || "Unknown Church",
    studentCount: countMap[c.id] || 0,
  }));
}

// =====================================================
// SEARCH TRIPS
// =====================================================

/**
 * Search trips teacher is organizing
 */
export async function searchTrips(query: string): Promise<TripSearchResult[]> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get trips where user is an organizer
  const { data: organizerRecords } = await adminClient
    .from("trip_organizers")
    .select("trip_id")
    .eq("user_id", user.id);

  if (!organizerRecords || organizerRecords.length === 0) {
    return [];
  }

  const tripIds = organizerRecords.map((o) => o.trip_id);
  const searchPattern = `%${query}%`;

  // Get trip details with search
  const { data: trips } = await adminClient
    .from("trips")
    .select("id, title, destination, start_datetime, status")
    .in("id", tripIds)
    .ilike("title", searchPattern)
    .limit(10);

  if (!trips) {
    return [];
  }

  return trips.map((t) => ({
    id: t.id,
    type: "trip" as const,
    title: t.title,
    destination: t.destination,
    startDate: t.start_datetime,
    status: t.status,
  }));
}
