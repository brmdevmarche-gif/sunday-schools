-- =====================================================
-- Enhanced Activities System Migration
-- =====================================================
-- This migration adds three new sub-modules to Activities:
-- 1. Spiritual Notes - Track daily spiritual practices
-- 2. Competitions - Contests with various submission types
-- 3. Daily Readings - Bible reading schedules
-- =====================================================

-- =====================================================
-- PART 1: NEW ENUMS
-- =====================================================

-- Spiritual activity types
DO $$ BEGIN
  CREATE TYPE spiritual_activity_type AS ENUM (
    'prayer',
    'mass',
    'confession',
    'fasting',
    'bible_reading',
    'charity',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Competition submission types
DO $$ BEGIN
  CREATE TYPE competition_submission_type AS ENUM (
    'text',
    'pdf_upload',
    'google_form'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Submission status (shared across modules)
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'needs_revision'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new points transaction types
DO $$ BEGIN
  ALTER TYPE points_transaction_type ADD VALUE IF NOT EXISTS 'spiritual_note';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE points_transaction_type ADD VALUE IF NOT EXISTS 'competition_submission';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE points_transaction_type ADD VALUE IF NOT EXISTS 'reading_completion';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PART 2: SPIRITUAL NOTES TABLES
-- =====================================================

-- Templates for spiritual activities (admin-defined)
CREATE TABLE IF NOT EXISTS public.spiritual_activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Activity type
  activity_type spiritual_activity_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),  -- Arabic name
  description TEXT,
  description_ar TEXT,   -- Arabic description
  icon VARCHAR(50),      -- Icon identifier (e.g., 'church', 'book', 'heart')

  -- Points configuration
  base_points INTEGER NOT NULL DEFAULT 5,
  max_per_day INTEGER DEFAULT 1,  -- Limit submissions per day (null = unlimited)

  -- Scoping (null = available to all at that level)
  diocese_id UUID REFERENCES public.dioceses(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student spiritual notes submissions
CREATE TABLE IF NOT EXISTS public.spiritual_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to user
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Activity categorization
  activity_type spiritual_activity_type NOT NULL,
  custom_type VARCHAR(100),  -- For 'other' type

  -- Reference to template (optional)
  activity_template_id UUID REFERENCES public.spiritual_activity_templates(id) ON DELETE SET NULL,

  -- Content
  title VARCHAR(255),
  description TEXT,

  -- Date of activity (when the spiritual activity happened)
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Scoping (inherited from user's class if not specified)
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,

  -- Approval workflow
  status submission_status NOT NULL DEFAULT 'submitted',
  points_requested INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,

  -- Teacher review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PART 3: COMPETITIONS TABLES
-- =====================================================

-- Competition definitions
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  image_url TEXT,

  -- Submission configuration
  submission_type competition_submission_type NOT NULL DEFAULT 'text',
  google_form_url TEXT,  -- For google_form type

  -- Instructions
  instructions TEXT,
  instructions_ar TEXT,
  submission_guidelines TEXT,
  submission_guidelines_ar TEXT,

  -- Time window
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Points configuration
  base_points INTEGER NOT NULL DEFAULT 10,    -- Points for participation
  first_place_bonus INTEGER DEFAULT 50,       -- Bonus for 1st place
  second_place_bonus INTEGER DEFAULT 30,      -- Bonus for 2nd place
  third_place_bonus INTEGER DEFAULT 20,       -- Bonus for 3rd place

  -- Capacity
  max_submissions INTEGER,  -- null = unlimited

  -- Scoping
  diocese_id UUID REFERENCES public.dioceses(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,

  -- Status
  status activity_status NOT NULL DEFAULT 'draft',

  -- Creator
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competition submissions
CREATE TABLE IF NOT EXISTS public.competition_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Content (based on submission type)
  text_content TEXT,
  file_url TEXT,  -- For PDF uploads (Supabase Storage URL)
  file_name VARCHAR(255),  -- Original file name
  file_size INTEGER,  -- File size in bytes
  google_form_response_id TEXT,  -- For Google Form tracking

  -- Grading
  status submission_status NOT NULL DEFAULT 'submitted',
  score INTEGER CHECK (score >= 0 AND score <= 100),  -- 0-100 score
  ranking INTEGER CHECK (ranking >= 1),  -- Position in competition (1st, 2nd, 3rd...)

  -- Points
  points_awarded INTEGER NOT NULL DEFAULT 0,

  -- Teacher review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  feedback_ar TEXT,

  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One submission per user per competition
  UNIQUE(competition_id, user_id)
);

-- =====================================================
-- PART 4: DAILY READINGS TABLES
-- =====================================================

-- Reading schedules (created by teachers/admins)
CREATE TABLE IF NOT EXISTS public.reading_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,

  -- Schedule period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Points configuration
  points_per_reading INTEGER NOT NULL DEFAULT 5,
  requires_approval BOOLEAN NOT NULL DEFAULT false,  -- Auto-approve by default

  -- Scoping
  diocese_id UUID REFERENCES public.dioceses(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Creator
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure end_date is after start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Daily reading assignments
CREATE TABLE IF NOT EXISTS public.reading_schedule_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  schedule_id UUID NOT NULL REFERENCES public.reading_schedules(id) ON DELETE CASCADE,

  -- Reading assignment
  reading_date DATE NOT NULL,

  -- Bible reference
  book_name VARCHAR(100) NOT NULL,       -- e.g., "Matthew", "Genesis"
  book_name_ar VARCHAR(100),             -- Arabic book name
  chapter_start INTEGER NOT NULL CHECK (chapter_start >= 1),
  chapter_end INTEGER CHECK (chapter_end >= chapter_start),  -- For multi-chapter
  verse_start INTEGER CHECK (verse_start >= 1),              -- Optional specific verses
  verse_end INTEGER CHECK (verse_end >= verse_start),

  -- Display reference
  reading_reference VARCHAR(255) NOT NULL,     -- e.g., "Matthew 5:1-12"
  reading_reference_ar VARCHAR(255),           -- Arabic reference

  -- Optional notes/context
  notes TEXT,
  notes_ar TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One reading per day per schedule
  UNIQUE(schedule_id, reading_date)
);

-- User reading completions
CREATE TABLE IF NOT EXISTS public.user_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  schedule_day_id UUID NOT NULL REFERENCES public.reading_schedule_days(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Completion record
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Favorite verse (optional but encouraged)
  favorite_verse_reference VARCHAR(100),  -- e.g., "Matthew 5:9"
  favorite_verse_text TEXT,               -- The verse text
  favorite_verse_text_ar TEXT,            -- Arabic verse (if entered)

  -- Optional reflection
  reflection TEXT,

  -- Approval workflow
  status submission_status NOT NULL DEFAULT 'approved',  -- Auto-approved by default
  points_awarded INTEGER NOT NULL DEFAULT 0,

  -- Teacher review (if requires_approval = true)
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One completion per day per user
  UNIQUE(schedule_day_id, user_id)
);

-- =====================================================
-- PART 5: INDEXES
-- =====================================================

-- Spiritual activity templates indexes
CREATE INDEX IF NOT EXISTS idx_spiritual_templates_type ON public.spiritual_activity_templates(activity_type);
CREATE INDEX IF NOT EXISTS idx_spiritual_templates_diocese ON public.spiritual_activity_templates(diocese_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_templates_church ON public.spiritual_activity_templates(church_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_templates_class ON public.spiritual_activity_templates(class_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_templates_active ON public.spiritual_activity_templates(is_active);

-- Spiritual notes indexes
CREATE INDEX IF NOT EXISTS idx_spiritual_notes_user ON public.spiritual_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_notes_type ON public.spiritual_notes(activity_type);
CREATE INDEX IF NOT EXISTS idx_spiritual_notes_date ON public.spiritual_notes(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_spiritual_notes_status ON public.spiritual_notes(status);
CREATE INDEX IF NOT EXISTS idx_spiritual_notes_class ON public.spiritual_notes(class_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_notes_template ON public.spiritual_notes(activity_template_id);

-- Competitions indexes
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON public.competitions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_competitions_diocese ON public.competitions(diocese_id);
CREATE INDEX IF NOT EXISTS idx_competitions_church ON public.competitions(church_id);
CREATE INDEX IF NOT EXISTS idx_competitions_class ON public.competitions(class_id);

-- Competition submissions indexes
CREATE INDEX IF NOT EXISTS idx_comp_submissions_competition ON public.competition_submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_submissions_user ON public.competition_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_submissions_status ON public.competition_submissions(status);
CREATE INDEX IF NOT EXISTS idx_comp_submissions_ranking ON public.competition_submissions(ranking);

-- Reading schedules indexes
CREATE INDEX IF NOT EXISTS idx_reading_schedules_dates ON public.reading_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reading_schedules_active ON public.reading_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_reading_schedules_diocese ON public.reading_schedules(diocese_id);
CREATE INDEX IF NOT EXISTS idx_reading_schedules_church ON public.reading_schedules(church_id);
CREATE INDEX IF NOT EXISTS idx_reading_schedules_class ON public.reading_schedules(class_id);

-- Reading schedule days indexes
CREATE INDEX IF NOT EXISTS idx_reading_days_schedule ON public.reading_schedule_days(schedule_id);
CREATE INDEX IF NOT EXISTS idx_reading_days_date ON public.reading_schedule_days(reading_date);

-- User readings indexes
CREATE INDEX IF NOT EXISTS idx_user_readings_schedule_day ON public.user_readings(schedule_day_id);
CREATE INDEX IF NOT EXISTS idx_user_readings_user ON public.user_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_readings_status ON public.user_readings(status);
CREATE INDEX IF NOT EXISTS idx_user_readings_completed ON public.user_readings(completed_at DESC);

-- =====================================================
-- PART 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.spiritual_activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_schedule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_readings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 7: RLS POLICIES - SPIRITUAL ACTIVITY TEMPLATES
-- =====================================================

-- SELECT: Users can view active templates in their scope
CREATE POLICY "Users can view spiritual activity templates in scope"
  ON public.spiritual_activity_templates FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      -- Template available to all
      (diocese_id IS NULL AND church_id IS NULL AND class_id IS NULL)
      OR
      -- Template in user's diocese
      diocese_id IN (SELECT diocese_id FROM public.users WHERE id = auth.uid())
      OR
      -- Template in user's church
      church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
      OR
      -- Template in user's class
      class_id IN (
        SELECT class_id FROM public.class_assignments
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- SELECT: Admins can view all templates
CREATE POLICY "Admins can view all spiritual activity templates"
  ON public.spiritual_activity_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- INSERT: Admins can create templates
CREATE POLICY "Admins can create spiritual activity templates"
  ON public.spiritual_activity_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- UPDATE: Admins can update templates in their scope
CREATE POLICY "Admins can update spiritual activity templates"
  ON public.spiritual_activity_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND spiritual_activity_templates.diocese_id = u.diocese_id)
        OR (u.role = 'church_admin' AND spiritual_activity_templates.church_id = u.church_id)
        OR (u.role = 'teacher' AND spiritual_activity_templates.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- DELETE: Only super_admin and creators can delete
CREATE POLICY "Super admins can delete spiritual activity templates"
  ON public.spiritual_activity_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'super_admin' OR id = spiritual_activity_templates.created_by)
    )
  );

-- =====================================================
-- PART 8: RLS POLICIES - SPIRITUAL NOTES
-- =====================================================

-- SELECT: Users can view their own notes
CREATE POLICY "Users can view own spiritual notes"
  ON public.spiritual_notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Teachers/admins can view notes in their scope
CREATE POLICY "Admins can view spiritual notes in scope"
  ON public.spiritual_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND EXISTS (
          SELECT 1 FROM public.users student
          WHERE student.id = spiritual_notes.user_id
          AND student.diocese_id = u.diocese_id
        ))
        OR (u.role = 'church_admin' AND EXISTS (
          SELECT 1 FROM public.users student
          WHERE student.id = spiritual_notes.user_id
          AND student.church_id = u.church_id
        ))
        OR (u.role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.class_assignments ca1
          JOIN public.class_assignments ca2 ON ca1.class_id = ca2.class_id
          WHERE ca1.user_id = u.id
          AND ca1.assignment_type = 'teacher'
          AND ca1.is_active = true
          AND ca2.user_id = spiritual_notes.user_id
          AND ca2.is_active = true
        ))
      )
    )
  );

-- INSERT: Users can create their own notes
CREATE POLICY "Users can create own spiritual notes"
  ON public.spiritual_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their pending notes
CREATE POLICY "Users can update own pending spiritual notes"
  ON public.spiritual_notes FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('draft', 'submitted', 'needs_revision')
  );

-- UPDATE: Admins can review notes in their scope
CREATE POLICY "Admins can review spiritual notes"
  ON public.spiritual_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- DELETE: Users can delete their draft notes
CREATE POLICY "Users can delete own draft spiritual notes"
  ON public.spiritual_notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');

-- =====================================================
-- PART 9: RLS POLICIES - COMPETITIONS
-- =====================================================

-- SELECT: Users can view active competitions in their scope
CREATE POLICY "Users can view competitions in scope"
  ON public.competitions FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND (
      (diocese_id IS NULL AND church_id IS NULL AND class_id IS NULL)
      OR diocese_id IN (SELECT diocese_id FROM public.users WHERE id = auth.uid())
      OR church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
      OR class_id IN (
        SELECT class_id FROM public.class_assignments
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- SELECT: Admins can view all competitions
CREATE POLICY "Admins can view all competitions"
  ON public.competitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- INSERT: Admins can create competitions
CREATE POLICY "Admins can create competitions"
  ON public.competitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- UPDATE: Admins can update competitions in their scope
CREATE POLICY "Admins can update competitions"
  ON public.competitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND competitions.diocese_id = u.diocese_id)
        OR (u.role = 'church_admin' AND competitions.church_id = u.church_id)
        OR (u.role = 'teacher' AND competitions.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- DELETE: Only super_admin and creators can delete
CREATE POLICY "Super admins can delete competitions"
  ON public.competitions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'super_admin' OR id = competitions.created_by)
    )
  );

-- =====================================================
-- PART 10: RLS POLICIES - COMPETITION SUBMISSIONS
-- =====================================================

-- SELECT: Users can view their own submissions
CREATE POLICY "Users can view own competition submissions"
  ON public.competition_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Admins can view submissions for their competitions
CREATE POLICY "Admins can view competition submissions"
  ON public.competition_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.competitions c ON c.id = competition_submissions.competition_id
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND c.diocese_id = u.diocese_id)
        OR (u.role = 'church_admin' AND c.church_id = u.church_id)
        OR (u.role = 'teacher' AND c.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- INSERT: Users can submit to competitions
CREATE POLICY "Users can submit to competitions"
  ON public.competition_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their draft/needs_revision submissions
CREATE POLICY "Users can update own submissions"
  ON public.competition_submissions FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('draft', 'needs_revision')
  );

-- UPDATE: Admins can review submissions
CREATE POLICY "Admins can review competition submissions"
  ON public.competition_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- DELETE: Users can delete draft submissions
CREATE POLICY "Users can delete draft submissions"
  ON public.competition_submissions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');

-- =====================================================
-- PART 11: RLS POLICIES - READING SCHEDULES
-- =====================================================

-- SELECT: Users can view active schedules in their scope
CREATE POLICY "Users can view reading schedules in scope"
  ON public.reading_schedules FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      (diocese_id IS NULL AND church_id IS NULL AND class_id IS NULL)
      OR diocese_id IN (SELECT diocese_id FROM public.users WHERE id = auth.uid())
      OR church_id IN (SELECT church_id FROM public.users WHERE id = auth.uid())
      OR class_id IN (
        SELECT class_id FROM public.class_assignments
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- SELECT: Admins can view all schedules
CREATE POLICY "Admins can view all reading schedules"
  ON public.reading_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- INSERT: Admins can create schedules
CREATE POLICY "Admins can create reading schedules"
  ON public.reading_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- UPDATE: Admins can update schedules in their scope
CREATE POLICY "Admins can update reading schedules"
  ON public.reading_schedules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND reading_schedules.diocese_id = u.diocese_id)
        OR (u.role = 'church_admin' AND reading_schedules.church_id = u.church_id)
        OR (u.role = 'teacher' AND reading_schedules.class_id IN (
          SELECT class_id FROM public.class_assignments
          WHERE user_id = u.id AND assignment_type = 'teacher' AND is_active = true
        ))
      )
    )
  );

-- DELETE: Only super_admin and creators can delete
CREATE POLICY "Super admins can delete reading schedules"
  ON public.reading_schedules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (role = 'super_admin' OR id = reading_schedules.created_by)
    )
  );

-- =====================================================
-- PART 12: RLS POLICIES - READING SCHEDULE DAYS
-- =====================================================

-- SELECT: Users can view days for schedules they can access
CREATE POLICY "Users can view reading schedule days"
  ON public.reading_schedule_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reading_schedules rs
      WHERE rs.id = reading_schedule_days.schedule_id
      AND rs.is_active = true
    )
  );

-- INSERT/UPDATE/DELETE: Only admins who can manage the schedule
CREATE POLICY "Admins can manage reading schedule days"
  ON public.reading_schedule_days FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- =====================================================
-- PART 13: RLS POLICIES - USER READINGS
-- =====================================================

-- SELECT: Users can view their own readings
CREATE POLICY "Users can view own readings"
  ON public.user_readings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Admins can view readings in their scope
CREATE POLICY "Admins can view user readings"
  ON public.user_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- INSERT: Users can record their own readings
CREATE POLICY "Users can record own readings"
  ON public.user_readings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their pending readings
CREATE POLICY "Users can update own readings"
  ON public.user_readings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- UPDATE: Admins can review readings
CREATE POLICY "Admins can review user readings"
  ON public.user_readings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher')
    )
  );

-- =====================================================
-- PART 14: TRIGGERS
-- =====================================================

-- Updated_at trigger for spiritual_activity_templates
CREATE TRIGGER spiritual_activity_templates_updated_at
  BEFORE UPDATE ON public.spiritual_activity_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Updated_at trigger for spiritual_notes
CREATE TRIGGER spiritual_notes_updated_at
  BEFORE UPDATE ON public.spiritual_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Updated_at trigger for competitions
CREATE TRIGGER competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Updated_at trigger for competition_submissions
CREATE TRIGGER competition_submissions_updated_at
  BEFORE UPDATE ON public.competition_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Updated_at trigger for reading_schedules
CREATE TRIGGER reading_schedules_updated_at
  BEFORE UPDATE ON public.reading_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- =====================================================
-- PART 15: HELPER FUNCTIONS
-- =====================================================

-- Function to check daily submission limit for spiritual notes
CREATE OR REPLACE FUNCTION public.check_spiritual_note_daily_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_max_per_day INTEGER;
  v_today_count INTEGER;
BEGIN
  -- Get max_per_day from template if specified
  IF NEW.activity_template_id IS NOT NULL THEN
    SELECT max_per_day INTO v_max_per_day
    FROM public.spiritual_activity_templates
    WHERE id = NEW.activity_template_id;

    IF v_max_per_day IS NOT NULL THEN
      -- Count today's submissions for this user and type
      SELECT COUNT(*) INTO v_today_count
      FROM public.spiritual_notes
      WHERE user_id = NEW.user_id
        AND activity_type = NEW.activity_type
        AND activity_date = NEW.activity_date
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

      IF v_today_count >= v_max_per_day THEN
        RAISE EXCEPTION 'Daily limit reached for this activity type. Maximum % per day allowed.', v_max_per_day;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_spiritual_note_limit
  BEFORE INSERT OR UPDATE ON public.spiritual_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_spiritual_note_daily_limit();

-- Function to auto-award points for readings (when auto-approve is enabled)
CREATE OR REPLACE FUNCTION public.auto_award_reading_points()
RETURNS TRIGGER AS $$
DECLARE
  v_requires_approval BOOLEAN;
  v_points_per_reading INTEGER;
BEGIN
  -- Get schedule configuration
  SELECT rs.requires_approval, rs.points_per_reading
  INTO v_requires_approval, v_points_per_reading
  FROM public.reading_schedules rs
  JOIN public.reading_schedule_days rsd ON rsd.schedule_id = rs.id
  WHERE rsd.id = NEW.schedule_day_id;

  -- If auto-approve, set status and points
  IF NOT v_requires_approval THEN
    NEW.status := 'approved';
    NEW.points_awarded := v_points_per_reading;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_award_reading_points_trigger
  BEFORE INSERT ON public.user_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_reading_points();

-- =====================================================
-- PART 16: COMMENTS
-- =====================================================

COMMENT ON TABLE public.spiritual_activity_templates IS 'Admin-defined templates for spiritual activities with points configuration';
COMMENT ON TABLE public.spiritual_notes IS 'Student submissions for daily spiritual activities (prayer, mass, confession, etc.)';
COMMENT ON TABLE public.competitions IS 'Competition definitions with various submission types';
COMMENT ON TABLE public.competition_submissions IS 'Student submissions for competitions with grading';
COMMENT ON TABLE public.reading_schedules IS 'Bible reading schedules created by teachers';
COMMENT ON TABLE public.reading_schedule_days IS 'Daily reading assignments within a schedule';
COMMENT ON TABLE public.user_readings IS 'Student reading completions with favorite verses';

COMMENT ON COLUMN public.spiritual_notes.activity_date IS 'The date when the spiritual activity was performed (not submission date)';
COMMENT ON COLUMN public.spiritual_activity_templates.max_per_day IS 'Maximum submissions per day for this activity type (null = unlimited)';
COMMENT ON COLUMN public.competitions.submission_type IS 'Type of submission: text (written), pdf_upload (file), or google_form (external form)';
COMMENT ON COLUMN public.competition_submissions.ranking IS 'Position in competition (1=first place, 2=second, etc.)';
COMMENT ON COLUMN public.reading_schedules.requires_approval IS 'If false, points are auto-awarded on completion';
COMMENT ON COLUMN public.user_readings.favorite_verse_reference IS 'Bible reference for the favorite verse from the reading (e.g., Matthew 5:9)';
