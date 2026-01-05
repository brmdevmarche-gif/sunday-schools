-- =====================================================
-- ANNOUNCEMENTS: FIX SELECT RLS (respect target_roles for everyone)
-- =====================================================
-- Previously: "Admins can manage announcements" was FOR ALL, which also granted SELECT,
-- causing admins/teachers to see ALL announcements regardless of target_roles.
-- This migration keeps SELECT strict (can_read_announcement) and limits admin powers to write ops.

-- Drop broad policy
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Keep SELECT policy (recreate to ensure correct)
DROP POLICY IF EXISTS "Users can read active announcements" ON public.announcements;
CREATE POLICY "Users can read active announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (public.can_read_announcement(id));

-- Admin/teacher write policies (no SELECT)
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'));

DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'));

DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'));


