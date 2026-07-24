-- =====================================================
-- ADD IS_ACTIVE TO USER_RELATIONSHIPS
-- Migration: 42_add_user_relationships_is_active.sql
-- =====================================================

-- Add is_active column to user_relationships table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_relationships'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.user_relationships
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Add index for is_active column
CREATE INDEX IF NOT EXISTS idx_user_relationships_is_active
ON public.user_relationships(is_active);

-- Update the is_parent_of function to handle both cases (with and without is_active)
CREATE OR REPLACE FUNCTION is_parent_of(student_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_relationships ur
    WHERE ur.parent_id = auth.uid()
    AND ur.student_id = student_uuid
    AND ur.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
