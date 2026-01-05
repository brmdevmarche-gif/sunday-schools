-- =====================================================
-- ANNOUNCEMENTS: FIX VISIBILITY
-- - Allow super_admin to bypass scope restrictions (still respects target_roles)
-- - Treat class_assignments.is_active NULL as active (older data)
-- =====================================================

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

  -- Diocese from user's church (if any)
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

  -- Super admin can see any announcement that targets super_admin (or targets all roles),
  -- regardless of diocese/church/class scope selections.
  IF u_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Determine which scopes exist for this announcement
  SELECT EXISTS (SELECT 1 FROM public.announcement_classes ac WHERE ac.announcement_id = a_id) INTO has_class_scope;
  SELECT EXISTS (SELECT 1 FROM public.announcement_churches ach WHERE ach.announcement_id = a_id) INTO has_church_scope;
  SELECT EXISTS (SELECT 1 FROM public.announcement_dioceses ad WHERE ad.announcement_id = a_id) INTO has_diocese_scope;

  -- Classes scope (highest precedence)
  IF has_class_scope THEN
    -- Student/teacher/church_admin/diocese_admin match by their assigned classes
    IF u_role IN ('student', 'teacher', 'church_admin', 'diocese_admin') THEN
      IF EXISTS (
        SELECT 1
        FROM public.class_assignments ca
        JOIN public.announcement_classes ac
          ON ac.class_id = ca.class_id
        WHERE ca.user_id = u_id
          AND COALESCE(ca.is_active, TRUE) = TRUE
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
          AND COALESCE(ca.is_active, TRUE) = TRUE
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
      -- direct match on users.church_id
      IF u_church IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.announcement_churches ach
        WHERE ach.announcement_id = a_id
          AND ach.church_id = u_church
      ) THEN
        RETURN TRUE;
      END IF;

      -- fallback: match via assigned classes -> classes.church_id
      RETURN EXISTS (
        SELECT 1
        FROM public.class_assignments ca
        JOIN public.classes cl ON cl.id = ca.class_id
        JOIN public.announcement_churches ach ON ach.church_id = cl.church_id
        WHERE ca.user_id = u_id
          AND COALESCE(ca.is_active, TRUE) = TRUE
          AND ach.announcement_id = a_id
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
      -- direct match via users.church_id -> churches.diocese_id
      IF u_diocese IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.announcement_dioceses ad
        WHERE ad.announcement_id = a_id
          AND ad.diocese_id = u_diocese
      ) THEN
        RETURN TRUE;
      END IF;

      -- fallback: match via assigned classes -> church -> diocese
      RETURN EXISTS (
        SELECT 1
        FROM public.class_assignments ca
        JOIN public.classes cl ON cl.id = ca.class_id
        JOIN public.churches ch ON ch.id = cl.church_id
        JOIN public.announcement_dioceses ad ON ad.diocese_id = ch.diocese_id
        WHERE ca.user_id = u_id
          AND COALESCE(ca.is_active, TRUE) = TRUE
          AND ad.announcement_id = a_id
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


