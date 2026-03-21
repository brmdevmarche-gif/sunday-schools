-- =====================================================
-- DATA RETENTION POLICY
-- =====================================================
-- Automated cleanup of old data per retention periods.
-- Run via pg_cron or manual invocation.
-- =====================================================

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb := '{}'::jsonb;
  _count integer;
BEGIN
  -- 1. Rate limit entries older than 1 hour
  DELETE FROM public.rate_limit_entries
  WHERE created_at < now() - interval '1 hour';
  GET DIAGNOSTICS _count = ROW_COUNT;
  _result := _result || jsonb_build_object('rate_limit_entries', _count);

  -- 2. Login history older than 90 days
  DELETE FROM public.login_history
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS _count = ROW_COUNT;
  _result := _result || jsonb_build_object('login_history', _count);

  -- 3. Notification records older than 60 days (read notifications only)
  DELETE FROM public.notifications
  WHERE is_read = true
  AND created_at < now() - interval '60 days';
  GET DIAGNOSTICS _count = ROW_COUNT;
  _result := _result || jsonb_build_object('read_notifications', _count);

  -- 4. Announcement views older than 1 year
  DELETE FROM public.announcement_views
  WHERE viewed_at < now() - interval '1 year';
  GET DIAGNOSTICS _count = ROW_COUNT;
  _result := _result || jsonb_build_object('announcement_views', _count);

  -- 5. Audit logs older than 2 years (retain for compliance, then purge)
  DELETE FROM public.audit_log
  WHERE created_at < now() - interval '2 years';
  GET DIAGNOSTICS _count = ROW_COUNT;
  _result := _result || jsonb_build_object('audit_log', _count);

  -- Log the cleanup run itself
  INSERT INTO public.audit_log (action, table_name, new_data)
  VALUES ('CLEANUP', 'data_retention', _result);

  RETURN _result;
END;
$$;

-- Schedule note: If using Supabase pg_cron extension, enable and schedule:
-- SELECT cron.schedule('data-retention-cleanup', '0 3 * * *', 'SELECT public.cleanup_expired_data()');
-- This runs daily at 3 AM UTC.

-- Retention periods summary:
-- | Data                  | Retention | Reason                          |
-- |-----------------------|-----------|---------------------------------|
-- | rate_limit_entries    | 1 hour    | Ephemeral, only needed for window |
-- | login_history         | 90 days   | Security audit trail            |
-- | read notifications    | 60 days   | UX cleanup, unread kept forever |
-- | announcement_views    | 1 year    | Analytics, not security-critical|
-- | audit_log             | 2 years   | SOC 2 compliance minimum        |
