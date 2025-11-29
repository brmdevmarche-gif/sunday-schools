-- =====================================================
-- SUNDAY SCHOOL MANAGEMENT SYSTEM - CONTENT TABLES
-- =====================================================

-- =====================================================
-- 1. LESSONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  lesson_date DATE,
  duration_minutes INTEGER DEFAULT 60,
  materials_needed TEXT,
  objectives TEXT,
  scripture_references TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS lessons_class_id_idx ON public.lessons(class_id);
CREATE INDEX IF NOT EXISTS lessons_lesson_date_idx ON public.lessons(lesson_date);
CREATE INDEX IF NOT EXISTS lessons_is_published_idx ON public.lessons(is_published);
CREATE INDEX IF NOT EXISTS lessons_created_by_idx ON public.lessons(created_by);

-- =====================================================
-- 2. ACTIVITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL, -- Optional, can be church-wide
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT CHECK (activity_type IN ('game', 'craft', 'worship', 'service', 'other')),
  activity_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  max_participants INTEGER,
  cost DECIMAL(10,2) DEFAULT 0,
  requires_permission BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS activities_church_id_idx ON public.activities(church_id);
CREATE INDEX IF NOT EXISTS activities_class_id_idx ON public.activities(class_id);
CREATE INDEX IF NOT EXISTS activities_activity_date_idx ON public.activities(activity_date);
CREATE INDEX IF NOT EXISTS activities_is_published_idx ON public.activities(is_published);

-- =====================================================
-- 3. TRIPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  trip_date DATE NOT NULL,
  return_date DATE,
  departure_time TIME,
  return_time TIME,
  meeting_point TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  max_participants INTEGER,
  requires_parent_approval BOOLEAN DEFAULT true,
  transportation_details TEXT,
  what_to_bring TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS trips_church_id_idx ON public.trips(church_id);
CREATE INDEX IF NOT EXISTS trips_trip_date_idx ON public.trips(trip_date);
CREATE INDEX IF NOT EXISTS trips_is_published_idx ON public.trips(is_published);

-- =====================================================
-- 4. STORE ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('book', 'supply', 'uniform', 'gift', 'other')),
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS store_items_church_id_idx ON public.store_items(church_id);
CREATE INDEX IF NOT EXISTS store_items_category_idx ON public.store_items(category);
CREATE INDEX IF NOT EXISTS store_items_is_available_idx ON public.store_items(is_available);

-- =====================================================
-- 5. TASKS TABLE (For Teachers)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_class_id_idx ON public.tasks(class_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER set_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.lessons IS 'Lesson plans and content for classes';
COMMENT ON TABLE public.activities IS 'Activities available to students (games, crafts, worship, etc.)';
COMMENT ON TABLE public.trips IS 'Field trips and outings organized by the church';
COMMENT ON TABLE public.store_items IS 'Items available in the Sunday school store';
COMMENT ON TABLE public.tasks IS 'Tasks assigned to teachers and staff';
