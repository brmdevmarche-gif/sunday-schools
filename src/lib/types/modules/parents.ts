// =====================================================
// PARENT TYPES
// =====================================================

// Child overview for parent dashboard
export interface ParentChild {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  email?: string | null;
  user_code?: string | null;
  date_of_birth?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  church_id?: string | null;
  church_name?: string | null;
  points_balance: number;
  total_earned: number;
  pending_approvals_count: number;
  current_streak?: number;
  badges_count?: number;
  price_tier?: "normal" | "mastor" | "botl";
}

// Child details with full stats
export interface ChildDetails extends ParentChild {
  diocese_id?: string | null;
  diocese_name?: string | null;
  attendance_rate?: number;
  total_attendance?: number;
  activities_count?: number;
  competitions_count?: number;
  readings_count?: number;
  spiritual_notes_count?: number;
}

// Pending approval for trips
export interface PendingApproval {
  id: string; // participant id
  trip_id: string;
  trip_name: string;
  trip_name_ar?: string | null;
  trip_description?: string | null;
  child_id: string;
  child_name: string;
  child_avatar?: string | null;
  start_date: string;
  end_date: string;
  price: number;
  price_tier: "normal" | "mastor" | "botl";
  requires_payment: boolean;
  registered_at: string;
  destinations?: Array<{ name: string; description?: string }>;
  transportation_details?: string | null;
  what_to_bring?: string | null;
}

// Approval action input
export interface ApproveTripInput {
  participant_id: string;
  approved: boolean;
  notes?: string;
}

// Approval history item
export interface ApprovalHistoryItem {
  id: string;
  trip_id: string;
  trip_name: string;
  child_id: string;
  child_name: string;
  approved: boolean;
  notes?: string | null;
  approved_at: string;
  trip_start_date: string;
  trip_end_date: string;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export type NotificationType =
  | "trip_approval_needed"
  | "trip_status_changed"
  | "payment_reminder"
  | "announcement"
  | "attendance_marked"
  | "badge_earned"
  | "points_awarded"
  | "activity_reminder"
  | "general";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  title_ar?: string | null;
  body?: string | null;
  body_ar?: string | null;
  data: NotificationData;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
}

// Flexible data payload for different notification types
export interface NotificationData {
  trip_id?: string;
  participant_id?: string;
  child_id?: string;
  badge_id?: string;
  announcement_id?: string;
  activity_id?: string;
  points?: number;
  [key: string]: unknown;
}

// Notification count summary
export interface NotificationSummary {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
}

// =====================================================
// CHILD ACTIVITY TYPES
// =====================================================

export interface ChildActivitySummary {
  trips: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
  };
  activities: {
    total: number;
    completed: number;
    points_earned: number;
  };
  spiritual_notes: {
    total: number;
    approved: number;
    points_earned: number;
  };
  readings: {
    total: number;
    completed: number;
    points_earned: number;
  };
  competitions: {
    total: number;
    submitted: number;
    wins: number;
    points_earned: number;
  };
}

export interface ChildAttendanceSummary {
  period_days: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

export interface ChildAttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  class_name: string;
  notes?: string | null;
  marked_by?: string | null;
}

// =====================================================
// ACTION RESULT TYPES
// =====================================================

export interface ParentDashboardData {
  children: ParentChild[];
  pending_approvals_count: number;
  unread_notifications_count: number;
  recent_notifications: Notification[];
}

export interface ChildBadge {
  id: string;
  badge_id: string;
  name: string;
  name_ar?: string | null;
  icon: string;
  color: string;
  earned_at: string;
}

export interface ChildStreak {
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string | null;
}

export interface ChildProfileData {
  child: ChildDetails;
  activity_summary: ChildActivitySummary;
  attendance_summary: ChildAttendanceSummary;
  recent_attendance: ChildAttendanceRecord[];
  badges: ChildBadge[];
  streaks: {
    reading?: ChildStreak;
    spiritual_notes?: ChildStreak;
    combined?: ChildStreak;
  };
}
