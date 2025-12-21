// =====================================================
// USER TYPES
// =====================================================
// User profiles, assignments, and relationships
// =====================================================

import type { UserRole, Gender, RelationshipType, AssignmentType } from './base';

// =====================================================
// USER
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
// CLASS ASSIGNMENTS
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

// =====================================================
// USER RELATIONSHIPS
// =====================================================

export interface UserRelationship {
  id: string;
  parent_id: string | null;
  student_id: string | null;
  relationship_type: RelationshipType;
  created_at: string;
}

// =====================================================
// TASKS
// =====================================================

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
