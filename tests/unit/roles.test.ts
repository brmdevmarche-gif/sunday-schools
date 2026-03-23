import { describe, it, expect } from 'vitest'
import { ADMIN_ROLES, STAFF_ROLES, USER_ROLES } from '@/lib/constants/roles'

describe('ADMIN_ROLES', () => {
  it('contains exactly super_admin, diocese_admin, church_admin', () => {
    expect(ADMIN_ROLES.size).toBe(3)
    expect(ADMIN_ROLES.has('super_admin')).toBe(true)
    expect(ADMIN_ROLES.has('diocese_admin')).toBe(true)
    expect(ADMIN_ROLES.has('church_admin')).toBe(true)
  })

  it('does not contain non-admin roles', () => {
    expect(ADMIN_ROLES.has('teacher' as never)).toBe(false)
    expect(ADMIN_ROLES.has('parent' as never)).toBe(false)
    expect(ADMIN_ROLES.has('student' as never)).toBe(false)
  })
})

describe('STAFF_ROLES', () => {
  it('is a superset of ADMIN_ROLES', () => {
    for (const role of ADMIN_ROLES) {
      expect(STAFF_ROLES.has(role)).toBe(true)
    }
  })

  it('includes teacher roles', () => {
    expect(STAFF_ROLES.has('teacher')).toBe(true)
    expect(STAFF_ROLES.has('class_admin')).toBe(true)
    expect(STAFF_ROLES.has('teacher_admin')).toBe(true)
  })

  it('does not contain non-staff roles', () => {
    expect(STAFF_ROLES.has('parent' as never)).toBe(false)
    expect(STAFF_ROLES.has('student' as never)).toBe(false)
  })
})

describe('USER_ROLES', () => {
  it('has super_admin as the first (most privileged) role', () => {
    expect(USER_ROLES[0]).toBe('super_admin')
  })

  it('contains all admin roles', () => {
    for (const role of ADMIN_ROLES) {
      expect(USER_ROLES).toContain(role)
    }
  })

  it('contains all staff roles', () => {
    for (const role of STAFF_ROLES) {
      expect(USER_ROLES).toContain(role)
    }
  })

  it('contains common end-user roles', () => {
    expect(USER_ROLES).toContain('parent')
    expect(USER_ROLES).toContain('student')
    expect(USER_ROLES).toContain('guest')
  })

  it('admin roles appear before non-admin roles in hierarchy', () => {
    const superAdminIdx = USER_ROLES.indexOf('super_admin')
    const teacherIdx = USER_ROLES.indexOf('teacher')
    const parentIdx = USER_ROLES.indexOf('parent')
    const studentIdx = USER_ROLES.indexOf('student')

    expect(superAdminIdx).toBeLessThan(teacherIdx)
    expect(teacherIdx).toBeLessThan(parentIdx)
    expect(parentIdx).toBeLessThan(studentIdx)
  })

  it('has no duplicate entries', () => {
    const unique = new Set(USER_ROLES)
    expect(unique.size).toBe(USER_ROLES.length)
  })
})
