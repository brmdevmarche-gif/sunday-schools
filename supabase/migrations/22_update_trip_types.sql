-- =====================================================
-- UPDATE TRIP TYPES
-- =====================================================
-- This migration updates the trip_type column to use new values
-- =====================================================

-- Step 1: Drop the existing check constraint first
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_trip_type_check;

-- Step 2: Migrate existing data from old trip types to new ones
UPDATE public.trips SET trip_type = 'fun' WHERE trip_type = 'funny';
UPDATE public.trips SET trip_type = 'one_day' WHERE trip_type = 'event';
UPDATE public.trips SET trip_type = 'other' WHERE trip_type = 'learning';

-- Step 3: Add the new check constraint with updated trip types
ALTER TABLE public.trips
ADD CONSTRAINT trips_trip_type_check
CHECK (trip_type IN ('one_day', 'spiritual', 'volunteering', 'fun', 'retreat', 'carnival', 'tournament', 'other'));

-- Step 4: Update the column comment
COMMENT ON COLUMN public.trips.trip_type IS 'Type of trip: one_day, spiritual, volunteering, fun, retreat, carnival, tournament, or other';
