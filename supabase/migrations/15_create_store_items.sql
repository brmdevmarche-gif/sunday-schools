-- =====================================================
-- Store Items Table
-- =====================================================
-- This table stores items available in the church store
-- Each item has different prices for different student cases

-- Create store_items table
CREATE TABLE IF NOT EXISTS public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Stock management
  stock_quantity INTEGER NOT NULL DEFAULT 0,

  -- Pricing for different student cases (in points)
  price_normal INTEGER NOT NULL,
  price_mastor INTEGER NOT NULL,
  price_botl INTEGER NOT NULL,

  -- Church association (NULL means available to all churches)
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_items_church_id ON public.store_items(church_id);
CREATE INDEX IF NOT EXISTS idx_store_items_is_active ON public.store_items(is_active);
CREATE INDEX IF NOT EXISTS idx_store_items_created_at ON public.store_items(created_at DESC);

-- Enable RLS
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_items

-- SELECT: Students can view active items from their church or global items
CREATE POLICY "Students can view store items"
  ON public.store_items FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      church_id IS NULL
      OR church_id IN (
        SELECT church_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- SELECT: Admins can view all items
CREATE POLICY "Admins can view all store items"
  ON public.store_items FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'church_admin')
  );

-- INSERT: Only super admin and church admin can create items
CREATE POLICY "Admins can insert store items"
  ON public.store_items FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'church_admin')
  );

-- UPDATE: Only super admin and church admin can update items
CREATE POLICY "Admins can update store items"
  ON public.store_items FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'church_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'church_admin')
  );

-- DELETE: Only super admin and church admin can delete items
CREATE POLICY "Admins can delete store items"
  ON public.store_items FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid())
    IN ('super_admin', 'church_admin')
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_store_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW
  EXECUTE FUNCTION update_store_items_updated_at();

-- Add comment
COMMENT ON TABLE public.store_items IS 'Store items with different pricing tiers for student cases';
