// =====================================================
// ANNOUNCEMENTS TYPES
// =====================================================

export type AnnouncementAudience = 'students' | 'parents' | 'both'

export type AnnouncementTargetRole =
  | 'student'
  | 'parent'
  | 'teacher'
  | 'church_admin'
  | 'diocese_admin'
  | 'super_admin'

export interface Announcement {
  id: string
  title: string
  description: string | null
  types: string[]
  /**
   * Roles that can see this announcement (student, parent, teacher, church_admin, diocese_admin, super_admin).
   * If empty array, treated as "all roles".
   */
  target_roles: AnnouncementTargetRole[]
  publish_from: string
  publish_to: string | null
  is_deleted: boolean
  deactivated_reason: string | null
  deactivated_at: string | null
  deactivated_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateAnnouncementInput {
  title: string
  description?: string | null
  types: string[]
  target_roles: AnnouncementTargetRole[]
  /** Optional scope limits (if empty/undefined => no restriction) */
  diocese_ids?: string[]
  church_ids?: string[]
  class_ids?: string[]
  publish_from: string
  publish_to?: string | null
}

export interface UpdateAnnouncementInput {
  id: string
  title?: string
  description?: string | null
  types?: string[]
  target_roles?: AnnouncementTargetRole[]
  diocese_ids?: string[]
  church_ids?: string[]
  class_ids?: string[]
  publish_from?: string
  publish_to?: string | null
  is_deleted?: boolean
}


