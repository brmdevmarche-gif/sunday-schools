import type { UserRole } from '../types/modules/base'

export const ADMIN_ROLES: ReadonlySet<UserRole> = new Set([
  'super_admin',
  'diocese_admin',
  'church_admin',
])

export const STAFF_ROLES: ReadonlySet<UserRole> = new Set([
  'super_admin',
  'diocese_admin',
  'church_admin',
  'teacher',
  'class_admin',
  'teacher_admin',
])

export const USER_ROLES = [
  'super_admin',
  'diocese_admin',
  'church_admin',
  'class_admin',
  'teacher_admin',
  'teacher',
  'parent',
  'student',
  'assistant',
  'guest',
  'priest',
  'store_manager',
  'activity_coordinator',
  'trip_coordinator',
  'volunteer',
] as const satisfies readonly UserRole[]
