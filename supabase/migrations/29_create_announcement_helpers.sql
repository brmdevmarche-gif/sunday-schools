-- =====================================================
-- ANNOUNCEMENTS HELPERS (RPC)
-- =====================================================

-- Returns distinct announcement "types" tags as a TEXT[].
-- Used for autocomplete in the admin UI.
CREATE OR REPLACE FUNCTION public.get_distinct_announcement_types()
RETURNS TEXT[]
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT t ORDER BY t), '{}'::TEXT[])
  FROM public.announcements a,
       unnest(a.types) AS t
  WHERE a.is_deleted = FALSE;
$$ LANGUAGE sql;




