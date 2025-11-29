-- Fix: Add missing columns to churches and classes tables
-- Run this in Supabase SQL Editor

-- Add missing columns to churches table
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS churches_created_by_idx ON public.churches(created_by);

-- Add missing columns to classes table
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS classes_created_by_idx ON public.classes(created_by);

-- Verify columns were added to churches
SELECT 'Churches table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'churches'
  AND column_name IN ('id', 'name', 'diocese_id', 'description', 'created_by', 'created_at')
ORDER BY ordinal_position;

-- Verify columns were added to classes
SELECT 'Classes table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'classes'
  AND column_name IN ('id', 'name', 'church_id', 'description', 'created_by', 'created_at')
ORDER BY ordinal_position;

-- Success message
SELECT '✅ created_by columns added successfully!' as status;
