-- Fix foreign key relationships for stores table
-- This ensures Supabase can properly resolve the relationships

-- Add foreign key constraint for manager_id if it doesn't exist
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
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
END $$;

-- Add foreign key constraint for church_id if it doesn't exist
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
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

-- Verify the relationships are working
SELECT 
    s.id,
    s.name as store_name,
    c.name as church_name,
    srv.first_name || ' ' || srv.last_name as manager_name
FROM stores s
LEFT JOIN churches c ON s.church_id = c.id
LEFT JOIN servants srv ON s.manager_id = srv.id
LIMIT 5;