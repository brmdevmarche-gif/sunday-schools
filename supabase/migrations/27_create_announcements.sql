-- =====================================================
-- ANNOUNCEMENTS MODULE (Students / Linked Parents)
-- =====================================================

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  types TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  audience TEXT NOT NULL DEFAULT 'students' CHECK (audience IN ('students', 'parents', 'both')),
  publish_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  publish_to TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Keep updated_at in sync (re-uses existing handle_updated_at() function)
DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS announcements_is_deleted_idx ON public.announcements(is_deleted);
CREATE INDEX IF NOT EXISTS announcements_publish_from_idx ON public.announcements(publish_from);
CREATE INDEX IF NOT EXISTS announcements_publish_to_idx ON public.announcements(publish_to);
CREATE INDEX IF NOT EXISTS announcements_audience_idx ON public.announcements(audience);

-- Views table (tracks which user has viewed which announcement)
CREATE TABLE IF NOT EXISTS public.announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS announcement_views_user_id_idx ON public.announcement_views(user_id);
CREATE INDEX IF NOT EXISTS announcement_views_announcement_id_idx ON public.announcement_views(announcement_id);

-- -----------------------------------------------------
-- RLS: Announcements (read for audience, manage for admins)
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can read active announcements" ON public.announcements;
CREATE POLICY "Users can read active announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    is_deleted = false
    AND publish_from <= NOW()
    AND (publish_to IS NULL OR publish_to >= NOW())
    AND (
      -- students
      (public.get_user_role() = 'student' AND audience IN ('students', 'both'))
      -- parents (must be linked to at least one student)
      OR (
        public.get_user_role() = 'parent'
        AND audience IN ('parents', 'both')
        AND EXISTS (
          SELECT 1 FROM public.user_relationships ur
          WHERE ur.parent_id = auth.uid()
        )
      )
      -- admins/teachers can also read (useful for preview)
      OR (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'))
    )
  );

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'));

-- -----------------------------------------------------
-- RLS: Announcement views (users can insert/read their own)
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can read own announcement views" ON public.announcement_views;
CREATE POLICY "Users can read own announcement views"
  ON public.announcement_views FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark announcements as viewed" ON public.announcement_views;
CREATE POLICY "Users can mark announcements as viewed"
  ON public.announcement_views FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.announcements a
      WHERE a.id = announcement_views.announcement_id
        AND a.is_deleted = false
        AND a.publish_from <= NOW()
        AND (a.publish_to IS NULL OR a.publish_to >= NOW())
        AND (
          (public.get_user_role() = 'student' AND a.audience IN ('students', 'both'))
          OR (
            public.get_user_role() = 'parent'
            AND a.audience IN ('parents', 'both')
            AND EXISTS (
              SELECT 1 FROM public.user_relationships ur
              WHERE ur.parent_id = auth.uid()
            )
          )
          OR (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'))
        )
    )
  );




