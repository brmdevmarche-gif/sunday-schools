-- Migration: Add price_tier column to users table
-- This allows assigning a pricing tier (normal, mastor, botl) to students

-- Add price_tier column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS price_tier TEXT DEFAULT 'normal' CHECK (price_tier IN ('normal', 'mastor', 'botl'));

-- Add comment
COMMENT ON COLUMN public.users.price_tier IS 'Pricing tier for the user: normal, mastor, botl';
