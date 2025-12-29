-- =====================================================
-- TRIP CLASSES MIGRATION
-- =====================================================
-- This migration creates the trip_classes table
-- to manage class associations for trips
-- =====================================================

-- Create trip_classes junction table for trips and classes (many-to-many)
CREATE TABLE IF NOT EXISTS public.trip_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, class_id)
);

-- Enable RLS
ALTER TABLE public.trip_classes ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS trip_classes_trip_id_idx ON public.trip_classes(trip_id);
CREATE INDEX IF NOT EXISTS trip_classes_class_id_idx ON public.trip_classes(class_id);

-- RLS Policies for trip_classes
CREATE POLICY "Users can view trip-class associations"
  ON public.trip_classes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trip-class associations"
  ON public.trip_classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      JOIN public.users ON users.id = trips.created_by
      WHERE trips.id = trip_classes.trip_id
      AND users.role IN ('super_admin', 'diocese_admin', 'church_admin')
    )
  );

-- Comments
COMMENT ON TABLE public.trip_classes IS 'Junction table for trips and classes (many-to-many relationship)';

