// =====================================================
// SUNDAY SCHOOL MANAGEMENT SYSTEM - TypeScript Types
// =====================================================

// =====================================================
// USER ROLES & PERMISSIONS
// =====================================================

export type UserRole =
  | "super_admin"
  | "diocese_admin"
  | "church_admin"
  | "class_admin"
  | "teacher_admin"
  | "teacher"
  | "parent"
  | "student"
  | "assistant"
  | "guest"
  | "priest"
  | "store_manager"
  | "activity_coordinator"
  | "trip_coordinator"
  | "volunteer";

export type Gender = "male" | "female";

export type RelationshipType = "parent" | "guardian";

export type AssignmentType = "teacher" | "student" | "assistant";

// =====================================================
// ORGANIZATIONAL STRUCTURE
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
  theme_settings: Record<string, any> | null;
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

// =====================================================
// EXTENDED USER
// =====================================================

export interface ExtendedUser {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  diocese_id: string | null;
  church_id: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
}

// =====================================================
// ASSIGNMENTS & RELATIONSHIPS
// =====================================================

export interface ClassAssignment {
  id: string;
  class_id: string | null;
  user_id: string | null;
  assignment_type: AssignmentType;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean | null;
}

export interface UserRelationship {
  id: string;
  parent_id: string | null;
  student_id: string | null;
  relationship_type: RelationshipType;
  created_at: string;
}

// =====================================================
// CONTENT
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
  attachments: any | null; // JSONB
  is_published: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export type ActivityType = "game" | "craft" | "worship" | "service" | "other";

export interface Activity {
  id: string;
  church_id: string | null;
  class_id: string | null;
  title: string;
  description: string | null;
  activity_type: ActivityType | null;
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

export interface Trip {
  id: string;
  church_id: string | null;
  title: string;
  description: string | null;
  destination: string;
  trip_date: string;
  return_date: string | null;
  departure_time: string | null;
  return_time: string | null;
  meeting_point: string | null;
  cost: number | null;
  max_participants: number | null;
  requires_parent_approval: boolean | null;
  transportation_details: string | null;
  what_to_bring: string | null;
  is_published: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export type StoreItemCategory =
  | "book"
  | "supply"
  | "uniform"
  | "gift"
  | "other";

export interface StoreItem {
  id: string;
  church_id: string | null;
  name: string;
  description: string | null;
  category: StoreItemCategory | null;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  is_available: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  class_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority | null;
  status: TaskStatus | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// =====================================================
// REQUESTS & APPROVALS
// =====================================================

export type RequestType = "trip" | "activity" | "purchase" | "other";
export type RequestStatus = "pending" | "approved" | "declined";

export interface Request {
  id: string;
  student_id: string | null;
  parent_id: string | null;
  request_type: RequestType;
  related_id: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  status: RequestStatus | null;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// =====================================================
// PARTICIPATION & ATTENDANCE
// =====================================================

export type RegistrationStatus =
  | "registered"
  | "waitlist"
  | "attended"
  | "cancelled"
  | "confirmed";

export interface ActivityParticipant {
  id: string;
  activity_id: string | null;
  user_id: string | null;
  registration_status: RegistrationStatus | null;
  parent_approved: boolean | null;
  registered_at: string;
  attended: boolean | null;
  notes: string | null;
}

export interface TripParticipant {
  id: string;
  trip_id: string | null;
  user_id: string | null;
  registration_status: RegistrationStatus | null;
  parent_approved: boolean | null;
  payment_status: "unpaid" | "partial" | "paid" | null;
  amount_paid: number | null;
  registered_at: string;
  medical_info: string | null;
  emergency_contact: string | null;
  attended: boolean | null;
  notes: string | null;
}

export type OrderStatus =
  | "pending"
  | "approved"
  | "declined"
  | "paid"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface StoreOrder {
  id: string;
  user_id: string | null;
  total_amount: number;
  status: OrderStatus | null;
  payment_status: PaymentStatus | null;
  parent_approved: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface StoreOrderItem {
  id: string;
  order_id: string | null;
  item_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export type AttendanceStatus = "present" | "absent" | "excused" | "late";

export interface Attendance {
  id: string;
  class_id: string | null;
  user_id: string | null;
  lesson_id: string | null;
  attendance_date: string;
  status: AttendanceStatus | null;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
}

// =====================================================
// FORM INPUT TYPES
// =====================================================

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
  theme_settings?: Record<string, any>;
}

export interface CreateDioceseAdminInput {
  diocese_id: string;
  user_id: string;
  notes?: string;
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

export interface CreateClassInput {
  church_id: string;
  name: string;
  description?: string;
  grade_level?: string;
  academic_year?: string;
  schedule?: string;
  capacity?: number;
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

export interface CreateActivityInput {
  church_id: string;
  class_id?: string;
  title: string;
  description?: string;
  activity_type: ActivityType;
  activity_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  max_participants?: number;
  cost?: number;
  requires_permission?: boolean;
}

export interface CreateTripInput {
  church_id: string;
  title: string;
  description?: string;
  destination: string;
  trip_date: string;
  return_date?: string;
  departure_time?: string;
  return_time?: string;
  meeting_point?: string;
  cost?: number;
  max_participants?: number;
  transportation_details?: string;
  what_to_bring?: string;
}
