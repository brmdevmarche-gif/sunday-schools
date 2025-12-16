-- =====================================================
-- Wishlist System
-- =====================================================
-- This migration creates a table for user wishlists

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User who added the item
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Store item in wishlist
  store_item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one item per user (unique constraint)
  UNIQUE(user_id, store_item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_store_item_id ON public.wishlist(store_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON public.wishlist(created_at DESC);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- ====================
-- RLS POLICIES: WISHLIST
-- ====================

-- SELECT: Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
  ON public.wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can add items to their own wishlist
CREATE POLICY "Users can add to own wishlist"
  ON public.wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can remove items from their own wishlist
CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.wishlist IS 'User wishlist items for store';
COMMENT ON COLUMN public.wishlist.user_id IS 'User who added the item to wishlist';
COMMENT ON COLUMN public.wishlist.store_item_id IS 'Store item in wishlist';


