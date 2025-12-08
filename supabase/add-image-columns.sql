-- Add image and theme columns to dioceses and churches
-- Run this in your Supabase Dashboard > SQL Editor

-- Add columns to dioceses table
ALTER TABLE public.dioceses
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_image_url TEXT,
  ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT DEFAULT '#8b5cf6',
  ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT '#ec4899',
  ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{}';

-- Add columns to churches table
ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_image_url TEXT;

-- Verify columns were added
SELECT
  'dioceses' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dioceses'
  AND column_name IN ('cover_image_url', 'logo_image_url', 'theme_primary_color', 'theme_secondary_color', 'theme_accent_color', 'theme_settings')

UNION ALL

SELECT
  'churches' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'churches'
  AND column_name IN ('cover_image_url', 'logo_image_url');
