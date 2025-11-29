-- =====================================================
-- SUNDAY SCHOOL MANAGEMENT SYSTEM - ORGANIZATIONAL STRUCTURE
-- =====================================================

-- =====================================================
-- 1. DIOCESES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dioceses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dioceses ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS dioceses_created_by_idx ON public.dioceses(created_by);

-- =====================================================
-- 2. CHURCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diocese_id UUID REFERENCES public.dioceses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS churches_diocese_id_idx ON public.churches(diocese_id);
CREATE INDEX IF NOT EXISTS churches_created_by_idx ON public.churches(created_by);

-- =====================================================
-- 3. CLASSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  academic_year TEXT,
  schedule TEXT, -- e.g., "Sundays 10:00 AM"
  capacity INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS classes_church_id_idx ON public.classes(church_id);
CREATE INDEX IF NOT EXISTS classes_is_active_idx ON public.classes(is_active);
CREATE INDEX IF NOT EXISTS classes_created_by_idx ON public.classes(created_by);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Trigger for dioceses
CREATE TRIGGER set_dioceses_updated_at
  BEFORE UPDATE ON public.dioceses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for churches
CREATE TRIGGER set_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for classes
CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.dioceses IS 'Top-level organizational structure for managing multiple churches';
COMMENT ON TABLE public.churches IS 'Churches belonging to a diocese';
COMMENT ON TABLE public.classes IS 'Sunday school classes within a church';
