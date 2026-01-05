-- Migration: Add user_code column to users table
-- This provides a short, human-friendly identifier for login and search

-- Add user_code column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_code TEXT UNIQUE;

-- Create a function to generate unique user codes
CREATE OR REPLACE FUNCTION generate_user_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-digit numeric code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check if this code already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE user_code = new_code) INTO code_exists;

    -- If unique, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate user_code for new users
CREATE OR REPLACE FUNCTION set_user_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_code IS NULL THEN
    NEW.user_code := generate_user_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_user_code ON public.users;
CREATE TRIGGER trigger_set_user_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_code();

-- Generate user_code for existing users that don't have one
UPDATE public.users
SET user_code = generate_user_code()
WHERE user_code IS NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_user_code ON public.users(user_code);

-- Add comment
COMMENT ON COLUMN public.users.user_code IS 'Short unique identifier for login and search (6-digit code)';
