-- Comprehensive Schema Update for Sunday School Management System
-- This script updates the database to match the current production schema
-- Run this script to sync your database with the actual schema structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update diocese table to use UUID and add missing columns
DO $$ 
BEGIN
    -- Add columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diocese' AND column_name = 'description') THEN
        ALTER TABLE diocese ADD COLUMN description TEXT DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diocese' AND column_name = 'territory') THEN
        ALTER TABLE diocese ADD COLUMN territory VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diocese' AND column_name = 'address') THEN
        ALTER TABLE diocese ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diocese' AND column_name = 'created_by') THEN
        ALTER TABLE diocese ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diocese' AND column_name = 'updated_by') THEN
        ALTER TABLE diocese ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diocese' AND column_name = 'deleted') THEN
        ALTER TABLE diocese ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update churches table with missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'pastor_name') THEN
        ALTER TABLE churches ADD COLUMN pastor_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'latitude') THEN
        ALTER TABLE churches ADD COLUMN latitude NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'longitude') THEN
        ALTER TABLE churches ADD COLUMN longitude NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'location') THEN
        ALTER TABLE churches ADD COLUMN location POINT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'is_active') THEN
        ALTER TABLE churches ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'created_by') THEN
        ALTER TABLE churches ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'updated_by') THEN
        ALTER TABLE churches ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'churches' AND column_name = 'deleted') THEN
        ALTER TABLE churches ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create enum types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'servant_role') THEN
        CREATE TYPE servant_role AS ENUM ('servant', 'teacher', 'coordinator', 'assistant', 'manager');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'year_type') THEN
        CREATE TYPE year_type AS ENUM ('kg', 'primary', 'preparatory', 'secondary');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM ('service', 'event', 'class', 'trip', 'meeting', 'workshop');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('requested', 'reviewing', 'approved', 'purchased', 'ready_for_pickup', 'collected', 'cancelled', 'rejected');
    END IF;
END $$;

-- Create areas table if it doesn't exist
CREATE TABLE IF NOT EXISTS areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create area_churches junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS area_churches (
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (area_id, church_id)
);

-- Update students table with missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'year_type') THEN
        ALTER TABLE students ADD COLUMN year_type year_type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'class_group') THEN
        ALTER TABLE students ADD COLUMN class_group VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'parent_name') THEN
        ALTER TABLE students ADD COLUMN parent_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'parent_phone') THEN
        ALTER TABLE students ADD COLUMN parent_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'parent_email') THEN
        ALTER TABLE students ADD COLUMN parent_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'medical_notes') THEN
        ALTER TABLE students ADD COLUMN medical_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'notes') THEN
        ALTER TABLE students ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'image_url') THEN
        ALTER TABLE students ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'image_storage_path') THEN
        ALTER TABLE students ADD COLUMN image_storage_path TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'latitude') THEN
        ALTER TABLE students ADD COLUMN latitude NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'longitude') THEN
        ALTER TABLE students ADD COLUMN longitude NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'area_id') THEN
        ALTER TABLE students ADD COLUMN area_id UUID REFERENCES areas(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'start_date') THEN
        ALTER TABLE students ADD COLUMN start_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'end_date') THEN
        ALTER TABLE students ADD COLUMN end_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'created_by') THEN
        ALTER TABLE students ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'updated_by') THEN
        ALTER TABLE students ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'deleted') THEN
        ALTER TABLE students ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update class_groups table with missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_groups' AND column_name = 'year_type') THEN
        ALTER TABLE class_groups ADD COLUMN year_type year_type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_groups' AND column_name = 'room_number') THEN
        ALTER TABLE class_groups ADD COLUMN room_number VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_groups' AND column_name = 'meeting_time') THEN
        ALTER TABLE class_groups ADD COLUMN meeting_time TIME;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_groups' AND column_name = 'meeting_day') THEN
        ALTER TABLE class_groups ADD COLUMN meeting_day VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_groups' AND column_name = 'created_by') THEN
        ALTER TABLE class_groups ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_groups' AND column_name = 'updated_by') THEN
        ALTER TABLE class_groups ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_groups' AND column_name = 'deleted') THEN
        ALTER TABLE class_groups ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create student_class_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_class_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES class_groups(id) ON DELETE CASCADE,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

-- Create servant_class_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS servant_class_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servant_id UUID REFERENCES servants(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES class_groups(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'teacher',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

-- Create student_attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_group_id UUID REFERENCES class_groups(id) ON DELETE CASCADE,
    attendance_date DATE DEFAULT CURRENT_DATE,
    status attendance_status DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

-- Create servant_attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS servant_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servant_id UUID REFERENCES servants(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES church_activities(id) ON DELETE CASCADE,
    status attendance_status DEFAULT 'present',
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

-- Update church_activities table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_activities' AND column_name = 'title') THEN
        ALTER TABLE church_activities ADD COLUMN title VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_activities' AND column_name = 'activity_type') THEN
        ALTER TABLE church_activities ADD COLUMN activity_type activity_type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_activities' AND column_name = 'organizer_id') THEN
        ALTER TABLE church_activities ADD COLUMN organizer_id UUID REFERENCES servants(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_activities' AND column_name = 'target_audience') THEN
        ALTER TABLE church_activities ADD COLUMN target_audience year_type[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_activities' AND column_name = 'created_by') THEN
        ALTER TABLE church_activities ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_activities' AND column_name = 'updated_by') THEN
        ALTER TABLE church_activities ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'church_activities' AND column_name = 'deleted') THEN
        ALTER TABLE church_activities ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update student_activity_participation table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_activity_participation' AND column_name = 'attended') THEN
        ALTER TABLE student_activity_participation ADD COLUMN attended BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_activity_participation' AND column_name = 'created_by') THEN
        ALTER TABLE student_activity_participation ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_activity_participation' AND column_name = 'updated_by') THEN
        ALTER TABLE student_activity_participation ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_activity_participation' AND column_name = 'deleted') THEN
        ALTER TABLE student_activity_participation ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update offers table to match schema
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'amount') THEN
        ALTER TABLE offers ADD COLUMN amount NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'donor_name') THEN
        ALTER TABLE offers ADD COLUMN donor_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'donor_type') THEN
        ALTER TABLE offers ADD COLUMN donor_type VARCHAR(100) DEFAULT 'anonymous';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'purpose') THEN
        ALTER TABLE offers ADD COLUMN purpose VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'offer_date') THEN
        ALTER TABLE offers ADD COLUMN offer_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'payment_method') THEN
        ALTER TABLE offers ADD COLUMN payment_method VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'reference_number') THEN
        ALTER TABLE offers ADD COLUMN reference_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'notes') THEN
        ALTER TABLE offers ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'created_by') THEN
        ALTER TABLE offers ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'updated_by') THEN
        ALTER TABLE offers ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'deleted') THEN
        ALTER TABLE offers ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update lessons table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'year_type') THEN
        ALTER TABLE lessons ADD COLUMN year_type year_type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'bible_passage') THEN
        ALTER TABLE lessons ADD COLUMN bible_passage VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'materials') THEN
        ALTER TABLE lessons ADD COLUMN materials TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'created_by') THEN
        ALTER TABLE lessons ADD COLUMN created_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'updated_by') THEN
        ALTER TABLE lessons ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'deleted') THEN
        ALTER TABLE lessons ADD COLUMN deleted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create class_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_group_id UUID REFERENCES class_groups(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    session_date DATE DEFAULT CURRENT_DATE,
    start_time TIME,
    end_time TIME,
    attendance_taken BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

-- Create users table (application users) if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'published',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_student_id ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_group_id ON student_class_assignments(class_group_id);
CREATE INDEX IF NOT EXISTS idx_servant_class_assignments_servant_id ON servant_class_assignments(servant_id);
CREATE INDEX IF NOT EXISTS idx_servant_class_assignments_class_group_id ON servant_class_assignments(class_group_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student_id ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_class_group_id ON student_attendance(class_group_id);
CREATE INDEX IF NOT EXISTS idx_servant_attendance_servant_id ON servant_attendance(servant_id);
CREATE INDEX IF NOT EXISTS idx_servant_attendance_activity_id ON servant_attendance(activity_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_group_id ON class_sessions(class_group_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_lesson_id ON class_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_area_churches_area_id ON area_churches(area_id);
CREATE INDEX IF NOT EXISTS idx_area_churches_church_id ON area_churches(church_id);