-- =====================================================
-- Comprehensive Points System
-- =====================================================
-- This migration creates tables for managing student points:
-- - Church-level points configuration
-- - Student points balance tracking
-- - Points transaction audit trail
-- - Attendance and trip points
-- - Teacher manual adjustments

-- =====================================================
-- PART 1: POINTS TRANSACTION TYPES ENUM
-- =====================================================
DO $$ BEGIN
  CREATE TYPE points_transaction_type AS ENUM (
    'activity_completion',      -- Points earned from completing activities
    'activity_revocation',      -- Points revoked from activities
    'attendance',               -- Points from attendance
    'trip_participation',       -- Points from trip participation
    'teacher_adjustment',       -- Manual teacher add/deduct
    'store_order_pending',      -- Points suspended for pending order
    'store_order_approved',     -- Points deducted when order approved
    'store_order_cancelled',    -- Points returned when order cancelled
    'store_order_rejected',     -- Points returned when order rejected
    'admin_adjustment'          -- Admin override/correction
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PART 2: CHURCH POINTS CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS public.church_points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to church
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,

  -- Attendance points configuration
  attendance_points_present INTEGER NOT NULL DEFAULT 10,
  attendance_points_late INTEGER NOT NULL DEFAULT 5,
  attendance_points_excused INTEGER NOT NULL DEFAULT 0,
  attendance_points_absent INTEGER NOT NULL DEFAULT 0,

  -- Trip participation points
  trip_participation_points INTEGER NOT NULL DEFAULT 20,

  -- Teacher adjustment limits
  max_teacher_adjustment INTEGER NOT NULL DEFAULT 50,  -- Max points a teacher can add/deduct at once

  -- Enable/disable features
  is_attendance_points_enabled BOOLEAN NOT NULL DEFAULT true,
  is_trip_points_enabled BOOLEAN NOT NULL DEFAULT true,
  is_teacher_adjustment_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one config per church
  UNIQUE(church_id)
);

-- =====================================================
-- PART 3: STUDENT POINTS BALANCE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.student_points_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to student
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Points breakdown
  available_points INTEGER NOT NULL DEFAULT 0,   -- Points available to spend
  suspended_points INTEGER NOT NULL DEFAULT 0,   -- Points pending (store orders)
  used_points INTEGER NOT NULL DEFAULT 0,        -- Points already spent

  -- Total earned (for stats)
  total_earned INTEGER NOT NULL DEFAULT 0,       -- Total points ever earned
  total_deducted INTEGER NOT NULL DEFAULT 0,     -- Total points ever deducted

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one balance record per user
  UNIQUE(user_id)
);

-- =====================================================
-- PART 4: POINTS TRANSACTIONS (AUDIT TRAIL)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to student
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type points_transaction_type NOT NULL,
  points INTEGER NOT NULL,  -- Positive for earned, negative for deducted

  -- Balance after transaction
  balance_after INTEGER NOT NULL,

  -- Notes/reason
  notes TEXT,

  -- Reference to related entities (optional)
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  attendance_id UUID,  -- References attendance table
  trip_id UUID,        -- References trips table
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,

  -- Who made the transaction
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PART 5: ADD TRIP POINTS COLUMN TO TRIPS
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS participation_points INTEGER DEFAULT 0;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- =====================================================
-- PART 6: ADD POINTS AWARDED TO ATTENDANCE
-- =====================================================
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS points_transaction_id UUID REFERENCES public.points_transactions(id);

-- =====================================================
-- PART 7: ADD POINTS AWARDED TO TRIP PARTICIPANTS
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.trip_participants ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
  ALTER TABLE public.trip_participants ADD COLUMN IF NOT EXISTS points_transaction_id UUID REFERENCES public.points_transactions(id);
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_church_points_config_church ON public.church_points_config(church_id);
CREATE INDEX IF NOT EXISTS idx_student_points_balance_user ON public.student_points_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON public.points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON public.points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created ON public.points_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_activity ON public.points_transactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_order ON public.points_transactions(order_id);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.church_points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: CHURCH POINTS CONFIG
-- =====================================================

-- SELECT: Church admins and above can view their church config
DROP POLICY IF EXISTS "Admins can view church points config" ON public.church_points_config;
CREATE POLICY "Admins can view church points config"
  ON public.church_points_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.churches c
          WHERE c.id = church_points_config.church_id
          AND c.diocese_id = u.diocese_id
        ))
        OR (u.role IN ('church_admin', 'teacher') AND u.church_id = church_points_config.church_id)
      )
    )
  );

-- INSERT/UPDATE/DELETE: Only church admins and above
DROP POLICY IF EXISTS "Church admins can manage points config" ON public.church_points_config;
CREATE POLICY "Church admins can manage points config"
  ON public.church_points_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.churches c
          WHERE c.id = church_points_config.church_id
          AND c.diocese_id = u.diocese_id
        ))
        OR (u.role = 'church_admin' AND u.church_id = church_points_config.church_id)
      )
    )
  );

-- =====================================================
-- RLS POLICIES: STUDENT POINTS BALANCE
-- =====================================================

-- SELECT: Students can view their own balance
DROP POLICY IF EXISTS "Users can view own points balance" ON public.student_points_balance;
CREATE POLICY "Users can view own points balance"
  ON public.student_points_balance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Teachers and admins can view student balances in their scope
DROP POLICY IF EXISTS "Admins can view student points balance" ON public.student_points_balance;
CREATE POLICY "Admins can view student points balance"
  ON public.student_points_balance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.users student
          WHERE student.id = student_points_balance.user_id
          AND student.diocese_id = u.diocese_id
        ))
        OR (u.role = 'church_admin' AND EXISTS (
          SELECT 1 FROM public.users student
          WHERE student.id = student_points_balance.user_id
          AND student.church_id = u.church_id
        ))
        OR (u.role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.class_assignments ca1
          JOIN public.class_assignments ca2 ON ca1.class_id = ca2.class_id
          WHERE ca1.user_id = u.id
          AND ca1.assignment_type = 'teacher'
          AND ca1.is_active = true
          AND ca2.user_id = student_points_balance.user_id
          AND ca2.assignment_type = 'student'
          AND ca2.is_active = true
        ))
      )
    )
  );

-- INSERT/UPDATE: Only system (via functions) can modify
DROP POLICY IF EXISTS "System can manage points balance" ON public.student_points_balance;
CREATE POLICY "System can manage points balance"
  ON public.student_points_balance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- =====================================================
-- RLS POLICIES: POINTS TRANSACTIONS
-- =====================================================

-- SELECT: Students can view their own transactions
DROP POLICY IF EXISTS "Users can view own points transactions" ON public.points_transactions;
CREATE POLICY "Users can view own points transactions"
  ON public.points_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Teachers and admins can view transactions in their scope
DROP POLICY IF EXISTS "Admins can view points transactions" ON public.points_transactions;
CREATE POLICY "Admins can view points transactions"
  ON public.points_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.users student
          WHERE student.id = points_transactions.user_id
          AND student.diocese_id = u.diocese_id
        ))
        OR (u.role = 'church_admin' AND EXISTS (
          SELECT 1 FROM public.users student
          WHERE student.id = points_transactions.user_id
          AND student.church_id = u.church_id
        ))
        OR (u.role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.class_assignments ca1
          JOIN public.class_assignments ca2 ON ca1.class_id = ca2.class_id
          WHERE ca1.user_id = u.id
          AND ca1.assignment_type = 'teacher'
          AND ca1.is_active = true
          AND ca2.user_id = points_transactions.user_id
          AND ca2.assignment_type = 'student'
          AND ca2.is_active = true
        ))
      )
    )
  );

-- INSERT: Teachers and admins can create transactions
DROP POLICY IF EXISTS "Admins can create points transactions" ON public.points_transactions;
CREATE POLICY "Admins can create points transactions"
  ON public.points_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to initialize points balance for a user
CREATE OR REPLACE FUNCTION public.initialize_points_balance(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.student_points_balance (user_id, available_points, suspended_points, used_points, total_earned, total_deducted)
  VALUES (p_user_id, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add points (for attendance, trips, activities, teacher adjustments)
CREATE OR REPLACE FUNCTION public.add_points(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type points_transaction_type,
  p_notes TEXT DEFAULT NULL,
  p_activity_id UUID DEFAULT NULL,
  p_attendance_id UUID DEFAULT NULL,
  p_trip_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Ensure user has a points balance record
  PERFORM public.initialize_points_balance(p_user_id);

  -- Update balance
  UPDATE public.student_points_balance
  SET
    available_points = available_points + p_points,
    total_earned = CASE WHEN p_points > 0 THEN total_earned + p_points ELSE total_earned END,
    total_deducted = CASE WHEN p_points < 0 THEN total_deducted + ABS(p_points) ELSE total_deducted END,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING available_points INTO v_new_balance;

  -- Create transaction record
  INSERT INTO public.points_transactions (
    user_id, transaction_type, points, balance_after, notes,
    activity_id, attendance_id, trip_id, order_id, created_by
  )
  VALUES (
    p_user_id, p_transaction_type, p_points, v_new_balance, p_notes,
    p_activity_id, p_attendance_id, p_trip_id, p_order_id, COALESCE(p_created_by, auth.uid())
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend points (for pending store orders)
CREATE OR REPLACE FUNCTION public.suspend_points(
  p_user_id UUID,
  p_points INTEGER,
  p_order_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_available INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check if user has enough points
  SELECT available_points INTO v_available
  FROM public.student_points_balance
  WHERE user_id = p_user_id;

  IF v_available IS NULL OR v_available < p_points THEN
    RAISE EXCEPTION 'Insufficient points. Available: %, Required: %', COALESCE(v_available, 0), p_points;
  END IF;

  -- Move points from available to suspended
  UPDATE public.student_points_balance
  SET
    available_points = available_points - p_points,
    suspended_points = suspended_points + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING available_points INTO v_new_balance;

  -- Create transaction record
  INSERT INTO public.points_transactions (
    user_id, transaction_type, points, balance_after, notes,
    order_id, created_by
  )
  VALUES (
    p_user_id, 'store_order_pending', -p_points, v_new_balance, p_notes,
    p_order_id, auth.uid()
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm points deduction (when order is approved)
CREATE OR REPLACE FUNCTION public.confirm_points_deduction(
  p_user_id UUID,
  p_points INTEGER,
  p_order_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Move points from suspended to used
  UPDATE public.student_points_balance
  SET
    suspended_points = suspended_points - p_points,
    used_points = used_points + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING available_points INTO v_new_balance;

  -- Create transaction record
  INSERT INTO public.points_transactions (
    user_id, transaction_type, points, balance_after, notes,
    order_id, created_by
  )
  VALUES (
    p_user_id, 'store_order_approved', 0, v_new_balance, p_notes,
    p_order_id, auth.uid()
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to return suspended points (when order is cancelled/rejected)
CREATE OR REPLACE FUNCTION public.return_suspended_points(
  p_user_id UUID,
  p_points INTEGER,
  p_order_id UUID,
  p_transaction_type points_transaction_type,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Move points from suspended back to available
  UPDATE public.student_points_balance
  SET
    suspended_points = suspended_points - p_points,
    available_points = available_points + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING available_points INTO v_new_balance;

  -- Create transaction record
  INSERT INTO public.points_transactions (
    user_id, transaction_type, points, balance_after, notes,
    order_id, created_by
  )
  VALUES (
    p_user_id, p_transaction_type, p_points, v_new_balance, p_notes,
    p_order_id, auth.uid()
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger for church_points_config
CREATE OR REPLACE FUNCTION update_church_points_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS church_points_config_updated_at ON public.church_points_config;
CREATE TRIGGER church_points_config_updated_at
  BEFORE UPDATE ON public.church_points_config
  FOR EACH ROW
  EXECUTE FUNCTION update_church_points_config_updated_at();

-- Updated_at trigger for student_points_balance
CREATE OR REPLACE FUNCTION update_student_points_balance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_points_balance_updated_at ON public.student_points_balance;
CREATE TRIGGER student_points_balance_updated_at
  BEFORE UPDATE ON public.student_points_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_student_points_balance_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.church_points_config IS 'Church-specific points system configuration';
COMMENT ON TABLE public.student_points_balance IS 'Tracks student points: available, suspended, used';
COMMENT ON TABLE public.points_transactions IS 'Audit trail for all points changes';

COMMENT ON COLUMN public.church_points_config.max_teacher_adjustment IS 'Maximum points a teacher can add/deduct in a single adjustment';
COMMENT ON COLUMN public.student_points_balance.suspended_points IS 'Points held pending for store orders awaiting approval';
COMMENT ON COLUMN public.student_points_balance.used_points IS 'Points already spent on approved store orders';
