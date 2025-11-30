-- =====================================================
-- ADD USER SETTINGS TABLE
-- =====================================================
-- This migration adds a user_settings table for storing
-- user preferences like language, theme, and date format
-- =====================================================

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar', 'fr', 'es')),
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  date_format TEXT DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  timezone TEXT DEFAULT 'UTC',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all settings
CREATE POLICY "Admins can view all settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin'));

-- Updated at trigger
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- Create backups log table
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'scheduled', 'automatic')),
  backup_status TEXT NOT NULL CHECK (backup_status IN ('started', 'completed', 'failed')),
  file_size_bytes BIGINT,
  file_path TEXT,
  created_by UUID REFERENCES public.users(id),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view backup logs
CREATE POLICY "Super admins can view backup logs"
  ON public.backup_logs FOR SELECT
  TO authenticated
  USING (get_user_role() = 'super_admin');

CREATE POLICY "Super admins can create backup logs"
  ON public.backup_logs FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'super_admin');

-- Indexes
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS backup_logs_created_at_idx ON public.backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS backup_logs_created_by_idx ON public.backup_logs(created_by);
