// =====================================================
// ACTIVITIES TYPES
// =====================================================
// Activities, participation, and completion tracking
// =====================================================

// =====================================================
// ACTIVITY ENUMS
// =====================================================

export type ActivityStatus = "draft" | "active" | "completed" | "cancelled";
export type ParticipationStatus = "pending" | "approved" | "rejected" | "active" | "withdrawn";
export type CompletionStatus = "pending" | "approved" | "rejected" | "completed";
export type RegistrationStatus = "registered" | "waitlist" | "attended" | "cancelled" | "confirmed";

// =====================================================
// ACTIVITY
// =====================================================

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_activity_id: string | null;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  points: number;
  reduced_points_percentage: number;
  requires_participation_approval: boolean;
  requires_completion_approval: boolean;
  is_time_sensitive: boolean;
  start_time: string | null;
  end_time: string | null;
  deadline: string | null;
  full_points_window_start: string | null;
  full_points_window_end: string | null;
  max_participants: number | null;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// ACTIVITY PARTICIPANT
// =====================================================

export interface ActivityParticipant {
  id: string;
  activity_id: string;
  user_id: string;
  status: ParticipationStatus;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// =====================================================
// ACTIVITY COMPLETION
// =====================================================

export interface ActivityCompletion {
  id: string;
  activity_id: string;
  user_id: string;
  status: CompletionStatus;
  points_awarded: number;
  is_full_points: boolean;
  completed_at: string;
  approved_at: string | null;
  approved_by: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

// =====================================================
// CLASS ACTIVITY PARTICIPANT (for ClassActivity)
// =====================================================

export interface ClassActivityParticipant {
  id: string;
  activity_id: string | null;
  user_id: string | null;
  registration_status: RegistrationStatus | null;
  parent_approved: boolean | null;
  registered_at: string;
  attended: boolean | null;
  notes: string | null;
}

// =====================================================
// ACTIVITY INPUT TYPES
// =====================================================

export interface CreateActivityInput {
  name: string;
  description?: string;
  image_url?: string;
  parent_activity_id?: string;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
  points: number;
  reduced_points_percentage?: number;
  requires_participation_approval?: boolean;
  requires_completion_approval?: boolean;
  is_time_sensitive?: boolean;
  start_time?: string;
  end_time?: string;
  deadline?: string;
  full_points_window_start?: string;
  full_points_window_end?: string;
  max_participants?: number;
  status?: ActivityStatus;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  id: string;
}

export interface ParticipateActivityInput {
  activity_id: string;
}

export interface CompleteActivityInput {
  activity_id: string;
  notes?: string;
}

export interface ApproveParticipationInput {
  participation_id: string;
  approved: boolean;
  rejection_reason?: string;
}

export interface ApproveCompletionInput {
  completion_id: string;
  approved: boolean;
  admin_notes?: string;
}

export interface RevokePointsInput {
  completion_id: string;
  revoke_reason: string;
}

// =====================================================
// EXTENDED ACTIVITY TYPES
// =====================================================

export interface ActivityWithDetails extends Activity {
  parent_activity?: Activity;
  sub_activities?: Activity[];
  participants_count?: number;
  completions_count?: number;
  my_participation?: ActivityParticipant;
  my_completion?: ActivityCompletion;
}
