-- =====================================================
-- TRIP ORGANIZERS MIGRATION
-- =====================================================
-- This migration creates the trip_organizers table
-- to manage organizers (teachers/staff) for trips
-- with role-based permissions
-- =====================================================

-- Create trip_organizers table
CREATE TABLE IF NOT EXISTS public.trip_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  can_approve BOOLEAN DEFAULT false,
  can_go BOOLEAN DEFAULT false,
  can_take_attendance BOOLEAN DEFAULT false,
  can_collect_payment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Enable RLS
ALTER TABLE public.trip_organizers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS trip_organizers_trip_id_idx ON public.trip_organizers(trip_id);
CREATE INDEX IF NOT EXISTS trip_organizers_user_id_idx ON public.trip_organizers(user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.handle_trip_organizers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_trip_organizers_updated_at
  BEFORE UPDATE ON public.trip_organizers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trip_organizers_updated_at();

-- RLS Policies for trip_organizers
CREATE POLICY "Users can view trip organizers for trips they can view"
  ON public.trip_organizers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_organizers.trip_id
      AND trips.available = true
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

CREATE POLICY "Admins can manage trip organizers"
  ON public.trip_organizers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      JOIN public.users ON users.id = trips.created_by
      WHERE trips.id = trip_organizers.trip_id
      AND (
        users.role IN ('super_admin', 'diocese_admin', 'church_admin')
        OR trips.created_by = auth.uid()
      )
    )
  );

-- Comments
COMMENT ON TABLE public.trip_organizers IS 'Organizers (teachers/staff) assigned to trips with role-based permissions';
COMMENT ON COLUMN public.trip_organizers.can_approve IS 'Can approve trip participants';
COMMENT ON COLUMN public.trip_organizers.can_go IS 'Can participate in the trip';
COMMENT ON COLUMN public.trip_organizers.can_take_attendance IS 'Can take attendance for the trip';
COMMENT ON COLUMN public.trip_organizers.can_collect_payment IS 'Can collect payments for the trip';

