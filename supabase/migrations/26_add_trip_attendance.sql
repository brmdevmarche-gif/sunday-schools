-- =====================================================
-- TRIP ATTENDANCE MIGRATION
-- =====================================================
-- This migration adds attendance tracking to trip_participants
-- =====================================================

-- Add attendance fields to trip_participants
ALTER TABLE public.trip_participants
ADD COLUMN IF NOT EXISTS attendance_status TEXT CHECK (attendance_status IN ('present', 'absent', 'excused', 'late')),
ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS attendance_marked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS attendance_notes TEXT;

-- Create index for attendance_status
CREATE INDEX IF NOT EXISTS trip_participants_attendance_status_idx ON public.trip_participants(attendance_status);

-- Comments
COMMENT ON COLUMN public.trip_participants.attendance_status IS 'Attendance status for the trip: present, absent, excused, or late';
COMMENT ON COLUMN public.trip_participants.attendance_marked_at IS 'When attendance was marked';
COMMENT ON COLUMN public.trip_participants.attendance_marked_by IS 'User who marked the attendance';
COMMENT ON COLUMN public.trip_participants.attendance_notes IS 'Notes about attendance';


