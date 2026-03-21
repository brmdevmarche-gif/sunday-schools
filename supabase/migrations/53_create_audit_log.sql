-- =====================================================
-- SOC 2 AUDIT LOG
-- =====================================================
-- Immutable audit trail for all security-relevant mutations.
-- Captures who did what, when, and what changed.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- WHO
  user_id uuid REFERENCES public.users(id),
  user_role text,
  -- WHAT
  action text NOT NULL,           -- INSERT, UPDATE, DELETE
  table_name text NOT NULL,
  record_id text,                 -- primary key of affected row
  -- DETAILS
  old_data jsonb,                 -- previous state (for UPDATE/DELETE)
  new_data jsonb,                 -- new state (for INSERT/UPDATE)
  -- WHEN
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by user, table, and time range
CREATE INDEX idx_audit_log_user ON audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_log_table ON audit_log (table_name, created_at DESC);
CREATE INDEX idx_audit_log_created ON audit_log (created_at DESC);

-- RLS: only service_role can write; admins can read
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'diocese_admin')
    )
  );

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Only service_role (via triggers) can write to this table

-- =====================================================
-- TRIGGER FUNCTION
-- =====================================================
-- Generic audit trigger that can be attached to any table.
-- Captures the current user from auth.uid() and logs the change.

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_role text;
  _record_id text;
  _old_data jsonb;
  _new_data jsonb;
BEGIN
  -- Get current user info
  _user_id := auth.uid();

  IF _user_id IS NOT NULL THEN
    SELECT role INTO _user_role FROM public.users WHERE id = _user_id;
  END IF;

  -- Determine record ID and data based on operation
  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::text;
    _old_data := to_jsonb(OLD);
    _new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id::text;
    _old_data := NULL;
    _new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id::text;
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_log (user_id, user_role, action, table_name, record_id, old_data, new_data)
  VALUES (_user_id, _user_role, TG_OP, TG_TABLE_NAME, _record_id, _old_data, _new_data);

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- ATTACH TRIGGERS TO SENSITIVE TABLES
-- =====================================================

-- Users table (profile changes, role changes, deactivations)
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Roles and permissions (access control changes)
CREATE TRIGGER audit_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_role_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Diocese admin assignments
CREATE TRIGGER audit_diocese_admins
  AFTER INSERT OR UPDATE OR DELETE ON public.diocese_admins
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Announcements (content that reaches all users)
CREATE TRIGGER audit_announcements
  AFTER INSERT OR UPDATE OR DELETE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Financial: store orders and points
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_points_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.points_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Permissions table
CREATE TRIGGER audit_permissions
  AFTER INSERT OR UPDATE OR DELETE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
