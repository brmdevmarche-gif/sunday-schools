-- Fix missing columns in servants table
-- Run this if you get column not found errors

-- Add missing columns to servants table if they don't exist
DO $$ 
BEGIN 
    -- Check and add emergency_contact_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servants' 
        AND column_name = 'emergency_contact_name'
    ) THEN
        ALTER TABLE servants ADD COLUMN emergency_contact_name VARCHAR(255);
    END IF;

    -- Check and add emergency_contact_phone column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servants' 
        AND column_name = 'emergency_contact_phone'
    ) THEN
        ALTER TABLE servants ADD COLUMN emergency_contact_phone VARCHAR(20);
    END IF;

    -- Check and add other potentially missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servants' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE servants ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servants' 
        AND column_name = 'specialization'
    ) THEN
        ALTER TABLE servants ADD COLUMN specialization VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servants' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE servants ADD COLUMN notes TEXT;
    END IF;
END $$;