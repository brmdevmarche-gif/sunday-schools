// Type definitions for Sunday School Management System

// Enum types matching database schema
export type ServantRole =
  | "servant"
  | "teacher"
  | "coordinator"
  | "assistant"
  | "manager";
export type YearType = "kg" | "primary" | "preparatory" | "secondary";
export type ActivityType =
  | "service"
  | "event"
  | "class"
  | "trip"
  | "meeting"
  | "workshop";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type OrderStatus =
  | "requested"
  | "reviewing"
  | "approved"
  | "purchased"
  | "ready_for_pickup"
  | "collected"
  | "cancelled"
  | "rejected";

export interface Diocese {
  id: string; // UUID
  name: string;
  description?: string;
  territory?: string;
  bishop_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
}

export interface Church {
  id: string; // UUID
  name: string;
  diocese_id: string; // UUID
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  pastor_name?: string;
  established_date?: string;
  latitude?: number;
  longitude?: number;
  location?: string; // PostGIS point type
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  diocese?: Diocese;
}

export interface Area {
  id: string; // UUID
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface AreaChurch {
  area_id: string; // UUID
  church_id: string; // UUID
  created_at: string;
  area?: Area;
  church?: Church;
}

export interface Servant {
  id: string; // UUID
  church_id: string; // UUID
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  role: ServantRole;
  year_type?: YearType;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  location?: string; // PostGIS point type
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  church?: Church;
  // Additional fields from comprehensive schema
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  specialization?: string;
  notes?: string;
}

export interface ClassGroup {
  id: string; // UUID
  church_id: string; // UUID
  name: string;
  year_type?: YearType;
  description?: string;
  room_number?: string;
  meeting_time?: string; // TIME type
  meeting_day?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  church?: Church;
}

export interface Student {
  id: string; // UUID
  church_id: string; // UUID
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  year_type?: YearType;
  class_group?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  medical_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  image_url?: string;
  image_storage_path?: string;
  latitude?: number;
  longitude?: number;
  area_id?: string; // UUID
  church?: Church;
  area?: Area;
}

export interface StudentClassAssignment {
  id: string; // UUID
  student_id: string; // UUID
  class_group_id: string; // UUID
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  student?: Student;
  class_group?: ClassGroup;
}

export interface ServantClassAssignment {
  id: string; // UUID
  servant_id: string; // UUID
  class_group_id: string; // UUID
  role: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  servant?: Servant;
  class_group?: ClassGroup;
}

export interface ChurchActivity {
  id: string; // UUID
  church_id: string; // UUID
  title: string;
  description?: string;
  activity_type?: ActivityType;
  start_date?: string; // TIMESTAMPTZ
  end_date?: string; // TIMESTAMPTZ
  location?: string;
  organizer_id?: string; // UUID
  target_audience?: YearType[];
  max_participants?: number;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  church?: Church;
  organizer?: Servant;
}

export interface StudentActivityParticipation {
  id: string; // UUID
  student_id: string; // UUID
  activity_id: string; // UUID
  attended: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  student?: Student;
  activity?: ChurchActivity;
}

export interface ServantAttendance {
  id: string; // UUID
  servant_id: string; // UUID
  activity_id: string; // UUID
  status: AttendanceStatus;
  check_in_time?: string; // TIMESTAMPTZ
  check_out_time?: string; // TIMESTAMPTZ
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  servant?: Servant;
  activity?: ChurchActivity;
}

export interface StudentAttendance {
  id: string; // UUID
  student_id: string; // UUID
  class_group_id: string; // UUID
  attendance_date: string; // DATE
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  student?: Student;
  class_group?: ClassGroup;
}

export interface Offer {
  id: string; // UUID
  church_id: string; // UUID
  amount?: number;
  donor_name?: string;
  donor_type: string;
  purpose?: string;
  offer_date: string; // DATE
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  church?: Church;
}

export interface Lesson {
  id: string; // UUID
  church_id: string; // UUID
  title: string;
  description?: string;
  year_type?: YearType;
  bible_passage?: string;
  materials?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  church?: Church;
}

export interface ClassSession {
  id: string; // UUID
  class_group_id: string; // UUID
  lesson_id?: string; // UUID
  session_date: string; // DATE
  start_time?: string; // TIME
  end_time?: string; // TIME
  attendance_taken: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted: boolean;
  class_group?: ClassGroup;
  lesson?: Lesson;
}

// Application user types
export interface User {
  id: string; // UUID
  email: string;
  full_name?: string;
  username?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string; // UUID
  author_id: string; // UUID
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  status: string;
  published_at?: string; // TIMESTAMPTZ
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface Comment {
  id: string; // UUID
  post_id: string; // UUID
  author_id: string; // UUID
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  post?: Post;
  author?: User;
}

// Store System Types
export interface StoreItemsCatalog {
  id: string; // UUID
  sku?: string;
  name: string;
  description?: string;
  unit_price: number;
  points_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string; // UUID
  church_id: string; // UUID
  name: string;
  location?: string;
  contact?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  church?: Church;
  manager_id?: string; // UUID
  manager?: Servant;
}

export interface StoreItemStock {
  id: string; // UUID
  store_id: string; // UUID
  item_id: string; // UUID
  quantity: number;
  updated_at: string;
  store?: Store;
  item?: StoreItemsCatalog;
}

export interface StoreClassAssignment {
  store_id: string; // UUID
  class_group_id: string; // UUID
  created_at: string;
  store?: Store;
  class_group?: ClassGroup;
}

export interface StudentWallet {
  student_id: string; // UUID (PRIMARY KEY)
  points_balance: number;
  updated_at: string;
  student?: Student;
}

export interface StoreOrderRequest {
  id: string; // UUID
  store_id: string; // UUID
  class_group_id?: string; // UUID
  student_id: string; // UUID
  requested_by?: string; // UUID
  status: OrderStatus;
  payment_method: string;
  total_points: number;
  total_amount: number;
  manager_id?: string; // UUID
  reviewed_at?: string; // TIMESTAMPTZ
  purchased_at?: string; // TIMESTAMPTZ
  ready_at?: string; // TIMESTAMPTZ
  collected_at?: string; // TIMESTAMPTZ
  created_at: string;
  updated_at: string;
  store?: Store;
  class_group?: ClassGroup;
  student?: Student;
  requested_by_servant?: Servant;
  manager?: Servant;
}

export interface StoreOrderItem {
  id: string; // UUID
  order_id: string; // UUID
  item_id: string; // UUID
  quantity: number;
  unit_price: number;
  unit_points: number;
  created_at: string;
  order?: StoreOrderRequest;
  item?: StoreItemsCatalog;
}

export interface StoreOrderStateHistory {
  id: string; // UUID
  order_id: string; // UUID
  previous_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by?: string; // UUID
  reason?: string;
  created_at: string;
  order?: StoreOrderRequest;
  changed_by_servant?: Servant;
}
