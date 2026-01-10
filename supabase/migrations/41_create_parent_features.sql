-- =====================================================
-- PARENT FEATURES
-- Migration: 41_create_parent_features.sql
-- =====================================================

-- PART 1: NOTIFICATION TYPE ENUM
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'trip_approval_needed',
    'trip_status_changed',
    'payment_reminder',
    'announcement',
    'attendance_marked',
    'badge_earned',
    'points_awarded',
    'activity_reminder',
    'general'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- PART 2: NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Notification type
  type notification_type NOT NULL DEFAULT 'general',

  -- Content
  title VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200),
  body TEXT,
  body_ar TEXT,

  -- Additional data (trip_id, child_id, etc.)
  data JSONB DEFAULT '{}',

  -- Link to navigate to
  action_url VARCHAR(500),

  -- Status
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PART 3: INDEXES FOR NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- PART 4: ENABLE RLS ON NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PART 5: RLS POLICIES FOR NOTIFICATIONS
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/service can insert notifications
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- PART 6: PARENT-SPECIFIC RLS POLICIES

-- Helper function to check if user is parent of a student
CREATE OR REPLACE FUNCTION is_parent_of(student_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_relationships ur
    WHERE ur.parent_id = auth.uid()
    AND ur.student_id = student_uuid
    AND ur.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Parents can view their children's points balance
DROP POLICY IF EXISTS "Parents can view children points" ON public.student_points_balance;
CREATE POLICY "Parents can view children points"
  ON public.student_points_balance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_parent_of(user_id)
  );

-- Parents can view their children's trip participations
DROP POLICY IF EXISTS "Parents can view children trip participations" ON public.trip_participants;
CREATE POLICY "Parents can view children trip participations"
  ON public.trip_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- Parents can update trip participations for their children (approve/reject)
DROP POLICY IF EXISTS "Parents can approve children trips" ON public.trip_participants;
CREATE POLICY "Parents can approve children trips"
  ON public.trip_participants FOR UPDATE
  TO authenticated
  USING (
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  )
  WITH CHECK (
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- Parents can view their children's attendance records
DROP POLICY IF EXISTS "Parents can view children attendance" ON public.attendance;
CREATE POLICY "Parents can view children attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- Parents can view their children's approved spiritual notes
DROP POLICY IF EXISTS "Parents can view children spiritual notes" ON public.spiritual_notes;
CREATE POLICY "Parents can view children spiritual notes"
  ON public.spiritual_notes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (is_parent_of(user_id) AND status = 'approved') OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- Parents can view their children's readings
DROP POLICY IF EXISTS "Parents can view children readings" ON public.user_readings;
CREATE POLICY "Parents can view children readings"
  ON public.user_readings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- Parents can view their children's competition submissions
DROP POLICY IF EXISTS "Parents can view children competition submissions" ON public.competition_submissions;
CREATE POLICY "Parents can view children competition submissions"
  ON public.competition_submissions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- Parents can view their children's badges
DROP POLICY IF EXISTS "Parents can view children badges" ON public.user_badges;
CREATE POLICY "Parents can view children badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- Parents can view their children's streaks
DROP POLICY IF EXISTS "Parents can view children streaks" ON public.user_streaks;
CREATE POLICY "Parents can view children streaks"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_parent_of(user_id) OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- PART 7: ADD PARENT APPROVAL FIELDS TO TRIP PARTICIPANTS (if not exists)
DO $$
BEGIN
  -- Add parent_approved_by if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_participants'
    AND column_name = 'parent_approved_by'
  ) THEN
    ALTER TABLE public.trip_participants
    ADD COLUMN parent_approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- Add parent_approval_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_participants'
    AND column_name = 'parent_approval_notes'
  ) THEN
    ALTER TABLE public.trip_participants
    ADD COLUMN parent_approval_notes TEXT;
  END IF;

  -- Add parent_approved_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_participants'
    AND column_name = 'parent_approved_at'
  ) THEN
    ALTER TABLE public.trip_participants
    ADD COLUMN parent_approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- PART 8: FUNCTION TO CREATE NOTIFICATION
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR(200),
  p_title_ar VARCHAR(200) DEFAULT NULL,
  p_body TEXT DEFAULT NULL,
  p_body_ar TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}',
  p_action_url VARCHAR(500) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, title_ar, body, body_ar, data, action_url
  ) VALUES (
    p_user_id, p_type, p_title, p_title_ar, p_body, p_body_ar, p_data, p_action_url
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 9: TRIGGER TO NOTIFY PARENTS WHEN CHILD REGISTERS FOR TRIP
CREATE OR REPLACE FUNCTION notify_parent_trip_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_parent RECORD;
  v_trip RECORD;
  v_child RECORD;
BEGIN
  -- Get trip details
  SELECT name, name_ar, requires_parent_approval INTO v_trip
  FROM public.trips WHERE id = NEW.trip_id;

  -- Only notify if trip requires parent approval
  IF NOT v_trip.requires_parent_approval THEN
    RETURN NEW;
  END IF;

  -- Get child details
  SELECT full_name INTO v_child
  FROM public.users WHERE id = NEW.user_id;

  -- Notify all active parents
  FOR v_parent IN
    SELECT parent_id FROM public.user_relationships
    WHERE student_id = NEW.user_id AND is_active = true
  LOOP
    PERFORM create_notification(
      v_parent.parent_id,
      'trip_approval_needed',
      'Trip Approval Needed: ' || v_trip.name,
      'موافقة مطلوبة للرحلة: ' || COALESCE(v_trip.name_ar, v_trip.name),
      v_child.full_name || ' has registered for a trip and needs your approval.',
      v_child.full_name || ' سجل في رحلة ويحتاج موافقتك.',
      jsonb_build_object('trip_id', NEW.trip_id, 'participant_id', NEW.id, 'child_id', NEW.user_id),
      '/dashboard/approvals'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for trip registration notifications
DROP TRIGGER IF EXISTS trigger_notify_parent_trip_registration ON public.trip_participants;
CREATE TRIGGER trigger_notify_parent_trip_registration
  AFTER INSERT ON public.trip_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_parent_trip_registration();

-- PART 10: TRIGGER TO NOTIFY PARENT WHEN BADGE EARNED
CREATE OR REPLACE FUNCTION notify_parent_badge_earned()
RETURNS TRIGGER AS $$
DECLARE
  v_parent RECORD;
  v_badge RECORD;
  v_child RECORD;
BEGIN
  -- Get badge details
  SELECT name, name_ar INTO v_badge
  FROM public.badge_definitions WHERE id = NEW.badge_id;

  -- Get child details
  SELECT full_name INTO v_child
  FROM public.users WHERE id = NEW.user_id;

  -- Notify all active parents
  FOR v_parent IN
    SELECT parent_id FROM public.user_relationships
    WHERE student_id = NEW.user_id AND is_active = true
  LOOP
    PERFORM create_notification(
      v_parent.parent_id,
      'badge_earned',
      v_child.full_name || ' earned a badge!',
      v_child.full_name || ' حصل على شارة!',
      'Congratulations! ' || v_child.full_name || ' earned the "' || v_badge.name || '" badge.',
      'تهانينا! ' || v_child.full_name || ' حصل على شارة "' || COALESCE(v_badge.name_ar, v_badge.name) || '".',
      jsonb_build_object('badge_id', NEW.badge_id, 'child_id', NEW.user_id),
      '/dashboard/children/' || NEW.user_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for badge earned notifications
DROP TRIGGER IF EXISTS trigger_notify_parent_badge_earned ON public.user_badges;
CREATE TRIGGER trigger_notify_parent_badge_earned
  AFTER INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION notify_parent_badge_earned();
