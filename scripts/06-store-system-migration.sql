-- Store System Migration Script
-- This script creates all store-related tables for the Sunday School Management System

-- Create store_items_catalog table
CREATE TABLE IF NOT EXISTS store_items_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC DEFAULT 0,
    points_cost INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update stores table with missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'manager_id') THEN
        ALTER TABLE stores ADD COLUMN manager_id UUID REFERENCES servants(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'location') THEN
        ALTER TABLE stores ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'contact') THEN
        ALTER TABLE stores ADD COLUMN contact TEXT;
    END IF;
END $$;

-- Create store_item_stock table
CREATE TABLE IF NOT EXISTS store_item_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items_catalog(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(store_id, item_id)
);

-- Create store_class_assignments table
CREATE TABLE IF NOT EXISTS store_class_assignments (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES class_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (store_id, class_group_id)
);

-- Create student_wallets table
CREATE TABLE IF NOT EXISTS student_wallets (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE PRIMARY KEY,
    points_balance BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create store_order_requests table
CREATE TABLE IF NOT EXISTS store_order_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES class_groups(id),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES servants(id),
    status order_status DEFAULT 'requested',
    payment_method TEXT DEFAULT 'points',
    total_points BIGINT DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    manager_id UUID REFERENCES servants(id),
    reviewed_at TIMESTAMPTZ,
    purchased_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create store_order_items table
CREATE TABLE IF NOT EXISTS store_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES store_order_requests(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items_catalog(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    unit_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create store_order_state_history table
CREATE TABLE IF NOT EXISTS store_order_state_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES store_order_requests(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status,
    changed_by UUID REFERENCES servants(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraints for stores table if they don't exist
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists for manager_id
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'stores_manager_id_fkey' 
        AND table_name = 'stores'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE stores 
        ADD CONSTRAINT stores_manager_id_fkey 
        FOREIGN KEY (manager_id) REFERENCES servants(id);
    END IF;

    -- Check if the foreign key constraint exists for church_id
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'stores_church_id_fkey' 
        AND table_name = 'stores'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE stores 
        ADD CONSTRAINT stores_church_id_fkey 
        FOREIGN KEY (church_id) REFERENCES churches(id);
    END IF;
END $$;

-- Add indexes for store system
CREATE INDEX IF NOT EXISTS idx_store_item_stock_store_id ON store_item_stock(store_id);
CREATE INDEX IF NOT EXISTS idx_store_item_stock_item_id ON store_item_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_store_class_assignments_store_id ON store_class_assignments(store_id);
CREATE INDEX IF NOT EXISTS idx_store_class_assignments_class_group_id ON store_class_assignments(class_group_id);
CREATE INDEX IF NOT EXISTS idx_student_wallets_student_id ON student_wallets(student_id);
CREATE INDEX IF NOT EXISTS idx_store_order_requests_store_id ON store_order_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_store_order_requests_student_id ON store_order_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_store_order_requests_status ON store_order_requests(status);
CREATE INDEX IF NOT EXISTS idx_store_order_items_order_id ON store_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_store_order_items_item_id ON store_order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_store_order_state_history_order_id ON store_order_state_history(order_id);

-- Sample store system data
INSERT INTO store_items_catalog (sku, name, description, unit_price, points_cost) VALUES
('BOOK001', 'Bible Stories Book', 'Illustrated bible stories for children', 15.00, 50),
('PEN001', 'Cross Pen', 'Pen with cross design', 5.00, 20),
('CARD001', 'Prayer Cards', 'Set of 10 prayer cards', 8.00, 30),
('STICKER001', 'Bible Verse Stickers', 'Colorful bible verse stickers', 3.00, 15)
ON CONFLICT (sku) DO NOTHING;

-- Verify the store relationships are working
SELECT 
    s.id,
    s.name as store_name,
    c.name as church_name,
    srv.first_name || ' ' || srv.last_name as manager_name
FROM stores s
LEFT JOIN churches c ON s.church_id = c.id
LEFT JOIN servants srv ON s.manager_id = srv.id
LIMIT 5;