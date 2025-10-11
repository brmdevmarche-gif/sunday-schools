-- Sunday School Management System Database Schema
-- This script creates all the necessary tables for managing diocese, churches, servants, students, and activities

-- Diocese table - represents different dioceses
CREATE TABLE IF NOT EXISTS diocese (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    bishop_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Churches table - represents individual churches within dioceses
CREATE TABLE IF NOT EXISTS churches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    diocese_id INTEGER REFERENCES diocese(id) ON DELETE CASCADE,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    priest_name VARCHAR(255),
    established_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servants table - represents teachers and volunteers
CREATE TABLE IF NOT EXISTS servants (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    role VARCHAR(100), -- e.g., 'Teacher', 'Assistant', 'Coordinator'
    specialization VARCHAR(255), -- e.g., 'Youth Ministry', 'Music', 'Arts'
    start_date DATE,
    is_active BOOLEAN DEFAULT true,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Groups table - represents different class groups/levels
CREATE TABLE IF NOT EXISTS class_groups (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., 'Kindergarten', 'Grade 1-2', 'Youth'
    description TEXT,
    age_range VARCHAR(50), -- e.g., '5-6 years', '7-9 years'
    max_capacity INTEGER,
    primary_servant_id INTEGER REFERENCES servants(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table - represents students in the Sunday School
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
    class_group_id INTEGER REFERENCES class_groups(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    parent_guardian_name VARCHAR(255),
    parent_guardian_phone VARCHAR(20),
    parent_guardian_email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT,
    allergies TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Church Activities table - represents various activities and events
CREATE TABLE IF NOT EXISTS church_activities (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(100), -- e.g., 'Service', 'Event', 'Class', 'Trip'
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    max_participants INTEGER,
    registration_required BOOLEAN DEFAULT false,
    cost DECIMAL(10,2) DEFAULT 0.00,
    organizer_servant_id INTEGER REFERENCES servants(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Activity Participation table - tracks which students participate in which activities
CREATE TABLE IF NOT EXISTS student_activity_participation (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    activity_id INTEGER REFERENCES church_activities(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'absent', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'waived'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, activity_id)
);

-- Offers table - represents special offers or programs
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    offer_type VARCHAR(100), -- e.g., 'Scholarship', 'Discount', 'Free Program'
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    valid_from DATE,
    valid_until DATE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table - represents curriculum lessons
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
    class_group_id INTEGER REFERENCES class_groups(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lesson_content TEXT,
    scripture_reference VARCHAR(255),
    lesson_date DATE,
    duration_minutes INTEGER,
    materials_needed TEXT,
    learning_objectives TEXT,
    teacher_servant_id INTEGER REFERENCES servants(id),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_churches_diocese_id ON churches(diocese_id);
CREATE INDEX IF NOT EXISTS idx_servants_church_id ON servants(church_id);
CREATE INDEX IF NOT EXISTS idx_students_church_id ON students(church_id);
CREATE INDEX IF NOT EXISTS idx_students_class_group_id ON students(class_group_id);
CREATE INDEX IF NOT EXISTS idx_class_groups_church_id ON class_groups(church_id);
CREATE INDEX IF NOT EXISTS idx_church_activities_church_id ON church_activities(church_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_participation_student_id ON student_activity_participation(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_participation_activity_id ON student_activity_participation(activity_id);
CREATE INDEX IF NOT EXISTS idx_offers_church_id ON offers(church_id);
CREATE INDEX IF NOT EXISTS idx_lessons_church_id ON lessons(church_id);
CREATE INDEX IF NOT EXISTS idx_lessons_class_group_id ON lessons(class_group_id);
