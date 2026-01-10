-- =====================================================
-- ANNOUNCEMENTS: DEACTIVATION REASON
-- =====================================================

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS deactivated_reason TEXT,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.announcements.deactivated_reason IS 'Reason for deactivation (soft delete).';
COMMENT ON COLUMN public.announcements.deactivated_at IS 'When announcement was deactivated.';
COMMENT ON COLUMN public.announcements.deactivated_by IS 'Who deactivated the announcement.';
