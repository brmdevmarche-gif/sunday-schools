-- Migration: Update special offer to support 3 prices (normal, mastor, botl)
-- Created: 2026-01-XX

-- Drop the old single special_price column and add 3 new columns
ALTER TABLE public.store_items
DROP COLUMN IF EXISTS special_price,
ADD COLUMN IF NOT EXISTS special_price_normal INTEGER,
ADD COLUMN IF NOT EXISTS special_price_mastor INTEGER,
ADD COLUMN IF NOT EXISTS special_price_botl INTEGER;

-- Update comments
COMMENT ON COLUMN public.store_items.special_price_normal IS 'Special offer price for normal tier (points). When active, this overrides tier pricing.';
COMMENT ON COLUMN public.store_items.special_price_mastor IS 'Special offer price for mastor tier (points). When active, this overrides tier pricing.';
COMMENT ON COLUMN public.store_items.special_price_botl IS 'Special offer price for botl tier (points). When active, this overrides tier pricing.';

-- Update the index to use the new columns
DROP INDEX IF EXISTS idx_store_items_special_offer_window;

CREATE INDEX IF NOT EXISTS idx_store_items_special_offer_window
  ON public.store_items (special_price_start_at, special_price_end_at)
  WHERE special_price_normal IS NOT NULL OR special_price_mastor IS NOT NULL OR special_price_botl IS NOT NULL;
