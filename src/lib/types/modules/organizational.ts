// =====================================================
// ORGANIZATIONAL STRUCTURE TYPES
// =====================================================
// Types for Diocese, Church, and Class entities
// =====================================================

// =====================================================
// DIOCESE
// =====================================================

export interface Diocese {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cover_image_url: string | null;
  logo_image_url: string | null;
  theme_primary_color: string | null;
  theme_secondary_color: string | null;
  theme_accent_color: string | null;
  theme_settings: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface DioceseAdmin {
  id: string;
  diocese_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateDioceseInput {
  name: string;
  description?: string;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  cover_image_url?: string;
  logo_image_url?: string;
  theme_primary_color?: string;
  theme_secondary_color?: string;
  theme_accent_color?: string;
  theme_settings?: Record<string, unknown>;
}

export interface CreateDioceseAdminInput {
  diocese_id: string;
  user_id: string;
  notes?: string;
}

// =====================================================
// CHURCH
// =====================================================

export interface Church {
  id: string;
  diocese_id: string | null;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cover_image_url: string | null;
  logo_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateChurchInput {
  diocese_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  contact_email?: string;
  contact_phone?: string;
  cover_image_url?: string;
  logo_image_url?: string;
}

// =====================================================
// CLASS
// =====================================================

export interface Class {
  id: string;
  church_id: string | null;
  name: string;
  description: string | null;
  grade_level: string | null;
  academic_year: string | null;
  schedule: string | null;
  capacity: number | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateClassInput {
  church_id: string;
  name: string;
  description?: string;
  grade_level?: string;
  academic_year?: string;
  schedule?: string;
  capacity?: number;
}

// =====================================================
// LESSONS
// =====================================================

export interface Lesson {
  id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  content: string | null;
  lesson_date: string | null;
  duration_minutes: number | null;
  materials_needed: string | null;
  objectives: string | null;
  scripture_references: string | null;
  attachments: unknown | null; // JSONB
  is_published: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateLessonInput {
  class_id: string;
  title: string;
  description?: string;
  content?: string;
  lesson_date?: string;
  duration_minutes?: number;
  materials_needed?: string;
  objectives?: string;
  scripture_references?: string;
}

// =====================================================
// CLASS ACTIVITIES (Different from Activities module)
// =====================================================

export interface ClassActivity {
  id: string;
  church_id: string | null;
  class_id: string | null;
  title: string;
  description: string | null;
  activity_type: import('./base').ActivityType | null;
  activity_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  max_participants: number | null;
  cost: number | null;
  requires_permission: boolean | null;
  is_published: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateClassActivityInput {
  church_id: string;
  class_id?: string;
  title: string;
  description?: string;
  activity_type: import('./base').ActivityType;
  activity_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
  cost?: number;
  requires_permission?: boolean;
}
