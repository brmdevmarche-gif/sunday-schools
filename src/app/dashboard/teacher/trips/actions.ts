"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  Trip,
  TripWithDetails,
  TripParticipantWithUser,
  TripOrganizerWithUser,
  TripStatus,
  TripApprovalStatus,
} from "@/lib/types/modules/trips";
import type { AttendanceStatus } from "@/components/teacher";

// =====================================================
// TYPES
// =====================================================

export interface TeacherTrip {
  id: string;
  title: string;
  destination: string | null;
  startDatetime: string;
  endDatetime: string | null;
  tripType: Trip["trip_type"];
  status: TripStatus;
  participantsCount: number;
  maxParticipants: number | null;
  imageUrl: string | null;
  canApprove: boolean;
  canTakeAttendance: boolean;
}

export interface TripDetailsData {
  trip: TeacherTrip;
  participants: TripParticipantData[];
  organizers: TripOrganizerData[];
}

export interface TripParticipantData {
  id: string;
  tripId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  approvalStatus: TripApprovalStatus;
  paymentStatus: string;
  registeredAt: string;
  attendanceStatus: AttendanceStatus | null;
  attendanceNotes: string | null;
}

export interface TripOrganizerData {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  canApprove: boolean;
  canGo: boolean;
  canTakeAttendance: boolean;
  canCollectPayment: boolean;
}

// =====================================================
// GET TEACHER TRIPS
// =====================================================

/**
 * Get trips that the current user is organizing
 */
export async function getTeacherTrips(): Promise<TeacherTrip[]> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get trips where user is an organizer
  const { data: organizerRecords, error: orgError } = await adminClient
    .from("trip_organizers")
    .select("trip_id, can_approve, can_take_attendance")
    .eq("user_id", user.id);

  if (orgError || !organizerRecords || organizerRecords.length === 0) {
    return [];
  }

  const tripIds = organizerRecords.map((o) => o.trip_id);
  const organizerMap = organizerRecords.reduce(
    (acc, o) => {
      acc[o.trip_id] = o;
      return acc;
    },
    {} as Record<string, (typeof organizerRecords)[0]>
  );

  // Get trip details
  const { data: trips, error: tripError } = await adminClient
    .from("trips")
    .select("*")
    .in("id", tripIds)
    .order("start_datetime", { ascending: true });

  if (tripError || !trips) {
    return [];
  }

  // Get participant counts
  const { data: participantCounts } = await adminClient
    .from("trip_participants")
    .select("trip_id")
    .in("trip_id", tripIds)
    .eq("approval_status", "approved");

  const countByTrip = (participantCounts || []).reduce(
    (acc, p) => {
      acc[p.trip_id] = (acc[p.trip_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get first destination for each trip
  const { data: destinations } = await adminClient
    .from("trip_destinations")
    .select("trip_id, destination_name")
    .in("trip_id", tripIds)
    .eq("visit_order", 1);

  const destinationByTrip = (destinations || []).reduce(
    (acc, d) => {
      acc[d.trip_id] = d.destination_name;
      return acc;
    },
    {} as Record<string, string>
  );

  return trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    destination: destinationByTrip[trip.id] || trip.destination,
    startDatetime: trip.start_datetime,
    endDatetime: trip.end_datetime,
    tripType: trip.trip_type,
    status: trip.status,
    participantsCount: countByTrip[trip.id] || 0,
    maxParticipants: trip.max_participants,
    imageUrl: trip.image_url,
    canApprove: organizerMap[trip.id]?.can_approve || false,
    canTakeAttendance: organizerMap[trip.id]?.can_take_attendance || false,
  }));
}

// =====================================================
// GET TRIP DETAILS
// =====================================================

/**
 * Get details for a specific trip the user is organizing
 */
export async function getTripDetails(
  tripId: string
): Promise<TripDetailsData | null> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Check if user is an organizer for this trip
  const { data: organizerRecord, error: orgError } = await adminClient
    .from("trip_organizers")
    .select("can_approve, can_take_attendance")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (orgError || !organizerRecord) {
    return null;
  }

  // Get trip details
  const { data: trip, error: tripError } = await adminClient
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (tripError || !trip) {
    return null;
  }

  // Get first destination
  const { data: destinations } = await adminClient
    .from("trip_destinations")
    .select("destination_name")
    .eq("trip_id", tripId)
    .eq("visit_order", 1)
    .limit(1);

  // Get participants with user info
  const { data: participants } = await adminClient
    .from("trip_participants")
    .select(
      `
      id,
      trip_id,
      user_id,
      approval_status,
      payment_status,
      registered_at,
      attendance_status,
      attendance_notes
    `
    )
    .eq("trip_id", tripId)
    .order("registered_at", { ascending: false });

  // Get user details for participants
  let participantData: TripParticipantData[] = [];
  if (participants && participants.length > 0) {
    const userIds = participants.map((p) => p.user_id);
    const { data: users } = await adminClient
      .from("users")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", userIds);

    type UserRecord = { id: string; full_name: string | null; email: string; phone: string | null; avatar_url: string | null };
    const userMap = (users || []).reduce(
      (acc, u) => {
        acc[u.id] = u;
        return acc;
      },
      {} as Record<string, UserRecord>
    );

    participantData = participants.map((p) => {
      const u = userMap[p.user_id];
      return {
        id: p.id,
        tripId: p.trip_id,
        userId: p.user_id,
        fullName: u?.full_name || "Unknown",
        email: u?.email || "",
        phone: u?.phone || null,
        avatarUrl: u?.avatar_url || null,
        approvalStatus: p.approval_status,
        paymentStatus: p.payment_status,
        registeredAt: p.registered_at,
        attendanceStatus: p.attendance_status as AttendanceStatus | null,
        attendanceNotes: p.attendance_notes || null,
      };
    });
  }

  // Get organizers with user info
  const { data: organizers } = await adminClient
    .from("trip_organizers")
    .select(
      `
      id,
      user_id,
      can_approve,
      can_go,
      can_take_attendance,
      can_collect_payment
    `
    )
    .eq("trip_id", tripId);

  let organizerData: TripOrganizerData[] = [];
  if (organizers && organizers.length > 0) {
    const orgUserIds = organizers.map((o) => o.user_id);
    const { data: orgUsers } = await adminClient
      .from("users")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", orgUserIds);

    type OrgUserRecord = { id: string; full_name: string | null; email: string; phone: string | null; avatar_url: string | null };
    const orgUserMap = (orgUsers || []).reduce(
      (acc, u) => {
        acc[u.id] = u;
        return acc;
      },
      {} as Record<string, OrgUserRecord>
    );

    organizerData = organizers.map((o) => {
      const u = orgUserMap[o.user_id];
      return {
        id: o.id,
        userId: o.user_id,
        fullName: u?.full_name || "Unknown",
        email: u?.email || "",
        phone: u?.phone || null,
        avatarUrl: u?.avatar_url || null,
        canApprove: o.can_approve,
        canGo: o.can_go,
        canTakeAttendance: o.can_take_attendance,
        canCollectPayment: o.can_collect_payment,
      };
    });
  }

  // Count approved participants
  const approvedCount = participantData.filter(
    (p) => p.approvalStatus === "approved"
  ).length;

  return {
    trip: {
      id: trip.id,
      title: trip.title,
      destination: destinations?.[0]?.destination_name || trip.destination,
      startDatetime: trip.start_datetime,
      endDatetime: trip.end_datetime,
      tripType: trip.trip_type,
      status: trip.status,
      participantsCount: approvedCount,
      maxParticipants: trip.max_participants,
      imageUrl: trip.image_url,
      canApprove: organizerRecord.can_approve,
      canTakeAttendance: organizerRecord.can_take_attendance,
    },
    participants: participantData,
    organizers: organizerData,
  };
}

// =====================================================
// SAVE TRIP ATTENDANCE
// =====================================================

export interface TripAttendanceRecord {
  participantId: string;
  status: AttendanceStatus;
  notes?: string;
}

/**
 * Save attendance for trip participants
 */
export async function saveTripAttendance(
  tripId: string,
  records: TripAttendanceRecord[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user can take attendance for this trip
  const { data: organizerRecord } = await adminClient
    .from("trip_organizers")
    .select("can_take_attendance")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (!organizerRecord?.can_take_attendance) {
    return { success: false, error: "Not authorized to take attendance" };
  }

  // Update each participant's attendance
  const updates = records.map((record) =>
    adminClient
      .from("trip_participants")
      .update({
        attendance_status: record.status,
        attendance_notes: record.notes || null,
        attendance_marked_at: new Date().toISOString(),
        attendance_marked_by: user.id,
      })
      .eq("id", record.participantId)
      .eq("trip_id", tripId)
  );

  try {
    await Promise.all(updates);
    revalidatePath(`/dashboard/teacher/trips/${tripId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save trip attendance:", error);
    return { success: false, error: "Failed to save attendance" };
  }
}

// =====================================================
// CHECK IF USER IS ORGANIZING ANY TRIPS
// =====================================================

/**
 * Check if the current user is organizing any trips (for conditional nav)
 */
export async function isUserOrganizingTrips(): Promise<boolean> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { count, error } = await adminClient
    .from("trip_organizers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return !error && (count || 0) > 0;
}
