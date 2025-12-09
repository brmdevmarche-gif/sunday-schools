-- =====================================================
-- Store Orders System
-- =====================================================
-- This migration creates tables for managing store orders

-- Create order status enum type
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'approved',
    'fulfilled',
    'cancelled',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create price tier enum type
DO $$ BEGIN
  CREATE TYPE price_tier AS ENUM (
    'normal',
    'mastor',
    'botl'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create orders table (order header)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who placed the order
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Student's class (for context)
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,

  -- Order status
  status order_status NOT NULL DEFAULT 'pending',

  -- Total points for the order
  total_points INTEGER NOT NULL DEFAULT 0,

  -- Notes from the user
  notes TEXT,

  -- Admin notes/response
  admin_notes TEXT,

  -- Who approved/rejected/fulfilled the order
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_items table (line items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to order
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Reference to store item
  store_item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,

  -- Snapshot of item details at time of order (in case item changes later)
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  item_image_url TEXT,

  -- Quantity ordered
  quantity INTEGER NOT NULL DEFAULT 1,

  -- Price tier used for this order
  price_tier price_tier NOT NULL,

  -- Price per unit at time of order
  unit_price INTEGER NOT NULL,

  -- Total price for this line item
  total_price INTEGER NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_class_id ON public.orders(class_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_processed_by ON public.orders(processed_by);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store_item_id ON public.order_items(store_item_id);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ====================
-- RLS POLICIES: ORDERS
-- ====================

-- SELECT: Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Admins can view orders based on their scope
CREATE POLICY "Admins can view orders in their scope"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        -- Super admin can see all orders
        u.role = 'super_admin'
        OR
        -- Diocese admin can see orders from their diocese
        (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.users order_user
          WHERE order_user.id = orders.user_id
          AND order_user.diocese_id = u.diocese_id
        ))
        OR
        -- Church admin can see orders from their church
        (u.role = 'church_admin' AND EXISTS (
          SELECT 1 FROM public.users order_user
          WHERE order_user.id = orders.user_id
          AND order_user.church_id = u.church_id
        ))
      )
    )
  );

-- INSERT: Authenticated users can create orders
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own pending orders
CREATE POLICY "Users can update own pending orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- UPDATE: Admins can update orders in their scope
CREATE POLICY "Admins can update orders in their scope"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        -- Super admin can update all orders
        u.role = 'super_admin'
        OR
        -- Diocese admin can update orders from their diocese
        (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.users order_user
          WHERE order_user.id = orders.user_id
          AND order_user.diocese_id = u.diocese_id
        ))
        OR
        -- Church admin can update orders from their church
        (u.role = 'church_admin' AND EXISTS (
          SELECT 1 FROM public.users order_user
          WHERE order_user.id = orders.user_id
          AND order_user.church_id = u.church_id
        ))
      )
    )
  );

-- DELETE: Users can delete their own pending orders
CREATE POLICY "Users can delete own pending orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- ====================
-- RLS POLICIES: ORDER_ITEMS
-- ====================

-- SELECT: Users can view items from their own orders
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- SELECT: Admins can view order items based on their scope
CREATE POLICY "Admins can view order items in their scope"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.users order_user ON order_user.id = o.user_id
      JOIN public.users admin ON admin.id = auth.uid()
      WHERE o.id = order_items.order_id
      AND (
        -- Super admin can see all order items
        admin.role = 'super_admin'
        OR
        -- Diocese admin can see order items from their diocese
        (admin.role = 'diocese_admin' AND order_user.diocese_id = admin.diocese_id)
        OR
        -- Church admin can see order items from their church
        (admin.role = 'church_admin' AND order_user.church_id = admin.church_id)
      )
    )
  );

-- INSERT: Users can add items to their own orders
CREATE POLICY "Users can add items to own orders"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'pending'
    )
  );

-- UPDATE: Users can update items in their own pending orders
CREATE POLICY "Users can update own order items"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'pending'
    )
  );

-- DELETE: Users can delete items from their own pending orders
CREATE POLICY "Users can delete own order items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
      AND orders.status = 'pending'
    )
  );

-- Add updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.orders IS 'Store orders placed by students and parents';
COMMENT ON TABLE public.order_items IS 'Line items for store orders';
COMMENT ON COLUMN public.orders.status IS 'Order status: pending, approved, fulfilled, cancelled, rejected';
COMMENT ON COLUMN public.order_items.price_tier IS 'Price tier used: normal, mastor, botl';
COMMENT ON COLUMN public.order_items.unit_price IS 'Price per unit at time of order (snapshot)';
