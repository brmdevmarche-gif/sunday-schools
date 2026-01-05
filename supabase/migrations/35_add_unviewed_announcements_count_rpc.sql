-- =====================================================
-- ANNOUNCEMENTS: UNVIEWED COUNT RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_unviewed_announcements_count()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::INT, 0)
  FROM public.announcements a
  WHERE public.can_read_announcement(a.id)
    AND NOT EXISTS (
      SELECT 1
      FROM public.announcement_views v
      WHERE v.announcement_id = a.id
        AND v.user_id = auth.uid()
    );
$$ LANGUAGE sql;


