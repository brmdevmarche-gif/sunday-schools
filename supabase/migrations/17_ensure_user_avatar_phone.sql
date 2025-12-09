-- =====================================================
-- ENSURE AVATAR_URL AND PHONE COLUMNS EXIST IN USERS TABLE
-- =====================================================
-- This migration ensures that avatar_url and phone columns exist in the users table

-- Add avatar_url column if it doesn't exist
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add phone column if it doesn't exist
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index on phone for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS users_phone_idx ON public.users(phone);

-- Verify columns exist
DO $$
BEGIN
  -- Check avatar_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'avatar_url'
  ) THEN
    RAISE EXCEPTION 'avatar_url column was not added successfully';
  END IF;

  -- Check phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'phone'
  ) THEN
    RAISE EXCEPTION 'phone column was not added successfully';
  END IF;

  RAISE NOTICE 'avatar_url and phone columns exist in users table';
END $$;

-- Add comment
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile avatar image';
COMMENT ON COLUMN public.users.phone IS 'User phone number for contact purposes';
