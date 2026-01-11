-- =====================================================
-- GAMIFICATION SYSTEM
-- Migration: 40_create_gamification_system.sql
-- =====================================================

-- PART 1: BADGE CATEGORY ENUM
DO $$ BEGIN
  CREATE TYPE badge_category AS ENUM (
    'streak',           -- Streak-based achievements
    'points',           -- Points milestones
    'competition',      -- Competition wins
    'reading',          -- Reading completions
    'spiritual',        -- Spiritual activity milestones
    'attendance',       -- Attendance achievements
    'social',           -- Social/group achievements
    'special'           -- Admin-awarded special badges
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- PART 2: BADGE RARITY ENUM
DO $$ BEGIN
  CREATE TYPE badge_rarity AS ENUM (
    'common',           -- Easy to achieve
    'uncommon',         -- Moderate effort
    'rare',             -- Significant effort
    'epic',             -- Major achievement
    'legendary'         -- Exceptional achievement
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- PART 3: BADGE DEFINITIONS TABLE
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Badge identity
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  description TEXT,
  description_ar TEXT,

  -- Visual
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'gold',

  -- Classification
  category badge_category NOT NULL,
  rarity badge_rarity NOT NULL DEFAULT 'common',

  -- Award criteria (JSON for flexibility)
  criteria JSONB NOT NULL DEFAULT '{}',

  -- Points bonus when earned
  points_reward INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_secret BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PART 4: USER BADGES TABLE (Earned badges)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,

  -- When earned
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional: who awarded (for manual awards)
  awarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  award_notes TEXT,

  -- Prevent duplicate badges
  UNIQUE(user_id, badge_id)
);

-- PART 5: STREAK TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Streak type
  streak_type VARCHAR(50) NOT NULL,

  -- Current streak
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,

  -- Last activity date (for calculating streaks)
  last_activity_date DATE,

  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One streak record per user per type
  UNIQUE(user_id, streak_type)
);

-- PART 6: INDEXES
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_active ON public.badge_definitions(is_active);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON public.user_badges(earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON public.user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON public.user_streaks(current_streak DESC);

-- PART 7: ENABLE RLS
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- PART 8: RLS POLICIES

-- Badge definitions: Everyone can read active badges (non-secret or already earned)
CREATE POLICY "Anyone can view active badge definitions"
  ON public.badge_definitions FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      is_secret = false OR
      EXISTS (
        SELECT 1 FROM public.user_badges ub
        WHERE ub.badge_id = badge_definitions.id
        AND ub.user_id = auth.uid()
      )
    )
  );

-- User badges: Users can view their own
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- User badges: Admins/teachers can view all
CREATE POLICY "Admins can view all user badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- User badges: System can insert (via service role)
CREATE POLICY "Service can insert badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User streaks: Users can view their own
CREATE POLICY "Users can view own streaks"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- User streaks: Admins can view all
CREATE POLICY "Admins can view all streaks"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'diocese_admin', 'church_admin', 'teacher', 'teacher_admin')
    )
  );

-- User streaks: System can upsert
CREATE POLICY "Service can upsert streaks"
  ON public.user_streaks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PART 9: SEED DEFAULT BADGES
INSERT INTO public.badge_definitions (code, name, name_ar, description, description_ar, icon, color, category, rarity, criteria, points_reward)
VALUES
  -- ==================== STREAK BADGES ====================
  ('streak_3', '3-Day Streak', 'سلسلة 3 أيام', 'Completed activities 3 days in a row', 'أكمل الأنشطة 3 أيام متتالية', 'flame', 'orange', 'streak', 'common', '{"type": "streak", "min_days": 3}', 5),
  ('streak_7', 'Week Warrior', 'محارب الأسبوع', 'Completed activities 7 days in a row', 'أكمل الأنشطة 7 أيام متتالية', 'flame', 'orange', 'streak', 'uncommon', '{"type": "streak", "min_days": 7}', 15),
  ('streak_14', 'Two Week Champion', 'بطل الأسبوعين', 'Completed activities 14 days in a row', 'أكمل الأنشطة 14 يوم متتالية', 'flame', 'red', 'streak', 'rare', '{"type": "streak", "min_days": 14}', 30),
  ('streak_30', 'Monthly Master', 'سيد الشهر', 'Completed activities 30 days in a row', 'أكمل الأنشطة 30 يوم متتالية', 'zap', 'gold', 'streak', 'epic', '{"type": "streak", "min_days": 30}', 75),
  ('streak_100', 'Century Legend', 'أسطورة المئة', 'Completed activities 100 days in a row', 'أكمل الأنشطة 100 يوم متتالية', 'crown', 'purple', 'streak', 'legendary', '{"type": "streak", "min_days": 100}', 200),

  -- ==================== POINTS BADGES ====================
  ('points_50', 'Rising Star', 'نجم صاعد', 'Earned 50 total points', 'حصل على 50 نقطة', 'star', 'yellow', 'points', 'common', '{"type": "points", "min_points": 50}', 5),
  ('points_100', 'Century Club', 'نادي المئة', 'Earned 100 total points', 'حصل على 100 نقطة', 'star', 'yellow', 'points', 'common', '{"type": "points", "min_points": 100}', 10),
  ('points_250', 'Point Master', 'محترف النقاط', 'Earned 250 total points', 'حصل على 250 نقطة', 'award', 'gold', 'points', 'uncommon', '{"type": "points", "min_points": 250}', 25),
  ('points_500', 'Half Millennium', 'نصف الألفية', 'Earned 500 total points', 'حصل على 500 نقطة', 'crown', 'gold', 'points', 'rare', '{"type": "points", "min_points": 500}', 50),
  ('points_1000', 'Points Legend', 'أسطورة النقاط', 'Earned 1000 total points', 'حصل على 1000 نقطة', 'gem', 'purple', 'points', 'epic', '{"type": "points", "min_points": 1000}', 100),

  -- ==================== COMPETITION BADGES ====================
  ('competition_first', 'Gold Champion', 'البطل الذهبي', 'Won 1st place in a competition', 'حصل على المركز الأول في مسابقة', 'trophy', 'gold', 'competition', 'rare', '{"type": "competition_rank", "rank": 1}', 25),
  ('competition_podium', 'Podium Finisher', 'متأهل للمنصة', 'Finished in top 3 of a competition', 'حصل على المراكز الثلاثة الأولى', 'medal', 'silver', 'competition', 'uncommon', '{"type": "competition_rank", "rank": 3}', 10),
  ('competition_5_wins', 'Serial Winner', 'الفائز المتسلسل', 'Won 1st place 5 times', 'فاز بالمركز الأول 5 مرات', 'trophy', 'gold', 'competition', 'epic', '{"type": "competition_wins", "count": 5}', 75),
  ('first_competition', 'Competition Debut', 'أول مسابقة', 'Participated in your first competition', 'شاركت في أول مسابقة', 'flag', 'blue', 'competition', 'common', '{"type": "competition_participation", "count": 1}', 5),

  -- ==================== READING BADGES ====================
  ('reading_first', 'First Reading', 'القراءة الأولى', 'Completed your first reading', 'أكمل قراءتك الأولى', 'book-open', 'green', 'reading', 'common', '{"type": "reading_count", "min_count": 1}', 5),
  ('reading_10', 'Dedicated Reader', 'قارئ متفاني', 'Completed 10 readings', 'أكمل 10 قراءات', 'book-open', 'green', 'reading', 'common', '{"type": "reading_count", "min_count": 10}', 15),
  ('reading_50', 'Book Worm', 'دودة الكتب', 'Completed 50 readings', 'أكمل 50 قراءة', 'book-marked', 'emerald', 'reading', 'rare', '{"type": "reading_count", "min_count": 50}', 50),
  ('reading_100', 'Scripture Scholar', 'عالم الكتاب المقدس', 'Completed 100 readings', 'أكمل 100 قراءة', 'graduation-cap', 'emerald', 'reading', 'epic', '{"type": "reading_count", "min_count": 100}', 100),

  -- ==================== SPIRITUAL BADGES ====================
  ('spiritual_first', 'Spiritual Journey', 'الرحلة الروحية', 'Logged your first spiritual activity', 'سجل نشاطك الروحي الأول', 'heart', 'pink', 'spiritual', 'common', '{"type": "spiritual_count", "min_count": 1}', 5),
  ('spiritual_10', 'Faithful Servant', 'خادم مخلص', 'Logged 10 spiritual activities', 'سجل 10 أنشطة روحية', 'heart', 'pink', 'spiritual', 'common', '{"type": "spiritual_count", "min_count": 10}', 15),
  ('spiritual_diverse', 'Spiritual Explorer', 'المستكشف الروحي', 'Logged all 6 types of spiritual activities', 'سجل جميع أنواع الأنشطة الروحية الستة', 'compass', 'blue', 'spiritual', 'rare', '{"type": "spiritual_diversity", "min_types": 6}', 50),

  -- ==================== ATTENDANCE BADGES ====================
  ('attendance_streak_5', 'Regular Attendee', 'حاضر منتظم', '5 consecutive attendance', 'حضور 5 مرات متتالية', 'calendar-check', 'blue', 'attendance', 'common', '{"type": "attendance_streak", "min_days": 5}', 10),
  ('attendance_streak_10', 'Dedicated Student', 'طالب متفاني', '10 consecutive attendance', 'حضور 10 مرات متتالية', 'calendar-check', 'blue', 'attendance', 'uncommon', '{"type": "attendance_streak", "min_days": 10}', 25),
  ('attendance_perfect_month', 'Perfect Month', 'شهر مثالي', 'Perfect attendance for a month', 'حضور كامل لمدة شهر', 'calendar-heart', 'gold', 'attendance', 'rare', '{"type": "attendance_perfect_month"}', 50),

  -- ==================== SOCIAL BADGES ====================
  ('team_player', 'Team Player', 'لاعب فريق', 'Participated in a group activity', 'شارك في نشاط جماعي', 'users', 'cyan', 'social', 'common', '{"type": "group_activity", "count": 1}', 10),
  ('encourager', 'Encourager', 'المشجع', 'Helped another student (admin-awarded)', 'ساعد طالب آخر', 'hand-heart', 'pink', 'social', 'rare', '{"type": "manual_award"}', 25)
ON CONFLICT (code) DO NOTHING;

-- PART 10: UPDATE TRIGGER FOR TIMESTAMPS
CREATE OR REPLACE FUNCTION update_badge_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_badge_definitions_updated_at ON public.badge_definitions;
CREATE TRIGGER trigger_badge_definitions_updated_at
  BEFORE UPDATE ON public.badge_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_badge_definitions_updated_at();

CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_streaks_updated_at ON public.user_streaks;
CREATE TRIGGER trigger_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();
