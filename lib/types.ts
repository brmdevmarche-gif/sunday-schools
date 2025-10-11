// Type definitions for Sunday School Management System

export interface Diocese {
  id: number
  name: string
  location?: string
  bishop_name?: string
  contact_email?: string
  contact_phone?: string
  created_at: string
  updated_at: string
}

export interface Church {
  id: number
  name: string
  diocese_id: number
  address?: string
  contact_email?: string
  contact_phone?: string
  priest_name?: string
  established_date?: string
  created_at: string
  updated_at: string
  diocese?: Diocese
}

export interface Servant {
  id: number
  church_id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  address?: string
  role?: string
  specialization?: string
  start_date?: string
  is_active: boolean
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  created_at: string
  updated_at: string
  church?: Church
}

export interface ClassGroup {
  id: number
  church_id: number
  name: string
  description?: string
  age_range?: string
  max_capacity?: number
  primary_servant_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
  church?: Church
  primary_servant?: Servant
}

export interface Student {
  id: number
  church_id: number
  class_group_id?: number
  first_name: string
  last_name: string
  date_of_birth?: string
  gender?: string
  address?: string
  parent_guardian_name?: string
  parent_guardian_phone?: string
  parent_guardian_email?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_conditions?: string
  allergies?: string
  enrollment_date: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  church?: Church
  class_group?: ClassGroup
}

export interface ChurchActivity {
  id: number
  church_id: number
  name: string
  description?: string
  activity_type?: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  location?: string
  max_participants?: number
  registration_required: boolean
  cost: number
  organizer_servant_id?: number
  is_active: boolean
  created_at: string
  updated_at: string
  church?: Church
  organizer_servant?: Servant
}

export interface StudentActivityParticipation {
  id: number
  student_id: number
  activity_id: number
  registration_date: string
  attendance_status: "registered" | "attended" | "absent" | "cancelled"
  payment_status: "pending" | "paid" | "waived"
  notes?: string
  created_at: string
  updated_at: string
  student?: Student
  activity?: ChurchActivity
}

export interface Offer {
  id: number
  church_id: number
  title: string
  description?: string
  offer_type?: string
  discount_percentage?: number
  discount_amount?: number
  valid_from?: string
  valid_until?: string
  max_uses?: number
  current_uses: number
  is_active: boolean
  created_at: string
  updated_at: string
  church?: Church
}

export interface Lesson {
  id: number
  church_id: number
  class_group_id?: number
  title: string
  description?: string
  lesson_content?: string
  scripture_reference?: string
  lesson_date?: string
  duration_minutes?: number
  materials_needed?: string
  learning_objectives?: string
  teacher_servant_id?: number
  is_completed: boolean
  created_at: string
  updated_at: string
  church?: Church
  class_group?: ClassGroup
  teacher_servant?: Servant
}
