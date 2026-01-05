-- =====================================================
-- ANNOUNCEMENTS TARGETING (roles + dioceses/churches/classes)
-- =====================================================

-- Add role targeting (who can see it)
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS target_roles TEXT[] NOT NULL DEFAULT ARRAY['student','parent']::TEXT[];

COMMENT ON COLUMN public.announcements.target_roles IS
  'Roles that can see this announcement. If empty array, treated as all roles.';

-- Note: audience column from migration 27 is kept for backward compatibility,
-- but targeting should be based on target_roles + scope tables below.

-- -----------------------------------------------------
-- Scope tables (optional restrictions)
-- If a scope table has rows for an announcement, the user must match at least one.
-- Precedence: classes > churches > dioceses > global
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.announcement_dioceses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  diocese_id UUID NOT NULL REFERENCES public.dioceses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, diocese_id)
);

CREATE TABLE IF NOT EXISTS public.announcement_churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, church_id)
);

CREATE TABLE IF NOT EXISTS public.announcement_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(announcement_id, class_id)
);

ALTER TABLE public.announcement_dioceses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_classes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS announcement_dioceses_announcement_id_idx ON public.announcement_dioceses(announcement_id);
CREATE INDEX IF NOT EXISTS announcement_dioceses_diocese_id_idx ON public.announcement_dioceses(diocese_id);
CREATE INDEX IF NOT EXISTS announcement_churches_announcement_id_idx ON public.announcement_churches(announcement_id);
CREATE INDEX IF NOT EXISTS announcement_churches_church_id_idx ON public.announcement_churches(church_id);
CREATE INDEX IF NOT EXISTS announcement_classes_announcement_id_idx ON public.announcement_classes(announcement_id);
CREATE INDEX IF NOT EXISTS announcement_classes_class_id_idx ON public.announcement_classes(class_id);

-- -----------------------------------------------------
-- Helper: determine if current user can read a given announcement
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_read_announcement(a_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_id UUID := auth.uid();
  u_role TEXT;
  u_church UUID;
  u_diocese UUID;
  has_class_scope BOOLEAN;
  has_church_scope BOOLEAN;
  has_diocese_scope BOOLEAN;
  role_ok BOOLEAN;
BEGIN
  IF u_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Base filters: active + publish window
  IF NOT EXISTS (
    SELECT 1
    FROM public.announcements a
    WHERE a.id = a_id
      AND a.is_deleted = FALSE
      AND a.publish_from <= NOW()
      AND (a.publish_to IS NULL OR a.publish_to >= NOW())
  ) THEN
    RETURN FALSE;
  END IF;

  -- User role and org info
  SELECT role, church_id
    INTO u_role, u_church
  FROM public.users
  WHERE id = u_id;

  -- Diocese from user's church
  SELECT c.diocese_id
    INTO u_diocese
  FROM public.churches c
  WHERE c.id = u_church;

  -- Role targeting: if target_roles empty, treat as all
  SELECT (
    COALESCE(array_length(a.target_roles, 1), 0) = 0
    OR u_role = ANY(a.target_roles)
  )
  INTO role_ok
  FROM public.announcements a
  WHERE a.id = a_id;

  IF NOT role_ok THEN
    RETURN FALSE;
  END IF;

  -- Determine which scopes exist for this announcement
  SELECT EXISTS (SELECT 1 FROM public.announcement_classes ac WHERE ac.announcement_id = a_id) INTO has_class_scope;
  SELECT EXISTS (SELECT 1 FROM public.announcement_churches ach WHERE ach.announcement_id = a_id) INTO has_church_scope;
  SELECT EXISTS (SELECT 1 FROM public.announcement_dioceses ad WHERE ad.announcement_id = a_id) INTO has_diocese_scope;

  -- Classes scope (highest precedence)
  IF has_class_scope THEN
    -- Student/teacher/admin match by their assigned classes
    IF u_role IN ('student', 'teacher', 'church_admin', 'diocese_admin', 'super_admin') THEN
      IF EXISTS (
        SELECT 1
        FROM public.class_assignments ca
        JOIN public.announcement_classes ac
          ON ac.class_id = ca.class_id
        WHERE ca.user_id = u_id
          AND ca.is_active = TRUE
          AND ac.announcement_id = a_id
      ) THEN
        RETURN TRUE;
      END IF;
    END IF;

    -- Parent matches if any linked child is in a targeted class
    IF u_role = 'parent' THEN
      IF EXISTS (
        SELECT 1
        FROM public.user_relationships ur
        JOIN public.class_assignments ca
          ON ca.user_id = ur.student_id
        JOIN public.announcement_classes ac
          ON ac.class_id = ca.class_id
        WHERE ur.parent_id = u_id
          AND ca.is_active = TRUE
          AND ac.announcement_id = a_id
      ) THEN
        RETURN TRUE;
      END IF;
    END IF;

    RETURN FALSE;
  END IF;

  -- Churches scope
  IF has_church_scope THEN
    IF u_role <> 'parent' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.announcement_churches ach
        WHERE ach.announcement_id = a_id
          AND ach.church_id = u_church
      );
    END IF;

    -- Parent matches if any linked child is in a targeted church
    RETURN EXISTS (
      SELECT 1
      FROM public.user_relationships ur
      JOIN public.users s
        ON s.id = ur.student_id
      JOIN public.announcement_churches ach
        ON ach.church_id = s.church_id
      WHERE ur.parent_id = u_id
        AND ach.announcement_id = a_id
    );
  END IF;

  -- Dioceses scope
  IF has_diocese_scope THEN
    IF u_role <> 'parent' THEN
      RETURN EXISTS (
        SELECT 1
        FROM public.announcement_dioceses ad
        WHERE ad.announcement_id = a_id
          AND ad.diocese_id = u_diocese
      );
    END IF;

    -- Parent matches if any linked child belongs to a targeted diocese (via child's church)
    RETURN EXISTS (
      SELECT 1
      FROM public.user_relationships ur
      JOIN public.users s
        ON s.id = ur.student_id
      JOIN public.churches c
        ON c.id = s.church_id
      JOIN public.announcement_dioceses ad
        ON ad.diocese_id = c.diocese_id
      WHERE ur.parent_id = u_id
        AND ad.announcement_id = a_id
    );
  END IF;

  -- Global (no scope rows)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Update policies to use can_read_announcement()
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can read active announcements" ON public.announcements;
CREATE POLICY "Users can read active announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (public.can_read_announcement(id));

DROP POLICY IF EXISTS "Users can mark announcements as viewed" ON public.announcement_views;
CREATE POLICY "Users can mark announcements as viewed"
  ON public.announcement_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_read_announcement(announcement_id));

-- -----------------------------------------------------
-- Admin manage policies for scope tables
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage announcement dioceses" ON public.announcement_dioceses;
CREATE POLICY "Admins can manage announcement dioceses"
  ON public.announcement_dioceses FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'));

DROP POLICY IF EXISTS "Admins can manage announcement churches" ON public.announcement_churches;
CREATE POLICY "Admins can manage announcement churches"
  ON public.announcement_churches FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'));

DROP POLICY IF EXISTS "Admins can manage announcement classes" ON public.announcement_classes;
CREATE POLICY "Admins can manage announcement classes"
  ON public.announcement_classes FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher'));




