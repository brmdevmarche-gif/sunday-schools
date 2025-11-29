-- =====================================================
-- SUNDAY SCHOOL MANAGEMENT SYSTEM - ROLES & PERMISSIONS
-- =====================================================

-- =====================================================
-- 1. UPDATE USERS TABLE WITH ROLE INFORMATION
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'parent', 'student')),
ADD COLUMN IF NOT EXISTS diocese_id UUID REFERENCES public.dioceses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Indexes
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_diocese_id_idx ON public.users(diocese_id);
CREATE INDEX IF NOT EXISTS users_church_id_idx ON public.users(church_id);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users(is_active);

-- =====================================================
-- 2. USER RELATIONSHIPS TABLE (Parent-Student)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Enable RLS
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS user_relationships_parent_id_idx ON public.user_relationships(parent_id);
CREATE INDEX IF NOT EXISTS user_relationships_student_id_idx ON public.user_relationships(student_id);

-- =====================================================
-- 3. CLASS ASSIGNMENTS TABLE (Teachers & Students)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('teacher', 'student', 'assistant')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(class_id, user_id, assignment_type)
);

-- Enable RLS
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS class_assignments_class_id_idx ON public.class_assignments(class_id);
CREATE INDEX IF NOT EXISTS class_assignments_user_id_idx ON public.class_assignments(user_id);
CREATE INDEX IF NOT EXISTS class_assignments_type_idx ON public.class_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS class_assignments_is_active_idx ON public.class_assignments(is_active);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN public.users.role IS 'User role: super_admin, diocese_admin, church_admin, teacher, parent, student';
COMMENT ON TABLE public.user_relationships IS 'Links parents/guardians to their students';
COMMENT ON TABLE public.class_assignments IS 'Assigns teachers and students to classes';
