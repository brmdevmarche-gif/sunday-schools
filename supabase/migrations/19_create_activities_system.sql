-- =====================================================
-- Activities System with Points Management
-- =====================================================
-- This migration creates tables for managing activities with:
-- - Multi-level scoping (diocese, church, class)
-- - Sub-activities support
-- - Approval workflows
-- - Points system with revocation
-- - Time-sensitive activities

-- Create activity status enum
DO $$ BEGIN
  CREATE TYPE activity_status AS ENUM (
    'draft',
    'active',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create participation status enum
DO $$ BEGIN
  CREATE TYPE participation_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'active',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create completion status enum
DO $$ BEGIN
  CREATE TYPE completion_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- DROP EXISTING TABLES IF THEY EXIST (fresh start)
-- =====================================================
DROP TABLE IF EXISTS public.activity_completions CASCADE;
DROP TABLE IF EXISTS public.activity_participants CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Hierarchy (for sub-activities)
  parent_activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,

  -- Scoping (nullable means available to all)
  diocese_id UUID REFERENCES public.dioceses(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,

  -- Points configuration
  points INTEGER NOT NULL DEFAULT 0,
  reduced_points_percentage INTEGER DEFAULT 100, -- Percentage for late completion (100 = full points)

  -- Approval settings
  requires_participation_approval BOOLEAN NOT NULL DEFAULT false,
  requires_completion_approval BOOLEAN NOT NULL DEFAULT false,

  -- Time settings
  is_time_sensitive BOOLEAN NOT NULL DEFAULT false,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  deadline TIMESTAMPTZ,

  -- Full points window (optional - for activities that give reduced points outside window)
  full_points_window_start TIMESTAMPTZ,
  full_points_window_end TIMESTAMPTZ,

  -- Capacity
  max_participants INTEGER,

  -- Status
  status activity_status NOT NULL DEFAULT 'draft',

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE public.activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Participation status
  status participation_status NOT NULL DEFAULT 'pending',

  -- Approval tracking
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user can only participate once per activity
  UNIQUE(activity_id, user_id)
);

-- =====================================================
-- ACTIVITY COMPLETIONS TABLE
-- =====================================================
CREATE TABLE public.activity_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Completion status
  status completion_status NOT NULL DEFAULT 'pending',

  -- Points
  points_awarded INTEGER NOT NULL DEFAULT 0,
  is_full_points BOOLEAN NOT NULL DEFAULT true,

  -- Completion tracking
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Revocation
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason TEXT,

  -- Notes
  notes TEXT,
  admin_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user can only complete once per activity (unless revoked and retried)
  UNIQUE(activity_id, user_id, is_revoked)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Activities indexes
CREATE INDEX idx_activities_parent ON public.activities(parent_activity_id);
CREATE INDEX idx_activities_diocese ON public.activities(diocese_id);
CREATE INDEX idx_activities_church ON public.activities(church_id);
CREATE INDEX idx_activities_class ON public.activities(class_id);
CREATE INDEX idx_activities_status ON public.activities(status);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);

-- Participants indexes
CREATE INDEX idx_participants_activity ON public.activity_participants(activity_id);
CREATE INDEX idx_participants_user ON public.activity_participants(user_id);
CREATE INDEX idx_participants_status ON public.activity_participants(status);

-- Completions indexes
CREATE INDEX idx_completions_activity ON public.activity_completions(activity_id);
CREATE INDEX idx_completions_user ON public.activity_completions(user_id);
CREATE INDEX idx_completions_status ON public.activity_completions(status);
CREATE INDEX idx_completions_revoked ON public.activity_completions(is_revoked);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: ACTIVITIES
-- =====================================================

-- SELECT: Users can view activities in their scope
CREATE POLICY "Users can view activities in their scope"
  ON public.activities FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND (
      -- Activity available to all
      (diocese_id IS NULL AND church_id IS NULL AND class_id IS NULL)
      OR
      -- Activity in user's diocese
      diocese_id IN (SELECT diocese_id FROM public.users WHERE id = auth.uid())
      OR
      -- Activity in user's church
      church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
      OR
      -- Activity in user's class
      class_id IN (
        SELECT class_id FROM public.class_assignments
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- SELECT: Admins can view all activities
CREATE POLICY "Admins can view all activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- INSERT: Admins can create activities
CREATE POLICY "Admins can create activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- UPDATE: Admins can update activities in their scope
CREATE POLICY "Admins can update activities in their scope"
  ON public.activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR
        (u.role = 'diocese_admin' AND activities.diocese_id = u.diocese_id)
        OR
        (u.role = 'church_admin' AND activities.church_id = u.church_id)
        OR
        (u.role = 'teacher' AND activities.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- DELETE: Only super admin and creators can delete
CREATE POLICY "Admins can delete activities"
  ON public.activities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'super_admin' OR id = activities.created_by)
    )
  );

-- =====================================================
-- RLS POLICIES: ACTIVITY_PARTICIPANTS
-- =====================================================

-- SELECT: Users can view their own participation
CREATE POLICY "Users can view own participation"
  ON public.activity_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Admins can view participations in their scope
CREATE POLICY "Admins can view participations in their scope"
  ON public.activity_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.activities a ON a.id = activity_participants.activity_id
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR
        (u.role = 'diocese_admin' AND a.diocese_id = u.diocese_id)
        OR
        (u.role = 'church_admin' AND a.church_id = u.church_id)
        OR
        (u.role = 'teacher' AND a.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- INSERT: Users can request to participate
CREATE POLICY "Users can request to participate"
  ON public.activity_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Admins can approve/reject participation
CREATE POLICY "Admins can update participation status"
  ON public.activity_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.activities a ON a.id = activity_participants.activity_id
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR
        (u.role = 'diocese_admin' AND a.diocese_id = u.diocese_id)
        OR
        (u.role = 'church_admin' AND a.church_id = u.church_id)
        OR
        (u.role = 'teacher' AND a.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- DELETE: Users can withdraw participation
CREATE POLICY "Users can withdraw participation"
  ON public.activity_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- =====================================================
-- RLS POLICIES: ACTIVITY_COMPLETIONS
-- =====================================================

-- SELECT: Users can view their own completions
CREATE POLICY "Users can view own completions"
  ON public.activity_completions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Admins can view completions in their scope
CREATE POLICY "Admins can view completions in their scope"
  ON public.activity_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.activities a ON a.id = activity_completions.activity_id
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR
        (u.role = 'diocese_admin' AND a.diocese_id = u.diocese_id)
        OR
        (u.role = 'church_admin' AND a.church_id = u.church_id)
        OR
        (u.role = 'teacher' AND a.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- INSERT: Users can mark activities as complete
CREATE POLICY "Users can mark activities complete"
  ON public.activity_completions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Admins can approve/reject/revoke completions
CREATE POLICY "Admins can update completion status"
  ON public.activity_completions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.activities a ON a.id = activity_completions.activity_id
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR
        (u.role = 'diocese_admin' AND a.diocese_id = u.diocese_id)
        OR
        (u.role = 'church_admin' AND a.church_id = u.church_id)
        OR
        (u.role = 'teacher' AND a.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger for activities
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Auto-calculate points on completion insert/update
CREATE OR REPLACE FUNCTION calculate_activity_points()
RETURNS TRIGGER AS $$
DECLARE
  activity_record RECORD;
  calculated_points INTEGER;
BEGIN
  -- Get activity details
  SELECT * INTO activity_record
  FROM public.activities
  WHERE id = NEW.activity_id;

  -- Start with base points
  calculated_points := activity_record.points;

  -- Check if within full points window (if configured)
  IF activity_record.full_points_window_start IS NOT NULL
     AND activity_record.full_points_window_end IS NOT NULL THEN

    IF NEW.completed_at < activity_record.full_points_window_start
       OR NEW.completed_at > activity_record.full_points_window_end THEN
      -- Apply reduced points
      calculated_points := FLOOR(calculated_points * activity_record.reduced_points_percentage / 100);
      NEW.is_full_points := false;
    ELSE
      NEW.is_full_points := true;
    END IF;
  ELSE
    NEW.is_full_points := true;
  END IF;

  -- Set points awarded
  NEW.points_awarded := calculated_points;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_points_on_insert
  BEFORE INSERT ON public.activity_completions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_activity_points();

CREATE TRIGGER calculate_points_on_update
  BEFORE UPDATE ON public.activity_completions
  FOR EACH ROW
  WHEN (OLD.activity_id IS DISTINCT FROM NEW.activity_id OR OLD.completed_at IS DISTINCT FROM NEW.completed_at)
  EXECUTE FUNCTION calculate_activity_points();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.activities IS 'Activities that can be shared across dioceses, churches, or classes with points system';
COMMENT ON TABLE public.activity_participants IS 'Tracks user participation in activities with approval workflow';
COMMENT ON TABLE public.activity_completions IS 'Tracks activity completions with points awarded and revocation support';

COMMENT ON COLUMN public.activities.parent_activity_id IS 'Parent activity for sub-activities (hierarchical structure)';
COMMENT ON COLUMN public.activities.reduced_points_percentage IS 'Percentage of points awarded for late completion (100 = full points)';
COMMENT ON COLUMN public.activities.full_points_window_start IS 'Start of window for full points (optional)';
COMMENT ON COLUMN public.activities.full_points_window_end IS 'End of window for full points (optional)';
