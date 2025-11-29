-- Create login_history table to track all login attempts
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

-- Enable Row Level Security
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own login history
CREATE POLICY "Users can view their own login history"
ON public.login_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own login records
CREATE POLICY "Users can insert their own login history"
ON public.login_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow anonymous users to log failed login attempts
CREATE POLICY "Allow logging of failed login attempts"
ON public.login_history
FOR INSERT
TO anon
WITH CHECK (success = false);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS login_history_user_id_idx ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS login_history_created_at_idx ON public.login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS login_history_user_created_idx ON public.login_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS login_history_success_idx ON public.login_history(success);

-- Function to clean up old login history (optional, keeps last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.login_history
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: You can set up a cron job in Supabase to run cleanup_old_login_history() periodically
