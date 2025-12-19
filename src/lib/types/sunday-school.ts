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

export interface UserWithClassAssignments extends ExtendedUser {
  classAssignments?: Array<{
    class_id: string;
    class_name: string;
    assignment_type: AssignmentType;
  }>;
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
  attachments: unknown | null; // JSONB
  is_published: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export type ActivityType = "game" | "craft" | "worship" | "service" | "other";

export interface ClassActivity {
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

export type TripType = "event" | "funny" | "learning";
export type TripStatus = "active" | "started" | "ended" | "canceled" | "soldout";
export type TripPaymentStatus = "pending" | "paid" | "refunded";
export type TripApprovalStatus = "pending" | "approved" | "rejected";

export interface Trip {
  id: string;
  church_id: string | null; // Kept for backward compatibility, use trip_churches instead
  title: string;
  description: string | null;
  destination: string | null; // Kept for backward compatibility, but use destinations array instead
  start_datetime: string | null;
  end_datetime: string | null;
  trip_type: TripType | null;
  status: TripStatus;
  available: boolean;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  max_participants: number | null;
  requires_parent_approval: boolean | null;
  transportation_details: string | null;
  what_to_bring: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TripDestination {
  id: string;
  trip_id: string;
  destination_name: string;
  description: string | null;
  visit_order: number;
  created_at: string;
}

export interface TripChurch {
  id: string;
  trip_id: string;
  church_id: string;
  created_at: string;
}

export interface TripDiocese {
  id: string;
  trip_id: string;
  diocese_id: string;
  created_at: string;
}

export interface TripParticipant {
  id: string;
  trip_id: string;
  user_id: string;
  parent_approval: boolean | null;
  approval_status: TripApprovalStatus;
  payment_status: TripPaymentStatus;
  approved_at: string | null;
  approved_by: string | null;
  emergency_contact: string | null;
  medical_info: string | null;
  registered_at: string;
}

export interface TripParticipantWithUser extends TripParticipant {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  };
}

export interface TripWithDetails extends Trip {
  destinations?: TripDestination[];
  churches?: TripChurch[];
  dioceses?: TripDiocese[];
  participants?: TripParticipantWithUser[];
  participants_count?: number;
  my_participation?: TripParticipant;
}

export type StudentCase = "normal" | "mastor" | "botl";
export type StockType = "on_demand" | "quantity";

export interface StoreItem {
  id: string;
  church_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  stock_type: StockType;
  stock_quantity: number;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  is_active: boolean;
  is_available_to_all_classes: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface StoreItemChurch {
  id: string;
  store_item_id: string;
  church_id: string;
  created_at: string;
}

export interface StoreItemDiocese {
  id: string;
  store_item_id: string;
  diocese_id: string;
  created_at: string;
}

export interface StoreItemClass {
  id: string;
  store_item_id: string;
  class_id: string;
  created_at: string;
}

export interface CreateStoreItemInput {
  name: string;
  description?: string;
  image_url?: string;
  stock_type: StockType;
  stock_quantity: number;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  church_ids?: string[]; // Multiple churches
  diocese_ids?: string[]; // Multiple dioceses (item available to all churches in these dioceses)
  class_ids?: string[]; // Specific classes (if not available to all)
  is_available_to_all_classes?: boolean;
}

export interface UpdateStoreItemInput {
  name?: string;
  description?: string;
  image_url?: string;
  stock_type?: StockType;
  stock_quantity?: number;
  price_normal?: number;
  price_mastor?: number;
  price_botl?: number;
  is_active?: boolean;
  church_ids?: string[];
  diocese_ids?: string[];
  class_ids?: string[];
  is_available_to_all_classes?: boolean;
}

// =====================================================
// STORE ORDERS
// =====================================================

export type OrderStatus = "pending" | "approved" | "fulfilled" | "cancelled" | "rejected";
export type PriceTier = "normal" | "mastor" | "botl";

export interface Order {
  id: string;
  user_id: string;
  class_id: string | null;
  status: OrderStatus;
  total_points: number;
  notes: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  store_item_id: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  quantity: number;
  price_tier: PriceTier;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CreateOrderItemInput {
  store_item_id: string;
  quantity: number;
  price_tier: PriceTier;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  notes?: string;
  class_id?: string;
}

export interface UpdateOrderStatusInput {
  order_id: string;
  status: OrderStatus;
  admin_notes?: string;
}

// Extended order types with joined data
export interface OrderWithDetails extends Order {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    role: UserRole;
  };
  class: {
    id: string;
    name: string;
  } | null;
  items: OrderItem[];
  processed_by_user: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface CartItem {
  store_item: StoreItem;
  quantity: number;
  price_tier: PriceTier;
}

// =====================================================
// ACTIVITIES
// =====================================================

export type ActivityStatus = "draft" | "active" | "completed" | "cancelled";
export type ParticipationStatus = "pending" | "approved" | "rejected" | "active" | "withdrawn";
export type CompletionStatus = "pending" | "approved" | "rejected" | "completed";

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_activity_id: string | null;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  points: number;
  reduced_points_percentage: number;
  requires_participation_approval: boolean;
  requires_completion_approval: boolean;
  is_time_sensitive: boolean;
  start_time: string | null;
  end_time: string | null;
  deadline: string | null;
  full_points_window_start: string | null;
  full_points_window_end: string | null;
  max_participants: number | null;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityParticipant {
  id: string;
  activity_id: string;
  user_id: string;
  status: ParticipationStatus;
  requested_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface ActivityCompletion {
  id: string;
  activity_id: string;
  user_id: string;
  status: CompletionStatus;
  points_awarded: number;
  is_full_points: boolean;
  completed_at: string;
  approved_at: string | null;
  approved_by: string | null;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
}

// Form input types
export interface CreateActivityInput {
  name: string;
  description?: string;
  image_url?: string;
  parent_activity_id?: string;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
  points: number;
  reduced_points_percentage?: number;
  requires_participation_approval?: boolean;
  requires_completion_approval?: boolean;
  is_time_sensitive?: boolean;
  start_time?: string;
  end_time?: string;
  deadline?: string;
  full_points_window_start?: string;
  full_points_window_end?: string;
  max_participants?: number;
  status?: ActivityStatus;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  id: string;
}

export interface ParticipateActivityInput {
  activity_id: string;
}

export interface CompleteActivityInput {
  activity_id: string;
  notes?: string;
}

export interface ApproveParticipationInput {
  participation_id: string;
  approved: boolean;
  rejection_reason?: string;
}

export interface ApproveCompletionInput {
  completion_id: string;
  approved: boolean;
  admin_notes?: string;
}

export interface RevokePointsInput {
  completion_id: string;
  revoke_reason: string;
}

// Extended types with joined data
export interface ActivityWithDetails extends Activity {
  parent_activity?: Activity;
  sub_activities?: Activity[];
  participants_count?: number;
  completions_count?: number;
  my_participation?: ActivityParticipant;
  my_completion?: ActivityCompletion;
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

export interface ClassActivityParticipant {
  id: string;
  activity_id: string | null;
  user_id: string | null;
  registration_status: RegistrationStatus | null;
  parent_approved: boolean | null;
  registered_at: string;
  attended: boolean | null;
  notes: string | null;
}

// TripParticipant moved up with Trip interface above


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
  theme_settings?: Record<string, unknown>;
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

export interface CreateClassActivityInput {
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
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  trip_type: TripType;
  status?: TripStatus;
  available?: boolean;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  max_participants?: number;
  requires_parent_approval?: boolean;
  transportation_details?: string;
  what_to_bring?: string;
  church_ids?: string[];
  diocese_ids?: string[];
  destinations?: Array<{
    destination_name: string;
    description?: string;
    visit_order?: number;
  }>;
}

export interface UpdateTripInput extends Partial<CreateTripInput> {
  id: string;
  church_ids?: string[];
  diocese_ids?: string[];
}

export interface SubscribeToTripInput {
  trip_id: string;
  emergency_contact?: string;
  medical_info?: string;
}

export interface UpdateTripParticipantInput {
  participant_id: string;
  approval_status?: TripApprovalStatus;
  payment_status?: TripPaymentStatus;
}

// Attendance helper types
export interface AttendanceWithUser extends Attendance {
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface CreateAttendanceInput {
  class_id: string;
  user_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  lesson_id?: string;
  notes?: string;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  notes?: string;
  lesson_id?: string;
}

export interface AttendanceRecord {
  user_id: string;
  user_name: string;
  user_email: string;
  status: AttendanceStatus;
  notes?: string;
}
