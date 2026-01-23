-- =====================================================
-- FIX NOTIFY_PARENT_TRIP_REGISTRATION FUNCTION
-- Migration: 46_fix_notify_parent_trip_registration_trip_title.sql
-- =====================================================
-- The previous implementation selected non-existent "name" / "name_ar"
-- columns from public.trips, which caused "column \"name\" does not exist"
-- errors whenever a row was inserted into trip_participants.
--
-- This migration updates the function to use the actual trips schema
-- (title field) for notification content.

CREATE OR REPLACE FUNCTION notify_parent_trip_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_parent RECORD;
  v_trip RECORD;
  v_child RECORD;
BEGIN
  -- Get trip details (use title from trips table)
  SELECT title, requires_parent_approval
  INTO v_trip
  FROM public.trips
  WHERE id = NEW.trip_id;

  -- Only notify if trip requires parent approval
  IF NOT v_trip.requires_parent_approval THEN
    RETURN NEW;
  END IF;

  -- Get child details
  SELECT full_name
  INTO v_child
  FROM public.users
  WHERE id = NEW.user_id;

  -- Notify all active parents
  FOR v_parent IN
    SELECT parent_id
    FROM public.user_relationships
    WHERE student_id = NEW.user_id
      AND is_active = true
  LOOP
    PERFORM create_notification(
      v_parent.parent_id,
      'trip_approval_needed',
      'Trip Approval Needed: ' || v_trip.title,
      'موافقة مطلوبة للرحلة: ' || v_trip.title,
      v_child.full_name || ' has registered for a trip and needs your approval.',
      v_child.full_name || ' سجل في رحلة ويحتاج موافقتك.',
      jsonb_build_object(
        'trip_id', NEW.trip_id,
        'participant_id', NEW.id,
        'child_id', NEW.user_id
      ),
      '/dashboard/approvals'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

