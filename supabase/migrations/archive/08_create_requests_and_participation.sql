-- =====================================================
-- SUNDAY SCHOOL MANAGEMENT SYSTEM - REQUESTS & PARTICIPATION
-- =====================================================

-- =====================================================
-- 1. REQUESTS TABLE (Parent Approvals)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('trip', 'activity', 'purchase', 'other')),
  related_id UUID, -- ID of the related trip, activity, or store item
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2), -- For purchase requests
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS requests_student_id_idx ON public.requests(student_id);
CREATE INDEX IF NOT EXISTS requests_parent_id_idx ON public.requests(parent_id);
CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests(status);
CREATE INDEX IF NOT EXISTS requests_request_type_idx ON public.requests(request_type);

-- =====================================================
-- 2. ACTIVITY PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'waitlist', 'attended', 'cancelled')),
  parent_approved BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(activity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS activity_participants_activity_id_idx ON public.activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS activity_participants_user_id_idx ON public.activity_participants(user_id);
CREATE INDEX IF NOT EXISTS activity_participants_status_idx ON public.activity_participants(registration_status);

-- =====================================================
-- 3. TRIP PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trip_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'waitlist', 'confirmed', 'cancelled')),
  parent_approved BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  medical_info TEXT,
  emergency_contact TEXT,
  attended BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(trip_id, user_id)
);

-- Enable RLS
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS trip_participants_trip_id_idx ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS trip_participants_user_id_idx ON public.trip_participants(user_id);
CREATE INDEX IF NOT EXISTS trip_participants_status_idx ON public.trip_participants(registration_status);

-- =====================================================
-- 4. STORE ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'paid', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  parent_approved BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS store_orders_user_id_idx ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS store_orders_status_idx ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS store_orders_payment_status_idx ON public.store_orders(payment_status);

-- =====================================================
-- 5. STORE ORDER ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.store_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.store_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS store_order_items_order_id_idx ON public.store_order_items(order_id);
CREATE INDEX IF NOT EXISTS store_order_items_item_id_idx ON public.store_order_items(item_id);

-- =====================================================
-- 6. ATTENDANCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused', 'late')),
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, user_id, attendance_date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS attendance_class_id_idx ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS attendance_user_id_idx ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS attendance_status_idx ON public.attendance(status);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER set_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.requests IS 'Requests from students that require parent approval';
COMMENT ON TABLE public.activity_participants IS 'Tracks who registered for and attended activities';
COMMENT ON TABLE public.trip_participants IS 'Tracks who registered for and attended trips';
COMMENT ON TABLE public.store_orders IS 'Orders placed in the Sunday school store';
COMMENT ON TABLE public.store_order_items IS 'Items in each store order';
COMMENT ON TABLE public.attendance IS 'Daily attendance tracking for classes';
