-- =====================================================
-- PARENT ACTION TRACKING
-- Migration: 43_add_parent_action_tracking.sql
-- =====================================================
-- Adds tracking fields to identify when parents perform
-- actions on behalf of their children (store orders, trip registrations)

-- PART 1: Add parent tracking to orders table
DO $$
BEGIN
  -- Add ordered_by_parent_id to track which parent placed the order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'ordered_by_parent_id'
  ) THEN
    ALTER TABLE public.orders
    ADD COLUMN ordered_by_parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

    COMMENT ON COLUMN public.orders.ordered_by_parent_id IS
      'Parent who placed the order on behalf of the child (NULL if student ordered themselves)';
  END IF;
END $$;

-- Index for parent orders
CREATE INDEX IF NOT EXISTS idx_orders_parent
ON public.orders(ordered_by_parent_id)
WHERE ordered_by_parent_id IS NOT NULL;

-- PART 2: Add registration tracking to trip_participants
DO $$
BEGIN
  -- Add registered_by to track who registered the participant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'trip_participants'
    AND column_name = 'registered_by'
  ) THEN
    ALTER TABLE public.trip_participants
    ADD COLUMN registered_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

    COMMENT ON COLUMN public.trip_participants.registered_by IS
      'User who registered this participant (could be parent, admin, or student themselves)';
  END IF;
END $$;

-- Index for registration tracking
CREATE INDEX IF NOT EXISTS idx_trip_participants_registered_by
ON public.trip_participants(registered_by)
WHERE registered_by IS NOT NULL;

-- PART 3: Helper function to check if action was by parent
CREATE OR REPLACE FUNCTION is_parent_action(
  registered_by_id UUID,
  student_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the registering user is a parent of the student
  RETURN EXISTS (
    SELECT 1 FROM public.user_relationships ur
    JOIN public.users u ON u.id = ur.parent_id
    WHERE ur.parent_id = registered_by_id
    AND ur.student_id = student_id
    AND ur.is_active = true
    AND u.role = 'parent'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- PART 4: View for orders with parent info (for admin/teacher dashboards)
CREATE OR REPLACE VIEW public.orders_with_parent AS
SELECT
  o.*,
  parent.full_name AS parent_name,
  parent.email AS parent_email,
  CASE
    WHEN o.ordered_by_parent_id IS NOT NULL THEN true
    ELSE false
  END AS is_parent_order
FROM public.orders o
LEFT JOIN public.users parent ON parent.id = o.ordered_by_parent_id;

-- Grant access to the view
GRANT SELECT ON public.orders_with_parent TO authenticated;

-- PART 5: View for trip participants with registration info
CREATE OR REPLACE VIEW public.trip_participants_with_registration AS
SELECT
  tp.*,
  registrar.full_name AS registered_by_name,
  registrar.role AS registered_by_role,
  CASE
    WHEN tp.registered_by = tp.user_id THEN 'self'
    WHEN registrar.role = 'parent' THEN 'parent'
    WHEN registrar.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher') THEN 'admin'
    ELSE 'unknown'
  END AS registration_type
FROM public.trip_participants tp
LEFT JOIN public.users registrar ON registrar.id = tp.registered_by;

-- Grant access to the view
GRANT SELECT ON public.trip_participants_with_registration TO authenticated;
