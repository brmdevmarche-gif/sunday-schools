-- =====================================================
-- MIGRATION: Diocese Admin Assignments
-- =====================================================
-- This migration creates a junction table to assign users
-- as administrators of specific dioceses.
-- Multiple users can be admins of the same diocese.
-- =====================================================

-- Create diocese_admins junction table
CREATE TABLE IF NOT EXISTS public.diocese_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diocese_id UUID NOT NULL REFERENCES public.dioceses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can only be assigned once per diocese
  UNIQUE(diocese_id, user_id)
);

-- Add comment explaining the table
COMMENT ON TABLE public.diocese_admins IS 'Junction table for assigning users as administrators of dioceses. Allows multiple admins per diocese.';

-- Enable RLS
ALTER TABLE public.diocese_admins ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS diocese_admins_diocese_id_idx ON public.diocese_admins(diocese_id);
CREATE INDEX IF NOT EXISTS diocese_admins_user_id_idx ON public.diocese_admins(user_id);
CREATE INDEX IF NOT EXISTS diocese_admins_is_active_idx ON public.diocese_admins(is_active);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_diocese_admins_updated_at ON public.diocese_admins;
CREATE TRIGGER set_diocese_admins_updated_at
  BEFORE UPDATE ON public.diocese_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RLS POLICIES FOR diocese_admins
-- =====================================================

-- Super admins can manage all diocese admin assignments
CREATE POLICY "Super admins can manage all diocese admin assignments"
  ON public.diocese_admins FOR ALL
  USING (public.is_super_admin());

-- Diocese admins can view other admins in their diocese
CREATE POLICY "Diocese admins can view admins in their diocese"
  ON public.diocese_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.diocese_admins da
      WHERE da.diocese_id = diocese_admins.diocese_id
        AND da.user_id = auth.uid()
        AND da.is_active = true
    )
  );

-- Users can view their own assignments
CREATE POLICY "Users can view their own diocese admin assignments"
  ON public.diocese_admins FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- UPDATE HELPER FUNCTIONS
-- =====================================================

-- Update is_diocese_admin function to check the new table
-- Using CREATE OR REPLACE to avoid dependency issues
CREATE OR REPLACE FUNCTION public.is_diocese_admin(diocese_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.diocese_admins
    WHERE diocese_id = diocese_uuid
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_diocese_admin(UUID) IS 'Check if the current user is an active admin of the specified diocese';

-- Create helper function to check if user is admin of any diocese
CREATE OR REPLACE FUNCTION public.is_any_diocese_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.diocese_admins
    WHERE user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_any_diocese_admin() IS 'Check if the current user is an admin of any diocese';

-- Get all dioceses where user is admin
CREATE OR REPLACE FUNCTION public.get_user_diocese_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT diocese_id
  FROM public.diocese_admins
  WHERE user_id = auth.uid()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_diocese_ids() IS 'Get all diocese IDs where the current user is an active admin';

-- =====================================================
-- UPDATE EXISTING POLICIES
-- =====================================================

-- Update diocese policies to work with new table
DROP POLICY IF EXISTS "Diocese admins can view their diocese" ON public.dioceses;

CREATE POLICY "Diocese admins can view their dioceses"
  ON public.dioceses FOR SELECT
  USING (
    public.is_super_admin() OR
    id IN (SELECT public.get_user_diocese_ids())
  );

CREATE POLICY "Diocese admins can update their dioceses"
  ON public.dioceses FOR UPDATE
  USING (
    public.is_super_admin() OR
    id IN (SELECT public.get_user_diocese_ids())
  );

-- Update churches policies
DROP POLICY IF EXISTS "Diocese admins can manage churches in their diocese" ON public.churches;

CREATE POLICY "Diocese admins can view churches in their dioceses"
  ON public.churches FOR SELECT
  USING (
    public.is_super_admin() OR
    diocese_id IN (SELECT public.get_user_diocese_ids())
  );

CREATE POLICY "Diocese admins can manage churches in their dioceses"
  ON public.churches FOR INSERT
  WITH CHECK (
    public.is_super_admin() OR
    diocese_id IN (SELECT public.get_user_diocese_ids())
  );

CREATE POLICY "Diocese admins can update churches in their dioceses"
  ON public.churches FOR UPDATE
  USING (
    public.is_super_admin() OR
    diocese_id IN (SELECT public.get_user_diocese_ids())
  );

CREATE POLICY "Diocese admins can delete churches in their dioceses"
  ON public.churches FOR DELETE
  USING (
    public.is_super_admin() OR
    diocese_id IN (SELECT public.get_user_diocese_ids())
  );

-- =====================================================
-- MIGRATION DATA (Optional)
-- =====================================================

-- If you have existing users with role='diocese_admin' and diocese_id set,
-- uncomment the following to migrate them to the new system:

/*
INSERT INTO public.diocese_admins (diocese_id, user_id, assigned_by, notes)
SELECT 
  diocese_id,
  id as user_id,
  NULL as assigned_by,
  'Migrated from existing diocese_admin role' as notes
FROM public.users
WHERE role = 'diocese_admin'
  AND diocese_id IS NOT NULL
  AND is_active = true
ON CONFLICT (diocese_id, user_id) DO NOTHING;
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DIOCESE ADMIN ASSIGNMENTS MIGRATION COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  ✓ Created diocese_admins junction table';
  RAISE NOTICE '  ✓ Added RLS policies for admin assignments';
  RAISE NOTICE '  ✓ Updated helper functions';
  RAISE NOTICE '  ✓ Updated diocese and church policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  • Multiple admins per diocese';
  RAISE NOTICE '  • Track who assigned each admin';
  RAISE NOTICE '  • Enable/disable admin access without deletion';
  RAISE NOTICE '  • Full audit trail with timestamps';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  -- Assign a user as diocese admin:';
  RAISE NOTICE '  INSERT INTO diocese_admins (diocese_id, user_id)';
  RAISE NOTICE '  VALUES (''<diocese-id>'', ''<user-id>'');';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Revoke admin access:';
  RAISE NOTICE '  UPDATE diocese_admins';
  RAISE NOTICE '  SET is_active = false';
  RAISE NOTICE '  WHERE diocese_id = ''<diocese-id>''';
  RAISE NOTICE '    AND user_id = ''<user-id>'';';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
