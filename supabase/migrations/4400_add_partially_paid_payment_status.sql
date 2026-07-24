-- =====================================================
-- ADD PARTIALLY_PAID TO PAYMENT STATUS
-- Migration: 44_add_partially_paid_payment_status.sql
-- =====================================================
-- Updates the payment_status constraint in trip_participants
-- to include 'partially_paid' status

-- Drop the existing check constraint
ALTER TABLE public.trip_participants
DROP CONSTRAINT IF EXISTS trip_participants_payment_status_check;

-- Add the new constraint with partially_paid
ALTER TABLE public.trip_participants
ADD CONSTRAINT trip_participants_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded'));

-- Update the comment
COMMENT ON COLUMN public.trip_participants.payment_status IS 
  'Payment status: pending, paid, partially_paid, or refunded';
