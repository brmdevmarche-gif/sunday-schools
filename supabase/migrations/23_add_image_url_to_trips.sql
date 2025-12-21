-- =====================================================
-- ADD IMAGE URL TO TRIPS
-- =====================================================
-- This migration adds image_url column to trips table
-- Following the same pattern as store_items
-- =====================================================

-- Add image_url column to trips table
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for image_url (optional, for faster lookups if needed)
CREATE INDEX IF NOT EXISTS trips_image_url_idx ON public.trips(image_url) WHERE image_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.trips.image_url IS 'URL of the trip image, similar to store_items.image_url';
