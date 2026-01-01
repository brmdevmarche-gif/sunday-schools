-- =====================================================
-- DEBUG: Check current trip types
-- =====================================================
-- Run this first to see what values exist:
SELECT trip_type, COUNT(*) as count
FROM public.trips
GROUP BY trip_type;

-- =====================================================
-- STEP-BY-STEP MIGRATION
-- =====================================================
-- Run each section separately in order:

-- ========== STEP 1: Drop constraint ==========
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_trip_type_check;

-- ========== STEP 2: Check for NULL or unexpected values ==========
-- Run this to see if there are any NULL or unexpected values:
SELECT trip_type, COUNT(*)
FROM public.trips
WHERE trip_type NOT IN ('event', 'funny', 'learning')
   OR trip_type IS NULL
GROUP BY trip_type;

-- ========== STEP 3: Handle NULL values if any ==========
-- Update NULL values to 'other' (uncomment if needed)
-- UPDATE public.trips SET trip_type = 'other' WHERE trip_type IS NULL;

-- ========== STEP 4: Migrate existing data ==========
UPDATE public.trips SET trip_type = 'fun' WHERE trip_type = 'funny';
UPDATE public.trips SET trip_type = 'one_day' WHERE trip_type = 'event';
UPDATE public.trips SET trip_type = 'other' WHERE trip_type = 'learning';

-- ========== STEP 5: Verify migration ==========
-- Check that all values are now valid:
SELECT trip_type, COUNT(*)
FROM public.trips
GROUP BY trip_type;

-- ========== STEP 6: Add new constraint ==========
-- Only run this after verifying all values are correct!
ALTER TABLE public.trips
ADD CONSTRAINT trips_trip_type_check
CHECK (trip_type IN ('one_day', 'spiritual', 'volunteering', 'fun', 'retreat', 'carnival', 'tournament', 'other'));

-- ========== STEP 7: Update comment ==========
COMMENT ON COLUMN public.trips.trip_type IS 'Type of trip: one_day, spiritual, volunteering, fun, retreat, carnival, tournament, or other';
