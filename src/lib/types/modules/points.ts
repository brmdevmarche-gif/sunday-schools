// Points System Types

export type PointsTransactionType =
  | 'activity_completion'
  | 'activity_revocation'
  | 'attendance'
  | 'trip_participation'
  | 'teacher_adjustment'
  | 'store_order_pending'
  | 'store_order_approved'
  | 'store_order_cancelled'
  | 'store_order_rejected'
  | 'admin_adjustment';

// Church Points Configuration
export interface ChurchPointsConfig {
  id: string;
  church_id: string;

  // Attendance points
  attendance_points_present: number;
  attendance_points_late: number;
  attendance_points_excused: number;
  attendance_points_absent: number;

  // Trip points
  trip_participation_points: number;

  // Teacher limits
  max_teacher_adjustment: number;

  // Feature flags
  is_attendance_points_enabled: boolean;
  is_trip_points_enabled: boolean;
  is_teacher_adjustment_enabled: boolean;

  created_at: string;
  updated_at: string;
}

// Student Points Balance
export interface StudentPointsBalance {
  id: string;
  user_id: string;

  // Points breakdown
  available_points: number;
  suspended_points: number;
  used_points: number;

  // Totals for stats
  total_earned: number;
  total_deducted: number;

  created_at: string;
  updated_at: string;
}

// Points Transaction (audit trail)
export interface PointsTransaction {
  id: string;
  user_id: string;

  transaction_type: PointsTransactionType;
  points: number;
  balance_after: number;

  notes: string | null;

  // Related entities
  activity_id: string | null;
  attendance_id: string | null;
  trip_id: string | null;
  order_id: string | null;

  created_by: string | null;
  created_at: string;
}

// Extended types with relations
export interface PointsTransactionWithDetails extends PointsTransaction {
  activity?: {
    id: string;
    name: string;
  } | null;
  order?: {
    id: string;
    total_points: number;
  } | null;
  created_by_user?: {
    id: string;
    full_name: string | null;
  } | null;
}

// Request types for actions
export interface AddPointsRequest {
  user_id: string;
  points: number;
  transaction_type: PointsTransactionType;
  notes?: string;
  activity_id?: string;
  attendance_id?: string;
  trip_id?: string;
  order_id?: string;
}

export interface TeacherAdjustmentRequest {
  user_id: string;
  points: number;  // Positive to add, negative to deduct
  notes: string;   // Required for teacher adjustments
}

// Response types
export interface StudentPointsSummary {
  balance: StudentPointsBalance | null;
  recent_transactions: PointsTransaction[];
  points_by_type: {
    activity: number;
    attendance: number;
    trips: number;
    adjustments: number;
    store: number;
  };
}

// Church config form
export interface ChurchPointsConfigFormData {
  attendance_points_present: number;
  attendance_points_late: number;
  attendance_points_excused: number;
  attendance_points_absent: number;
  trip_participation_points: number;
  max_teacher_adjustment: number;
  is_attendance_points_enabled: boolean;
  is_trip_points_enabled: boolean;
  is_teacher_adjustment_enabled: boolean;
}
