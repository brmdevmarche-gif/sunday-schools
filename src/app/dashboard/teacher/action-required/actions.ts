"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PendingActionType = "trip" | "competition" | "activity";

export interface PendingAction {
  id: string;
  type: PendingActionType;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  title: string;
  subtitle?: string;
  requestedAt: string;
  parentInitiated: boolean;
  tripId?: string;
  competitionId?: string;
}

export interface PendingActionsResult {
  trips: PendingAction[];
  competitions: PendingAction[];
  activities: PendingAction[];
  totalCount: number;
}

/**
 * Get all pending actions for the teacher
 */
export async function getPendingActions(): Promise<PendingActionsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result: PendingActionsResult = {
    trips: [],
    competitions: [],
    activities: [],
    totalCount: 0,
  };

  // Get trips where teacher is an organizer with approval rights
  const { data: tripOrganizer } = await supabase
    .from("trip_organizers")
    .select("trip_id")
    .eq("user_id", user.id)
    .eq("can_approve", true);

  const tripIds = tripOrganizer?.map((t) => t.trip_id) || [];

  if (tripIds.length > 0) {
    // Get pending trip participants
    const { data: pendingParticipants } = await supabase
      .from("trip_participants")
      .select(
        `
        id,
        trip_id,
        user_id,
        registered_by,
        created_at,
        users!trip_participants_user_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        trips(
          id,
          title,
          start_date
        )
      `
      )
      .in("trip_id", tripIds)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });

    if (pendingParticipants) {
      for (const participant of pendingParticipants) {
        const studentInfo = participant.users as unknown as {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        };
        const tripInfo = participant.trips as unknown as {
          id: string;
          title: string;
          start_date: string;
        };

        if (studentInfo && tripInfo) {
          // Check if registered by someone else (parent)
          const parentInitiated = participant.registered_by !== participant.user_id;

          result.trips.push({
            id: participant.id,
            type: "trip",
            studentId: studentInfo.id,
            studentName: studentInfo.full_name || "Unknown Student",
            studentAvatar: studentInfo.avatar_url,
            title: tripInfo.title,
            subtitle: tripInfo.start_date
              ? new Date(tripInfo.start_date).toLocaleDateString()
              : undefined,
            requestedAt: participant.created_at,
            parentInitiated,
            tripId: tripInfo.id,
          });
        }
      }
    }
  }

  // Competition submissions would go here
  // For now, we'll leave competitions empty as a placeholder
  // The logic would be similar to trips

  result.totalCount =
    result.trips.length + result.competitions.length + result.activities.length;

  return result;
}

/**
 * Approve a trip registration request
 */
export async function approveTripRequest(
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the teacher can approve this request
  const { data: participant } = await supabase
    .from("trip_participants")
    .select("trip_id")
    .eq("id", participantId)
    .single();

  if (!participant) {
    return { success: false, error: "Request not found" };
  }

  const { data: organizer } = await supabase
    .from("trip_organizers")
    .select("id")
    .eq("trip_id", participant.trip_id)
    .eq("user_id", user.id)
    .eq("can_approve", true)
    .maybeSingle();

  if (!organizer) {
    return { success: false, error: "Not authorized to approve this request" };
  }

  // Update the participant status
  const { error } = await supabase
    .from("trip_participants")
    .update({
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", participantId);

  if (error) {
    console.error("Error approving trip request:", error);
    return { success: false, error: "Failed to approve request" };
  }

  revalidatePath("/dashboard/teacher/action-required");
  revalidatePath("/dashboard/teacher");

  return { success: true };
}

/**
 * Reject a trip registration request
 */
export async function rejectTripRequest(
  participantId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the teacher can reject this request
  const { data: participant } = await supabase
    .from("trip_participants")
    .select("trip_id")
    .eq("id", participantId)
    .single();

  if (!participant) {
    return { success: false, error: "Request not found" };
  }

  const { data: organizer } = await supabase
    .from("trip_organizers")
    .select("id")
    .eq("trip_id", participant.trip_id)
    .eq("user_id", user.id)
    .eq("can_approve", true)
    .maybeSingle();

  if (!organizer) {
    return { success: false, error: "Not authorized to reject this request" };
  }

  // Update the participant status
  const { error } = await supabase
    .from("trip_participants")
    .update({
      approval_status: "rejected",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq("id", participantId);

  if (error) {
    console.error("Error rejecting trip request:", error);
    return { success: false, error: "Failed to reject request" };
  }

  revalidatePath("/dashboard/teacher/action-required");
  revalidatePath("/dashboard/teacher");

  return { success: true };
}
