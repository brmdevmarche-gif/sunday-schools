-- =====================================================
-- ENHANCE TRIPS SYSTEM
-- =====================================================
-- This migration enhances the trips table with additional fields
-- and creates trip_destinations table for multiple destinations
-- =====================================================

-- Add new columns to trips table
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS trip_date DATE,
ADD COLUMN IF NOT EXISTS trip_time TIME,
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS time_to_go TIME,
ADD COLUMN IF NOT EXISTS time_to_back TIME,
ADD COLUMN IF NOT EXISTS trip_type TEXT CHECK (trip_type IN ('event', 'funny', 'learning')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'opened' CHECK (status IN ('opened', 'coming_soon', 'started', 'history', 'cancelled')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Update existing trips to have default status
UPDATE public.trips SET status = 'opened' WHERE status IS NULL;

-- Create trip_destinations table for multiple destinations
CREATE TABLE IF NOT EXISTS public.trip_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT,
  location_description TEXT,
  visit_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for trip_destinations
ALTER TABLE public.trip_destinations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS trip_destinations_trip_id_idx ON public.trip_destinations(trip_id);
CREATE INDEX IF NOT EXISTS trips_status_idx ON public.trips(status);
CREATE INDEX IF NOT EXISTS trips_trip_type_idx ON public.trips(trip_type);
CREATE INDEX IF NOT EXISTS trips_trip_date_idx ON public.trips(trip_date);

-- Add approval_status to trip_participants
ALTER TABLE public.trip_participants
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Update existing trip_participants to have default approval_status
UPDATE public.trip_participants SET approval_status = 'pending' WHERE approval_status IS NULL;

-- Create index for approval_status
CREATE INDEX IF NOT EXISTS trip_participants_approval_status_idx ON public.trip_participants(approval_status);
CREATE INDEX IF NOT EXISTS trip_participants_payment_status_idx ON public.trip_participants(payment_status);

-- RLS Policies for trip_destinations
CREATE POLICY "Users can view destinations for published trips in their church"
  ON public.trip_destinations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_destinations.trip_id
      AND (trips.is_published = true OR trips.created_by = auth.uid())
    )
  );

CREATE POLICY "Church admins can manage destinations for their trips"
  ON public.trip_destinations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      JOIN public.users ON users.id = trips.created_by
      WHERE trips.id = trip_destinations.trip_id
      AND (
        users.role IN ('super_admin', 'diocese_admin', 'church_admin')
        OR trips.created_by = auth.uid()
      )
    )
  );

-- Update RLS policies for trips table (if needed)
-- Note: These should already exist from 00_FRESH_DATABASE_SETUP.sql
-- But we'll ensure they're properly set

-- Updated at trigger for trips (if not exists)
CREATE OR REPLACE FUNCTION public.handle_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trips_updated_at ON public.trips;
CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trips_updated_at();

-- Comments
COMMENT ON TABLE public.trip_destinations IS 'Multiple destinations/locations for a trip';
COMMENT ON COLUMN public.trips.trip_type IS 'Type of trip: event, funny, or learning';
COMMENT ON COLUMN public.trips.status IS 'Trip status: opened, coming_soon, started, history, cancelled';
COMMENT ON COLUMN public.trips.duration_hours IS 'Duration of the trip in hours';
COMMENT ON COLUMN public.trip_participants.approval_status IS 'Admin approval status for trip participation';

