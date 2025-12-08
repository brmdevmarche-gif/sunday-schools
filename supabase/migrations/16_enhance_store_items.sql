-- Migration: Enhance store items with stock types, multi-church support, and class assignments
-- Created: 2025-12-02

-- Add stock_type column to store_items
ALTER TABLE public.store_items
ADD COLUMN IF NOT EXISTS stock_type VARCHAR(20) NOT NULL DEFAULT 'quantity'
CHECK (stock_type IN ('on_demand', 'quantity'));

-- Create junction table for store items and churches (many-to-many)
CREATE TABLE IF NOT EXISTS public.store_item_churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_item_id, church_id)
);

-- Create junction table for store items and dioceses (many-to-many)
CREATE TABLE IF NOT EXISTS public.store_item_dioceses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  diocese_id UUID NOT NULL REFERENCES public.dioceses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_item_id, diocese_id)
);

-- Create junction table for store items and classes (many-to-many)
CREATE TABLE IF NOT EXISTS public.store_item_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_item_id, class_id)
);

-- Add is_available_to_all_classes flag to store_items
ALTER TABLE public.store_items
ADD COLUMN IF NOT EXISTS is_available_to_all_classes BOOLEAN NOT NULL DEFAULT true;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_store_item_churches_store_item
  ON public.store_item_churches(store_item_id);

CREATE INDEX IF NOT EXISTS idx_store_item_churches_church
  ON public.store_item_churches(church_id);

CREATE INDEX IF NOT EXISTS idx_store_item_dioceses_store_item
  ON public.store_item_dioceses(store_item_id);

CREATE INDEX IF NOT EXISTS idx_store_item_dioceses_diocese
  ON public.store_item_dioceses(diocese_id);

CREATE INDEX IF NOT EXISTS idx_store_item_classes_store_item
  ON public.store_item_classes(store_item_id);

CREATE INDEX IF NOT EXISTS idx_store_item_classes_class
  ON public.store_item_classes(class_id);

-- Migrate existing data: if store_items has church_id, create entries in junction table
INSERT INTO public.store_item_churches (store_item_id, church_id)
SELECT id, church_id
FROM public.store_items
WHERE church_id IS NOT NULL
ON CONFLICT (store_item_id, church_id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.store_item_churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_item_dioceses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_item_classes ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist (to recreate them)
DROP POLICY IF EXISTS "store_item_churches_select_policy" ON public.store_item_churches;
DROP POLICY IF EXISTS "store_item_churches_insert_policy" ON public.store_item_churches;
DROP POLICY IF EXISTS "store_item_churches_update_policy" ON public.store_item_churches;
DROP POLICY IF EXISTS "store_item_churches_delete_policy" ON public.store_item_churches;
DROP POLICY IF EXISTS "store_item_dioceses_select_policy" ON public.store_item_dioceses;
DROP POLICY IF EXISTS "store_item_dioceses_insert_policy" ON public.store_item_dioceses;
DROP POLICY IF EXISTS "store_item_dioceses_update_policy" ON public.store_item_dioceses;
DROP POLICY IF EXISTS "store_item_dioceses_delete_policy" ON public.store_item_dioceses;
DROP POLICY IF EXISTS "store_item_classes_select_policy" ON public.store_item_classes;
DROP POLICY IF EXISTS "store_item_classes_insert_policy" ON public.store_item_classes;
DROP POLICY IF EXISTS "store_item_classes_update_policy" ON public.store_item_classes;
DROP POLICY IF EXISTS "store_item_classes_delete_policy" ON public.store_item_classes;

-- RLS Policies for store_item_churches
CREATE POLICY "store_item_churches_select_policy" ON public.store_item_churches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

CREATE POLICY "store_item_churches_insert_policy" ON public.store_item_churches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'church_admin')
    )
  );

CREATE POLICY "store_item_churches_update_policy" ON public.store_item_churches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'church_admin')
    )
  );

CREATE POLICY "store_item_churches_delete_policy" ON public.store_item_churches
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'church_admin')
    )
  );

-- RLS Policies for store_item_dioceses
CREATE POLICY "store_item_dioceses_select_policy" ON public.store_item_dioceses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

CREATE POLICY "store_item_dioceses_insert_policy" ON public.store_item_dioceses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "store_item_dioceses_update_policy" ON public.store_item_dioceses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "store_item_dioceses_delete_policy" ON public.store_item_dioceses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- RLS Policies for store_item_classes
CREATE POLICY "store_item_classes_select_policy" ON public.store_item_classes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

CREATE POLICY "store_item_classes_insert_policy" ON public.store_item_classes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'church_admin')
    )
  );

CREATE POLICY "store_item_classes_update_policy" ON public.store_item_classes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'church_admin')
    )
  );

CREATE POLICY "store_item_classes_delete_policy" ON public.store_item_classes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'church_admin')
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.store_item_churches IS 'Junction table for many-to-many relationship between store items and churches';
COMMENT ON TABLE public.store_item_dioceses IS 'Junction table for many-to-many relationship between store items and dioceses. When populated, item is available to all churches in those dioceses.';
COMMENT ON TABLE public.store_item_classes IS 'Junction table for many-to-many relationship between store items and classes. If empty and is_available_to_all_classes is true, item is available to all classes.';
COMMENT ON COLUMN public.store_items.stock_type IS 'Type of stock management: on_demand (unlimited) or quantity (limited stock)';
COMMENT ON COLUMN public.store_items.is_available_to_all_classes IS 'If true, item is available to all classes. If false, only available to classes in store_item_classes table.';
