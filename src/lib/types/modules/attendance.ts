// =====================================================
// ATTENDANCE TYPES
// =====================================================
// Attendance tracking and records
// =====================================================

// =====================================================
// ATTENDANCE ENUMS
// =====================================================

export type AttendanceStatus = "present" | "absent" | "excused" | "late";

// =====================================================
// ATTENDANCE
// =====================================================

export interface Attendance {
  id: string;
  class_id: string | null;
  user_id: string | null;
  lesson_id: string | null;
  attendance_date: string;
  status: AttendanceStatus | null;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
}

// =====================================================
// ATTENDANCE INPUT TYPES
// =====================================================

export interface CreateAttendanceInput {
  class_id: string;
  user_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  lesson_id?: string;
  notes?: string;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  notes?: string;
  lesson_id?: string;
}

// =====================================================
// EXTENDED ATTENDANCE TYPES
// =====================================================

export interface AttendanceWithUser extends Attendance {
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface AttendanceRecord {
  user_id: string;
  user_name: string;
  user_email: string;
  status: AttendanceStatus;
  notes?: string;
}
