-- =====================================================
-- TRIPS SYSTEM MIGRATION
-- =====================================================
-- This migration enhances the trips table with new fields
-- and creates trip_destinations table for multiple destinations
-- Supports multiple churches and dioceses like store items
-- =====================================================

-- Drop old RLS policies that depend on columns we're about to drop
DROP POLICY IF EXISTS "Users can view destinations for published trips in their church" ON public.trip_destinations;
DROP POLICY IF EXISTS "Church admins can manage destinations for their trips" ON public.trip_destinations;

-- Drop old columns if they exist (one at a time)
ALTER TABLE public.trips DROP COLUMN IF EXISTS trip_date;
ALTER TABLE public.trips DROP COLUMN IF EXISTS trip_time;
ALTER TABLE public.trips DROP COLUMN IF EXISTS duration_hours;
ALTER TABLE public.trips DROP COLUMN IF EXISTS time_to_go;
ALTER TABLE public.trips DROP COLUMN IF EXISTS time_to_back;
ALTER TABLE public.trips DROP COLUMN IF EXISTS return_date;
ALTER TABLE public.trips DROP COLUMN IF EXISTS departure_time;
ALTER TABLE public.trips DROP COLUMN IF EXISTS return_time;
ALTER TABLE public.trips DROP COLUMN IF EXISTS cost;
ALTER TABLE public.trips DROP COLUMN IF EXISTS status;
ALTER TABLE public.trips DROP COLUMN IF EXISTS is_published;

-- Add new columns
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trip_type TEXT CHECK (trip_type IN ('event', 'funny', 'learning')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'started', 'ended', 'canceled', 'soldout')),
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS price_normal DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_mastor DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_botl DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing trips to have default status and available
UPDATE public.trips SET status = 'active' WHERE status IS NULL;
UPDATE public.trips SET available = true WHERE available IS NULL;

-- Drop old church_id column (we'll use junction table instead)
-- But keep it for now for backward compatibility, we'll remove it later if needed
-- ALTER TABLE public.trips DROP COLUMN IF EXISTS church_id;

-- Create trip_destinations table for multiple destinations
CREATE TABLE IF NOT EXISTS public.trip_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  destination_name TEXT NOT NULL,
  description TEXT,
  visit_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop old location columns if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_destinations' AND column_name = 'location_name') THEN
    ALTER TABLE public.trip_destinations DROP COLUMN location_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_destinations' AND column_name = 'location_address') THEN
    ALTER TABLE public.trip_destinations DROP COLUMN location_address;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_destinations' AND column_name = 'location_description') THEN
    ALTER TABLE public.trip_destinations DROP COLUMN location_description;
  END IF;
END $$;

-- Create junction table for trips and churches (many-to-many)
CREATE TABLE IF NOT EXISTS public.trip_churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, church_id)
);

-- Create junction table for trips and dioceses (many-to-many)
CREATE TABLE IF NOT EXISTS public.trip_dioceses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  diocese_id UUID NOT NULL REFERENCES public.dioceses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, diocese_id)
);

-- Enable RLS for new tables
ALTER TABLE public.trip_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_dioceses ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS trip_destinations_trip_id_idx ON public.trip_destinations(trip_id);
CREATE INDEX IF NOT EXISTS trips_status_idx ON public.trips(status);
CREATE INDEX IF NOT EXISTS trips_trip_type_idx ON public.trips(trip_type);
CREATE INDEX IF NOT EXISTS trips_start_datetime_idx ON public.trips(start_datetime);
CREATE INDEX IF NOT EXISTS trips_end_datetime_idx ON public.trips(end_datetime);
CREATE INDEX IF NOT EXISTS trips_available_idx ON public.trips(available);
CREATE INDEX IF NOT EXISTS trip_churches_trip_id_idx ON public.trip_churches(trip_id);
CREATE INDEX IF NOT EXISTS trip_churches_church_id_idx ON public.trip_churches(church_id);
CREATE INDEX IF NOT EXISTS trip_dioceses_trip_id_idx ON public.trip_dioceses(trip_id);
CREATE INDEX IF NOT EXISTS trip_dioceses_diocese_id_idx ON public.trip_dioceses(diocese_id);

-- Add approval_status to trip_participants (if not exists)
ALTER TABLE public.trip_participants
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Update existing trip_participants to have default approval_status
UPDATE public.trip_participants SET approval_status = 'pending' WHERE approval_status IS NULL;

-- Create index for approval_status
CREATE INDEX IF NOT EXISTS trip_participants_approval_status_idx ON public.trip_participants(approval_status);
CREATE INDEX IF NOT EXISTS trip_participants_payment_status_idx ON public.trip_participants(payment_status);

-- RLS Policies for trip_destinations (policies already dropped earlier, just create new ones)
CREATE POLICY "Users can view destinations for available trips"
  ON public.trip_destinations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.available = true
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

-- RLS Policies for trip_churches
CREATE POLICY "Users can view trip-church associations"
  ON public.trip_churches FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trip-church associations"
  ON public.trip_churches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      JOIN public.users ON users.id = trips.created_by
      WHERE trips.id = trip_churches.trip_id
      AND users.role IN ('super_admin', 'diocese_admin', 'church_admin')
    )
  );

-- RLS Policies for trip_dioceses
CREATE POLICY "Users can view trip-diocese associations"
  ON public.trip_dioceses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage trip-diocese associations"
  ON public.trip_dioceses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      JOIN public.users ON users.id = trips.created_by
      WHERE trips.id = trip_dioceses.trip_id
      AND users.role IN ('super_admin', 'diocese_admin')
    )
  );

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
COMMENT ON TABLE public.trip_destinations IS 'Multiple destinations for a trip';
COMMENT ON COLUMN public.trips.trip_type IS 'Type of trip: event, funny, or learning';
COMMENT ON COLUMN public.trips.status IS 'Trip status: active, started, ended, canceled, soldout';
COMMENT ON COLUMN public.trips.available IS 'Whether the trip is available for subscription';
COMMENT ON COLUMN public.trips.start_datetime IS 'Trip start date and time';
COMMENT ON COLUMN public.trips.end_datetime IS 'Trip end date and time';
COMMENT ON COLUMN public.trip_participants.approval_status IS 'Admin approval status for trip participation';
