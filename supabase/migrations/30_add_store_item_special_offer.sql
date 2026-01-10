-- Migration: Add special offer pricing window to store items
-- Created: 2026-01-08

ALTER TABLE public.store_items
ADD COLUMN IF NOT EXISTS special_price INTEGER,
ADD COLUMN IF NOT EXISTS special_price_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS special_price_end_at TIMESTAMPTZ;

COMMENT ON COLUMN public.store_items.special_price IS 'Special offer price (points). When active, this overrides tier pricing.';
COMMENT ON COLUMN public.store_items.special_price_start_at IS 'Special offer start datetime (UTC).';
COMMENT ON COLUMN public.store_items.special_price_end_at IS 'Special offer end datetime (UTC).';

-- Helpful index for filtering/reporting by special offer windows
CREATE INDEX IF NOT EXISTS idx_store_items_special_offer_window
  ON public.store_items (special_price_start_at, special_price_end_at)
  WHERE special_price IS NOT NULL;


