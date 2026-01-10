-- =====================================================
-- Enhanced Activities Sample Seed Data
-- =====================================================
-- Sample data for testing the enhanced activities system
-- Run this after 39_create_enhanced_activities_system.sql
-- =====================================================

-- =====================================================
-- SPIRITUAL ACTIVITY TEMPLATES
-- =====================================================

INSERT INTO public.spiritual_activity_templates (
  activity_type, name, name_ar, description, description_ar, icon, base_points, max_per_day, requires_approval
) VALUES
  ('prayer', 'Morning Prayer', 'صلاة الصباح', 'Complete your morning prayer routine', 'أكمل صلاة الصباح', 'sunrise', 5, 1, false),
  ('prayer', 'Evening Prayer', 'صلاة المساء', 'Complete your evening prayer routine', 'أكمل صلاة المساء', 'moon', 5, 1, false),
  ('mass', 'Sunday Liturgy', 'القداس الأحد', 'Attend Sunday Divine Liturgy', 'حضور القداس الإلهي يوم الأحد', 'church', 20, 1, false),
  ('mass', 'Weekday Liturgy', 'قداس أيام الأسبوع', 'Attend weekday Divine Liturgy', 'حضور القداس خلال الأسبوع', 'church', 15, 1, false),
  ('confession', 'Confession', 'الاعتراف', 'Attend Holy Confession', 'ممارسة سر الاعتراف', 'heart', 25, 1, true),
  ('fasting', 'Fasting Day', 'يوم صيام', 'Complete a fasting day according to Church calendar', 'إكمال يوم صيام حسب تقويم الكنيسة', 'utensils-crossed', 10, 1, false),
  ('bible_reading', 'Daily Bible Reading', 'قراءة الكتاب المقدس اليومية', 'Read the daily Bible portion', 'قراءة جزء الكتاب المقدس اليومي', 'book-open', 10, 1, false),
  ('charity', 'Act of Charity', 'عمل خيري', 'Perform an act of charity or service', 'القيام بعمل خيري أو خدمة', 'hand-heart', 15, null, true),
  ('other', 'Spiritual Reading', 'قراءة روحية', 'Read from spiritual books or lives of saints', 'قراءة من الكتب الروحية أو سير القديسين', 'book', 5, null, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE COMPETITIONS
-- =====================================================

-- Competition 1: Bible Verse Memorization
INSERT INTO public.competitions (
  name, name_ar, description, description_ar,
  submission_type, instructions, instructions_ar,
  submission_guidelines, submission_guidelines_ar,
  start_date, end_date, base_points, first_place_bonus, second_place_bonus, third_place_bonus,
  status
) VALUES (
  'Bible Verse Memorization Challenge',
  'تحدي حفظ آيات الكتاب المقدس',
  'Memorize and recite selected Bible verses. Submit a written or recorded recitation.',
  'احفظ وأدّي آيات مختارة من الكتاب المقدس. قدم تلاوة مكتوبة أو مسجلة.',
  'text',
  'Memorize the following verses: Matthew 5:3-12 (The Beatitudes). Write them from memory without looking.',
  'احفظ الآيات التالية: متى 5: 3-12 (التطويبات). اكتبها من ذاكرتك بدون النظر.',
  'Write all verses accurately. Minor spelling mistakes are acceptable but verse content must be correct.',
  'اكتب جميع الآيات بدقة. الأخطاء الإملائية البسيطة مقبولة ولكن يجب أن يكون محتوى الآية صحيحًا.',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '30 days',
  10, 50, 30, 20,
  'active'
);

-- Competition 2: Essay Competition
INSERT INTO public.competitions (
  name, name_ar, description, description_ar,
  submission_type, instructions, instructions_ar,
  submission_guidelines, submission_guidelines_ar,
  start_date, end_date, base_points, first_place_bonus, second_place_bonus, third_place_bonus,
  max_submissions, status
) VALUES (
  'Faith in Action Essay Contest',
  'مسابقة مقال الإيمان في العمل',
  'Write an essay about how your faith influences your daily life and decisions.',
  'اكتب مقالاً عن كيف يؤثر إيمانك على حياتك اليومية وقراراتك.',
  'pdf_upload',
  'Write a 500-800 word essay on the topic: "How My Faith Guides My Daily Choices". Include personal examples and Bible references.',
  'اكتب مقالاً من 500-800 كلمة حول الموضوع: "كيف يوجه إيماني خياراتي اليومية". أضف أمثلة شخصية ومراجع من الكتاب المقدس.',
  'Submit as PDF. Include your name and class. Maximum file size: 5MB.',
  'قدم كملف PDF. اكتب اسمك وفصلك. الحد الأقصى لحجم الملف: 5 ميجابايت.',
  NOW(),
  NOW() + INTERVAL '45 days',
  15, 75, 50, 25,
  1,
  'active'
);

-- Competition 3: Art Competition (Draft - not yet active)
INSERT INTO public.competitions (
  name, name_ar, description, description_ar,
  submission_type, instructions, instructions_ar,
  start_date, end_date, base_points,
  status
) VALUES (
  'Iconography Drawing Contest',
  'مسابقة رسم الأيقونات',
  'Draw an icon of a saint or Biblical scene in the Coptic style.',
  'ارسم أيقونة لقديس أو مشهد كتابي بالأسلوب القبطي.',
  'pdf_upload',
  'Create an original drawing inspired by Coptic iconography. Can be done with any medium (pencil, colors, digital).',
  'أنشئ رسمًا أصليًا مستوحى من الأيقونات القبطية. يمكن استخدام أي وسيلة (قلم رصاص، ألوان، رقمي).',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '60 days',
  20,
  'draft'
);

-- =====================================================
-- SAMPLE READING SCHEDULES
-- =====================================================

-- Reading Schedule 1: Gospel of Matthew (4 weeks)
INSERT INTO public.reading_schedules (
  name, name_ar, description, description_ar,
  start_date, end_date, points_per_reading, requires_approval
) VALUES (
  'Gospel of Matthew - 4 Week Journey',
  'إنجيل متى - رحلة 4 أسابيع',
  'Read through the Gospel of Matthew in 4 weeks with daily readings.',
  'اقرأ إنجيل متى خلال 4 أسابيع مع قراءات يومية.',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '28 days',
  5,
  false
);

-- Get the schedule ID for inserting days
DO $$
DECLARE
  v_schedule_id UUID;
BEGIN
  SELECT id INTO v_schedule_id FROM public.reading_schedules
  WHERE name = 'Gospel of Matthew - 4 Week Journey' LIMIT 1;

  IF v_schedule_id IS NOT NULL THEN
    -- Week 1: Matthew 1-7
    INSERT INTO public.reading_schedule_days (schedule_id, reading_date, book_name, book_name_ar, chapter_start, chapter_end, reading_reference, reading_reference_ar) VALUES
      (v_schedule_id, CURRENT_DATE, 'Matthew', 'متى', 1, 1, 'Matthew 1', 'متى 1'),
      (v_schedule_id, CURRENT_DATE + 1, 'Matthew', 'متى', 2, 2, 'Matthew 2', 'متى 2'),
      (v_schedule_id, CURRENT_DATE + 2, 'Matthew', 'متى', 3, 3, 'Matthew 3', 'متى 3'),
      (v_schedule_id, CURRENT_DATE + 3, 'Matthew', 'متى', 4, 4, 'Matthew 4', 'متى 4'),
      (v_schedule_id, CURRENT_DATE + 4, 'Matthew', 'متى', 5, 5, 'Matthew 5', 'متى 5'),
      (v_schedule_id, CURRENT_DATE + 5, 'Matthew', 'متى', 6, 6, 'Matthew 6', 'متى 6'),
      (v_schedule_id, CURRENT_DATE + 6, 'Matthew', 'متى', 7, 7, 'Matthew 7', 'متى 7');

    -- Week 2: Matthew 8-14
    INSERT INTO public.reading_schedule_days (schedule_id, reading_date, book_name, book_name_ar, chapter_start, chapter_end, reading_reference, reading_reference_ar) VALUES
      (v_schedule_id, CURRENT_DATE + 7, 'Matthew', 'متى', 8, 8, 'Matthew 8', 'متى 8'),
      (v_schedule_id, CURRENT_DATE + 8, 'Matthew', 'متى', 9, 9, 'Matthew 9', 'متى 9'),
      (v_schedule_id, CURRENT_DATE + 9, 'Matthew', 'متى', 10, 10, 'Matthew 10', 'متى 10'),
      (v_schedule_id, CURRENT_DATE + 10, 'Matthew', 'متى', 11, 11, 'Matthew 11', 'متى 11'),
      (v_schedule_id, CURRENT_DATE + 11, 'Matthew', 'متى', 12, 12, 'Matthew 12', 'متى 12'),
      (v_schedule_id, CURRENT_DATE + 12, 'Matthew', 'متى', 13, 13, 'Matthew 13', 'متى 13'),
      (v_schedule_id, CURRENT_DATE + 13, 'Matthew', 'متى', 14, 14, 'Matthew 14', 'متى 14');

    -- Week 3: Matthew 15-21
    INSERT INTO public.reading_schedule_days (schedule_id, reading_date, book_name, book_name_ar, chapter_start, chapter_end, reading_reference, reading_reference_ar) VALUES
      (v_schedule_id, CURRENT_DATE + 14, 'Matthew', 'متى', 15, 15, 'Matthew 15', 'متى 15'),
      (v_schedule_id, CURRENT_DATE + 15, 'Matthew', 'متى', 16, 16, 'Matthew 16', 'متى 16'),
      (v_schedule_id, CURRENT_DATE + 16, 'Matthew', 'متى', 17, 17, 'Matthew 17', 'متى 17'),
      (v_schedule_id, CURRENT_DATE + 17, 'Matthew', 'متى', 18, 18, 'Matthew 18', 'متى 18'),
      (v_schedule_id, CURRENT_DATE + 18, 'Matthew', 'متى', 19, 19, 'Matthew 19', 'متى 19'),
      (v_schedule_id, CURRENT_DATE + 19, 'Matthew', 'متى', 20, 20, 'Matthew 20', 'متى 20'),
      (v_schedule_id, CURRENT_DATE + 20, 'Matthew', 'متى', 21, 21, 'Matthew 21', 'متى 21');

    -- Week 4: Matthew 22-28
    INSERT INTO public.reading_schedule_days (schedule_id, reading_date, book_name, book_name_ar, chapter_start, chapter_end, reading_reference, reading_reference_ar) VALUES
      (v_schedule_id, CURRENT_DATE + 21, 'Matthew', 'متى', 22, 22, 'Matthew 22', 'متى 22'),
      (v_schedule_id, CURRENT_DATE + 22, 'Matthew', 'متى', 23, 23, 'Matthew 23', 'متى 23'),
      (v_schedule_id, CURRENT_DATE + 23, 'Matthew', 'متى', 24, 24, 'Matthew 24', 'متى 24'),
      (v_schedule_id, CURRENT_DATE + 24, 'Matthew', 'متى', 25, 25, 'Matthew 25', 'متى 25'),
      (v_schedule_id, CURRENT_DATE + 25, 'Matthew', 'متى', 26, 26, 'Matthew 26', 'متى 26'),
      (v_schedule_id, CURRENT_DATE + 26, 'Matthew', 'متى', 27, 27, 'Matthew 27', 'متى 27'),
      (v_schedule_id, CURRENT_DATE + 27, 'Matthew', 'متى', 28, 28, 'Matthew 28', 'متى 28');
  END IF;
END $$;

-- Reading Schedule 2: Psalms of Praise (1 week)
INSERT INTO public.reading_schedules (
  name, name_ar, description, description_ar,
  start_date, end_date, points_per_reading, requires_approval
) VALUES (
  'Psalms of Praise - Weekly Devotional',
  'مزامير التسبيح - التأمل الأسبوعي',
  'A week-long journey through the Psalms of praise and thanksgiving.',
  'رحلة أسبوعية من خلال مزامير التسبيح والشكر.',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days',
  5,
  false
);

DO $$
DECLARE
  v_schedule_id UUID;
BEGIN
  SELECT id INTO v_schedule_id FROM public.reading_schedules
  WHERE name = 'Psalms of Praise - Weekly Devotional' LIMIT 1;

  IF v_schedule_id IS NOT NULL THEN
    INSERT INTO public.reading_schedule_days (schedule_id, reading_date, book_name, book_name_ar, chapter_start, reading_reference, reading_reference_ar, notes, notes_ar) VALUES
      (v_schedule_id, CURRENT_DATE, 'Psalms', 'مزامير', 23, 'Psalm 23', 'مزمور 23', 'The Lord is my Shepherd', 'الرب راعيَّ'),
      (v_schedule_id, CURRENT_DATE + 1, 'Psalms', 'مزامير', 100, 'Psalm 100', 'مزمور 100', 'A Psalm of Thanksgiving', 'مزمور الشكر'),
      (v_schedule_id, CURRENT_DATE + 2, 'Psalms', 'مزامير', 103, 'Psalm 103', 'مزمور 103', 'Bless the Lord, O My Soul', 'باركي يا نفسي الرب'),
      (v_schedule_id, CURRENT_DATE + 3, 'Psalms', 'مزامير', 117, 'Psalm 117', 'مزمور 117', 'The shortest Psalm - Pure Praise', 'أقصر مزمور - تسبيح خالص'),
      (v_schedule_id, CURRENT_DATE + 4, 'Psalms', 'مزامير', 136, 'Psalm 136', 'مزمور 136', 'His mercy endures forever', 'لأن إلى الأبد رحمته'),
      (v_schedule_id, CURRENT_DATE + 5, 'Psalms', 'مزامير', 145, 'Psalm 145', 'مزمور 145', 'David''s Praise', 'تسبحة داود'),
      (v_schedule_id, CURRENT_DATE + 6, 'Psalms', 'مزامير', 150, 'Psalm 150', 'مزمور 150', 'Let everything that has breath praise the Lord', 'كل نسمة فلتسبح الرب');
  END IF;
END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- This seed data provides:
-- 1. 9 Spiritual Activity Templates covering all activity types
-- 2. 3 Competitions (2 active, 1 draft) with different submission types
-- 3. 2 Reading Schedules with daily readings
--
-- To test with user data, you'll need to:
-- 1. Create spiritual_notes entries for users
-- 2. Create competition_submissions for users
-- 3. Create user_readings entries for users
--
-- Example user submission (run with a valid user_id):
-- INSERT INTO public.spiritual_notes (user_id, activity_type, title, description, activity_date)
-- VALUES ('your-user-id', 'prayer', 'Morning Prayer', 'Prayed the Agpeya morning prayers', CURRENT_DATE);
