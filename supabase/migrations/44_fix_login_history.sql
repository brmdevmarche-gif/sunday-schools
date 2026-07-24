-- Fix login_history table and policies for accurate tracking
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT,
  location TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure column types are TEXT if table already existed with different types
ALTER TABLE public.login_history ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;
ALTER TABLE public.login_history ALTER COLUMN device_info TYPE TEXT USING device_info::TEXT;

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can insert own login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can view their own login history" ON public.login_history;
DROP POLICY IF EXISTS "Users can insert their own login history" ON public.login_history;
DROP POLICY IF EXISTS "Allow logging of failed login attempts" ON public.login_history;
DROP POLICY IF EXISTS "Allow inserting login history" ON public.login_history;
DROP POLICY IF EXISTS "Allow users to view own login history" ON public.login_history;

-- Allow inserting login history for all login attempts (success or failure, anon or authenticated)
CREATE POLICY "Allow inserting login history"
  ON public.login_history FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own login history, and admins to view all
CREATE POLICY "Allow users to view own login history"
  ON public.login_history FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'diocese_admin', 'church_admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS login_history_user_id_idx ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS login_history_created_at_idx ON public.login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS login_history_success_idx ON public.login_history(success);
