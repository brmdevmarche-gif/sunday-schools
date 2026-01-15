-- Migration: Create store_item_special_offers table for multiple special offers per item
-- Created: 2026-01-XX
-- This replaces the single special_price columns in store_items with a flexible array-based system

-- Drop existing triggers and functions if they exist (to allow re-running migration)
DROP TRIGGER IF EXISTS prevent_overlapping_offers ON public.store_item_special_offers;
DROP TRIGGER IF EXISTS prevent_duplicate_prices ON public.store_item_special_offers;
DROP TRIGGER IF EXISTS update_store_item_special_offers_updated_at ON public.store_item_special_offers;
DROP FUNCTION IF EXISTS check_no_overlapping_offers();
DROP FUNCTION IF EXISTS check_no_duplicate_prices();
DROP FUNCTION IF EXISTS update_store_item_special_offers_updated_at();

-- Drop the table if it exists (to allow clean re-creation)
DROP TABLE IF EXISTS public.store_item_special_offers CASCADE;

-- Create the special offers table
CREATE TABLE public.store_item_special_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  
  -- Tier-specific special prices (at least one must be set)
  special_price_normal INTEGER,
  special_price_mastor INTEGER,
  special_price_botl INTEGER,
  
  -- Duration window
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT store_item_special_offers_valid_range CHECK (end_at > start_at),
  CONSTRAINT store_item_special_offers_at_least_one_price CHECK (
    special_price_normal IS NOT NULL 
    OR special_price_mastor IS NOT NULL 
    OR special_price_botl IS NOT NULL
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_item_special_offers_store_item_id 
  ON public.store_item_special_offers(store_item_id);
CREATE INDEX IF NOT EXISTS idx_store_item_special_offers_window 
  ON public.store_item_special_offers(start_at, end_at);

-- Enable RLS
ALTER TABLE public.store_item_special_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view special offers"
  ON public.store_item_special_offers FOR SELECT
  TO authenticated
  USING (true);

-- Function to check for overlapping date ranges (same item)
CREATE OR REPLACE FUNCTION check_no_overlapping_offers()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's an overlapping offer for the same item
  IF EXISTS (
    SELECT 1 FROM public.store_item_special_offers
    WHERE store_item_id = NEW.store_item_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (start_at <= NEW.start_at AND end_at > NEW.start_at)
        OR (start_at < NEW.end_at AND end_at >= NEW.end_at)
        OR (start_at >= NEW.start_at AND end_at <= NEW.end_at)
      )
  ) THEN
    RAISE EXCEPTION 'Special offer date ranges cannot overlap for the same item';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent overlapping offers
CREATE TRIGGER prevent_overlapping_offers
  BEFORE INSERT OR UPDATE ON public.store_item_special_offers
  FOR EACH ROW
  EXECUTE FUNCTION check_no_overlapping_offers();

-- Function to check for duplicate prices (same tier, same item)
CREATE OR REPLACE FUNCTION check_no_duplicate_prices()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for duplicate normal price
  IF NEW.special_price_normal IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.store_item_special_offers
    WHERE store_item_id = NEW.store_item_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND special_price_normal = NEW.special_price_normal
  ) THEN
    RAISE EXCEPTION 'Duplicate special_price_normal value for this item. Each tier price must be unique.';
  END IF;
  
  -- Check for duplicate mastor price
  IF NEW.special_price_mastor IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.store_item_special_offers
    WHERE store_item_id = NEW.store_item_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND special_price_mastor = NEW.special_price_mastor
  ) THEN
    RAISE EXCEPTION 'Duplicate special_price_mastor value for this item. Each tier price must be unique.';
  END IF;
  
  -- Check for duplicate botl price
  IF NEW.special_price_botl IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.store_item_special_offers
    WHERE store_item_id = NEW.store_item_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND special_price_botl = NEW.special_price_botl
  ) THEN
    RAISE EXCEPTION 'Duplicate special_price_botl value for this item. Each tier price must be unique.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent duplicate prices
CREATE TRIGGER prevent_duplicate_prices
  BEFORE INSERT OR UPDATE ON public.store_item_special_offers
  FOR EACH ROW
  EXECUTE FUNCTION check_no_duplicate_prices();

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_store_item_special_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_item_special_offers_updated_at
  BEFORE UPDATE ON public.store_item_special_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_store_item_special_offers_updated_at();

-- Comments
COMMENT ON TABLE public.store_item_special_offers IS 'Special pricing offers for store items. Each offer has tier-specific prices and a duration window.';
COMMENT ON COLUMN public.store_item_special_offers.special_price_normal IS 'Special offer price for normal tier (points). Nullable.';
COMMENT ON COLUMN public.store_item_special_offers.special_price_mastor IS 'Special offer price for mastor tier (points). Nullable.';
COMMENT ON COLUMN public.store_item_special_offers.special_price_botl IS 'Special offer price for botl tier (points). Nullable.';
COMMENT ON COLUMN public.store_item_special_offers.start_at IS 'Special offer start datetime (UTC).';
COMMENT ON COLUMN public.store_item_special_offers.end_at IS 'Special offer end datetime (UTC). Must be after start_at.';
