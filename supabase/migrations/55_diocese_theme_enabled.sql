-- Migration 55: Add theme_enabled flag to dioceses
-- When enabled, users in this diocese see the diocese's custom color theme

ALTER TABLE public.dioceses
  ADD COLUMN IF NOT EXISTS theme_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.dioceses.theme_enabled IS 'When true, users in this diocese see the custom color theme';
