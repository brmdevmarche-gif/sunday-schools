// =====================================================
// ENHANCED ACTIVITIES TYPES
// =====================================================
// Types for the three enhanced activity sub-modules:
// 1. Spiritual Notes - Daily spiritual practice tracking
// 2. Competitions - Contests with various submission types
// 3. Daily Readings - Bible reading schedules
// =====================================================

import type { ActivityStatus } from "./activities";

// =====================================================
// SHARED ENUMS
// =====================================================

export type SpiritualActivityType =
  | "prayer"
  | "mass"
  | "confession"
  | "fasting"
  | "bible_reading"
  | "charity"
  | "other";

export type CompetitionSubmissionType = "text" | "pdf_upload" | "google_form";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "needs_revision";

// =====================================================
// SPIRITUAL ACTIVITY TEMPLATES
// =====================================================

export interface SpiritualActivityTemplate {
  id: string;
  activity_type: SpiritualActivityType;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  icon: string | null;
  base_points: number;
  max_per_day: number | null;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  is_active: boolean;
  requires_approval: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSpiritualActivityTemplateInput {
  activity_type: SpiritualActivityType;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  icon?: string;
  base_points: number;
  max_per_day?: number;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
  requires_approval?: boolean;
}

export interface UpdateSpiritualActivityTemplateInput
  extends Partial<CreateSpiritualActivityTemplateInput> {
  id: string;
  is_active?: boolean;
}

// =====================================================
// SPIRITUAL NOTES
// =====================================================

export interface SpiritualNote {
  id: string;
  user_id: string;
  activity_type: SpiritualActivityType;
  custom_type: string | null;
  activity_template_id: string | null;
  title: string | null;
  description: string | null;
  activity_date: string;
  class_id: string | null;
  status: SubmissionStatus;
  points_requested: number;
  points_awarded: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpiritualNoteWithDetails extends SpiritualNote {
  template?: SpiritualActivityTemplate;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
    user_code: string | null;
  };
  reviewer?: {
    id: string;
    full_name: string | null;
  };
}

export interface CreateSpiritualNoteInput {
  activity_type: SpiritualActivityType;
  custom_type?: string;
  activity_template_id?: string;
  title?: string;
  description?: string;
  activity_date: string;
  class_id?: string;
}

export interface UpdateSpiritualNoteInput {
  id: string;
  title?: string;
  description?: string;
  activity_date?: string;
}

export interface ReviewSpiritualNoteInput {
  note_id: string;
  approved: boolean;
  points_awarded?: number;
  review_notes?: string;
}

export interface SpiritualNoteFilters {
  user_id?: string;
  activity_type?: SpiritualActivityType;
  status?: SubmissionStatus;
  class_id?: string;
  date_from?: string;
  date_to?: string;
}

// =====================================================
// COMPETITIONS
// =====================================================

export interface Competition {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  submission_type: CompetitionSubmissionType;
  google_form_url: string | null;
  instructions: string | null;
  instructions_ar: string | null;
  submission_guidelines: string | null;
  submission_guidelines_ar: string | null;
  start_date: string;
  end_date: string;
  base_points: number;
  first_place_bonus: number | null;
  second_place_bonus: number | null;
  third_place_bonus: number | null;
  max_submissions: number | null;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitionWithStats extends Competition {
  submissions_count?: number;
  pending_count?: number;
  approved_count?: number;
  my_submission?: CompetitionSubmission;
}

export interface CreateCompetitionInput {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  submission_type: CompetitionSubmissionType;
  google_form_url?: string;
  instructions?: string;
  instructions_ar?: string;
  submission_guidelines?: string;
  submission_guidelines_ar?: string;
  start_date: string;
  end_date: string;
  base_points: number;
  first_place_bonus?: number;
  second_place_bonus?: number;
  third_place_bonus?: number;
  max_submissions?: number;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
  status?: ActivityStatus;
}

export interface UpdateCompetitionInput extends Partial<CreateCompetitionInput> {
  id: string;
}

export interface CompetitionFilters {
  status?: ActivityStatus;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
  submission_type?: CompetitionSubmissionType;
  active_only?: boolean;
}

// =====================================================
// COMPETITION SUBMISSIONS
// =====================================================

export interface CompetitionSubmission {
  id: string;
  competition_id: string;
  user_id: string;
  text_content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  google_form_response_id: string | null;
  status: SubmissionStatus;
  score: number | null;
  ranking: number | null;
  points_awarded: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
  feedback_ar: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface CompetitionSubmissionWithDetails extends CompetitionSubmission {
  competition?: Competition;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
    user_code: string | null;
  };
  reviewer?: {
    id: string;
    full_name: string | null;
  };
}

export interface CreateCompetitionSubmissionInput {
  competition_id: string;
  text_content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  google_form_response_id?: string;
}

export interface UpdateCompetitionSubmissionInput {
  id: string;
  text_content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface ReviewCompetitionSubmissionInput {
  submission_id: string;
  approved: boolean;
  score?: number;
  ranking?: number;
  feedback?: string;
  feedback_ar?: string;
}

export interface BulkRankSubmissionsInput {
  rankings: {
    submission_id: string;
    ranking: number;
  }[];
}

export interface CompetitionSubmissionFilters {
  competition_id?: string;
  user_id?: string;
  status?: SubmissionStatus;
}

// =====================================================
// READING SCHEDULES
// =====================================================

export interface ReadingSchedule {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  start_date: string;
  end_date: string;
  points_per_reading: number;
  requires_approval: boolean;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingScheduleWithStats extends ReadingSchedule {
  total_days?: number;
  completed_days?: number;
  my_progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface CreateReadingScheduleInput {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  start_date: string;
  end_date: string;
  points_per_reading: number;
  requires_approval?: boolean;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
}

export interface UpdateReadingScheduleInput
  extends Partial<CreateReadingScheduleInput> {
  id: string;
  is_active?: boolean;
}

export interface ReadingScheduleFilters {
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
  is_active?: boolean;
  current_only?: boolean;
}

// =====================================================
// READING SCHEDULE DAYS
// =====================================================

export interface ReadingScheduleDay {
  id: string;
  schedule_id: string;
  reading_date: string;
  book_name: string;
  book_name_ar: string | null;
  chapter_start: number;
  chapter_end: number | null;
  verse_start: number | null;
  verse_end: number | null;
  reading_reference: string;
  reading_reference_ar: string | null;
  notes: string | null;
  notes_ar: string | null;
  created_at: string;
}

export interface ReadingScheduleDayWithStatus extends ReadingScheduleDay {
  is_completed?: boolean;
  my_reading?: UserReading;
}

export interface CreateReadingScheduleDayInput {
  schedule_id: string;
  reading_date: string;
  book_name: string;
  book_name_ar?: string;
  chapter_start: number;
  chapter_end?: number;
  verse_start?: number;
  verse_end?: number;
  reading_reference: string;
  reading_reference_ar?: string;
  notes?: string;
  notes_ar?: string;
}

export interface BulkCreateReadingDaysInput {
  schedule_id: string;
  days: Omit<CreateReadingScheduleDayInput, "schedule_id">[];
}

// =====================================================
// USER READINGS
// =====================================================

export interface UserReading {
  id: string;
  schedule_day_id: string;
  user_id: string;
  completed_at: string;
  favorite_verse_reference: string | null;
  favorite_verse_text: string | null;
  favorite_verse_text_ar: string | null;
  reflection: string | null;
  status: SubmissionStatus;
  points_awarded: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface UserReadingWithDetails extends UserReading {
  schedule_day?: ReadingScheduleDay;
  schedule?: ReadingSchedule;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
    user_code: string | null;
  };
  reviewer?: {
    id: string;
    full_name: string | null;
  };
}

export interface CreateUserReadingInput {
  schedule_day_id: string;
  favorite_verse_reference?: string;
  favorite_verse_text?: string;
  favorite_verse_text_ar?: string;
  reflection?: string;
}

export interface UpdateUserReadingInput {
  id: string;
  favorite_verse_reference?: string;
  favorite_verse_text?: string;
  favorite_verse_text_ar?: string;
  reflection?: string;
}

export interface ReviewUserReadingInput {
  reading_id: string;
  approved: boolean;
  points_awarded?: number;
}

export interface UserReadingFilters {
  schedule_id?: string;
  user_id?: string;
  status?: SubmissionStatus;
  date_from?: string;
  date_to?: string;
}

// =====================================================
// AGGREGATED STATS TYPES
// =====================================================

export interface SpiritualNotesStats {
  total_submissions: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_points_awarded: number;
  by_type: Record<SpiritualActivityType, number>;
}

export interface CompetitionStats {
  total_submissions: number;
  pending_count: number;
  graded_count: number;
  total_points_awarded: number;
  average_score: number | null;
  winners: {
    first: CompetitionSubmissionWithDetails | null;
    second: CompetitionSubmissionWithDetails | null;
    third: CompetitionSubmissionWithDetails | null;
  };
}

export interface ReadingScheduleStats {
  total_participants: number;
  total_completions: number;
  completion_rate: number;
  total_points_awarded: number;
  daily_completions: {
    date: string;
    count: number;
  }[];
}

export interface StudentActivitySummary {
  spiritual_notes: {
    total: number;
    points: number;
  };
  competitions: {
    participated: number;
    points: number;
    best_ranking: number | null;
  };
  readings: {
    completed: number;
    total: number;
    points: number;
    streak: number;
  };
}

// =====================================================
// ACTION RESULT TYPES
// =====================================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BulkActionResult {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors?: string[];
}

// =====================================================
// FORM VALIDATION SCHEMAS (for use with Zod)
// =====================================================

export const SPIRITUAL_ACTIVITY_TYPES: SpiritualActivityType[] = [
  "prayer",
  "mass",
  "confession",
  "fasting",
  "bible_reading",
  "charity",
  "other",
];

export const COMPETITION_SUBMISSION_TYPES: CompetitionSubmissionType[] = [
  "text",
  "pdf_upload",
  "google_form",
];

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "needs_revision",
];

// =====================================================
// ICON MAPPING FOR SPIRITUAL ACTIVITIES
// =====================================================

export const SPIRITUAL_ACTIVITY_ICONS: Record<SpiritualActivityType, string> = {
  prayer: "hands-praying",
  mass: "church",
  confession: "heart-handshake",
  fasting: "utensils-crossed",
  bible_reading: "book-open",
  charity: "hand-heart",
  other: "sparkles",
};

// =====================================================
// BIBLE BOOKS (for reading schedules)
// =====================================================

export const BIBLE_BOOKS = {
  old_testament: [
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "1 Chronicles",
    "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Song of Solomon",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
  ],
  new_testament: [
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "1 Corinthians",
    "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians",
    "2 Thessalonians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Revelation",
  ],
} as const;

export const ALL_BIBLE_BOOKS = [
  ...BIBLE_BOOKS.old_testament,
  ...BIBLE_BOOKS.new_testament,
];
