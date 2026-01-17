-- =====================================================
-- ADD AMOUNT_PAID TO TRIP_PARTICIPANTS
-- Migration: 45_add_amount_paid_to_trip_participants.sql
-- =====================================================
-- Adds amount_paid column to track how much has been paid
-- for partial payments

-- Add amount_paid column if it doesn't exist
ALTER TABLE public.trip_participants
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;

-- Update existing records: if payment_status is 'paid', set amount_paid to trip price
-- We'll need to calculate this based on user's price tier
-- For now, we'll leave it at 0 and it will be updated on next payment action

-- Add comment
COMMENT ON COLUMN public.trip_participants.amount_paid IS 
  'Amount paid so far for this trip participation (for partial payments)';

-- Create index for amount_paid queries
CREATE INDEX IF NOT EXISTS trip_participants_amount_paid_idx 
ON public.trip_participants(amount_paid);
