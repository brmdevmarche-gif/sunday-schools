-- =====================================================
-- ADD IMAGES AND THEME CUSTOMIZATION
-- =====================================================
-- This migration adds image and theme support for
-- dioceses and churches
-- =====================================================

-- First, ensure user_settings and backup_logs exist
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

-- Add image and theme columns to dioceses table
ALTER TABLE public.dioceses
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_image_url TEXT,
  ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT DEFAULT '#8b5cf6',
  ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT '#ec4899',
  ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{}';

-- Add image columns to churches table
ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_image_url TEXT;

-- Enable RLS on new tables if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_settings'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'backup_logs'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- RLS Policies for user_settings (only create if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings'
    AND policyname = 'Users can view own settings'
  ) THEN
    CREATE POLICY "Users can view own settings"
      ON public.user_settings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings'
    AND policyname = 'Users can update own settings'
  ) THEN
    CREATE POLICY "Users can update own settings"
      ON public.user_settings FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings'
    AND policyname = 'Users can insert own settings'
  ) THEN
    CREATE POLICY "Users can insert own settings"
      ON public.user_settings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings'
    AND policyname = 'Admins can view all settings'
  ) THEN
    CREATE POLICY "Admins can view all settings"
      ON public.user_settings FOR SELECT
      TO authenticated
      USING (get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin'));
  END IF;
END $$;

-- RLS Policies for backup_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'backup_logs'
    AND policyname = 'Super admins can view backup logs'
  ) THEN
    CREATE POLICY "Super admins can view backup logs"
      ON public.backup_logs FOR SELECT
      TO authenticated
      USING (get_user_role() = 'super_admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'backup_logs'
    AND policyname = 'Super admins can create backup logs'
  ) THEN
    CREATE POLICY "Super admins can create backup logs"
      ON public.backup_logs FOR INSERT
      TO authenticated
      WITH CHECK (get_user_role() = 'super_admin');
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS backup_logs_created_at_idx ON public.backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS backup_logs_created_by_idx ON public.backup_logs(created_by);

-- Auto-create settings for new users (function and trigger)
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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_user_created_settings ON public.users;
CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();

-- Update trigger for user_settings
DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comment on new columns
COMMENT ON COLUMN public.dioceses.cover_image_url IS 'URL to cover/hero image for diocese';
COMMENT ON COLUMN public.dioceses.logo_image_url IS 'URL to logo image for diocese';
COMMENT ON COLUMN public.dioceses.theme_primary_color IS 'Primary theme color (hex)';
COMMENT ON COLUMN public.dioceses.theme_secondary_color IS 'Secondary theme color (hex)';
COMMENT ON COLUMN public.dioceses.theme_accent_color IS 'Accent theme color (hex)';
COMMENT ON COLUMN public.dioceses.theme_settings IS 'Additional theme customization settings';

COMMENT ON COLUMN public.churches.cover_image_url IS 'URL to cover/hero image for church';
COMMENT ON COLUMN public.churches.logo_image_url IS 'URL to logo image for church';
