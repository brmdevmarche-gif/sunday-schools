import { getCurrentUserProfile } from './users'
import type { UserRole } from '../types/sunday-school'

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUserProfile()
  return user?.role === role
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole('super_admin')
}

/**
 * Check if user is diocese admin
 */
export async function isDioceseAdmin(): Promise<boolean> {
  return hasRole('diocese_admin')
}

/**
 * Check if user is church admin
 */
export async function isChurchAdmin(): Promise<boolean> {
  return hasRole('church_admin')
}

/**
 * Check if user is teacher
 */
export async function isTeacher(): Promise<boolean> {
  return hasRole('teacher')
}

/**
 * Check if user is parent
 */
export async function isParent(): Promise<boolean> {
  return hasRole('parent')
}

/**
 * Check if user is student
 */
export async function isStudent(): Promise<boolean> {
  return hasRole('student')
}

/**
 * Check if user is any type of admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUserProfile()
  return user?.role === 'super_admin' ||
         user?.role === 'diocese_admin' ||
         user?.role === 'church_admin'
}

/**
 * Check if user can manage dioceses
 */
export async function canManageDioceses(): Promise<boolean> {
  return isSuperAdmin()
}

/**
 * Check if user can manage a specific diocese
 */
export async function canManageDiocese(dioceseId: string): Promise<boolean> {
  const user = await getCurrentUserProfile()
  if (user?.role === 'super_admin') return true
  if (user?.role === 'diocese_admin' && user.diocese_id === dioceseId) return true
  return false
}

/**
 * Check if user can manage churches
 */
export async function canManageChurches(dioceseId?: string): Promise<boolean> {
  const user = await getCurrentUserProfile()
  if (user?.role === 'super_admin') return true
  if (user?.role === 'diocese_admin') {
    if (!dioceseId) return true
    return user.diocese_id === dioceseId
  }
  return false
}

/**
 * Check if user can manage a specific church
 */
export async function canManageChurch(churchId: string, dioceseId?: string): Promise<boolean> {
  const user = await getCurrentUserProfile()
  if (user?.role === 'super_admin') return true
  if (user?.role === 'diocese_admin' && dioceseId && user.diocese_id === dioceseId) return true
  if (user?.role === 'church_admin' && user.church_id === churchId) return true
  return false
}

/**
 * Check if user can manage classes
 */
export async function canManageClasses(churchId?: string): Promise<boolean> {
  const user = await getCurrentUserProfile()
  if (user?.role === 'super_admin') return true
  if (user?.role === 'diocese_admin') return true
  if (user?.role === 'church_admin') {
    if (!churchId) return user.church_id !== null
    return user.church_id === churchId
  }
  return false
}

/**
 * Check if user can manage users
 */
export async function canManageUsers(): Promise<boolean> {
  const user = await getCurrentUserProfile()
  return user?.role === 'super_admin' ||
         user?.role === 'diocese_admin' ||
         user?.role === 'church_admin'
}

/**
 * Get user's accessible diocese IDs
 */
export async function getAccessibleDioceseIds(): Promise<string[]> {
  const user = await getCurrentUserProfile()
  if (!user) return []

  if (user.role === 'super_admin') {
    // Super admin can access all dioceses - return empty array to indicate "all"
    return []
  }

  if (user.role === 'diocese_admin' && user.diocese_id) {
    return [user.diocese_id]
  }

  if ((user.role === 'church_admin' || user.role === 'teacher') && user.church_id) {
    // We'll need to fetch the diocese_id from the church
    // For now, return empty array
    return []
  }

  return []
}

/**
 * Get user's accessible church IDs
 */
export async function getAccessibleChurchIds(): Promise<string[]> {
  const user = await getCurrentUserProfile()
  if (!user) return []

  if (user.role === 'super_admin' || user.role === 'diocese_admin') {
    // These roles can access all churches in their scope
    return []
  }

  if (user.church_id) {
    return [user.church_id]
  }

  return []
}

/**
 * Check if user can view admin panel
 */
export async function canAccessAdminPanel(): Promise<boolean> {
  const user = await getCurrentUserProfile()
  return user?.role === 'super_admin' ||
         user?.role === 'diocese_admin' ||
         user?.role === 'church_admin' ||
         user?.role === 'teacher'
}

/**
 * Get navigation items based on user role
 */
export async function getNavigationItems() {
  const user = await getCurrentUserProfile()
  if (!user) return []

  const items = []

  // Dashboard - available to all admin users
  if (await canAccessAdminPanel()) {
    items.push({
      name: 'Dashboard',
      href: '/admin',
      icon: 'dashboard',
    })
  }

  // Diocese Management - super admin only
  if (user.role === 'super_admin') {
    items.push({
      name: 'Dioceses',
      href: '/admin/dioceses',
      icon: 'building',
    })
  }

  // Church Management - super admin and diocese admin
  if (user.role === 'super_admin' || user.role === 'diocese_admin') {
    items.push({
      name: 'Churches',
      href: '/admin/churches',
      icon: 'church',
    })
  }

  // Class Management - all admins and teachers
  if (await canAccessAdminPanel()) {
    items.push({
      name: 'Classes',
      href: '/admin/classes',
      icon: 'school',
    })
  }

  // User Management - all admins
  if (await isAdmin()) {
    items.push({
      name: 'Users',
      href: '/admin/users',
      icon: 'users',
    })
  }

  // Teacher-specific items
  if (user.role === 'teacher') {
    items.push(
      {
        name: 'Lessons',
        href: '/admin/lessons',
        icon: 'book',
      },
      {
        name: 'Attendance',
        href: '/admin/attendance',
        icon: 'check',
      },
      {
        name: 'My Tasks',
        href: '/admin/tasks',
        icon: 'task',
      }
    )
  }

  // Church admin items
  if (user.role === 'church_admin' || user.role === 'super_admin') {
    items.push(
      {
        name: 'Activities',
        href: '/admin/activities',
        icon: 'activity',
      },
      {
        name: 'Trips',
        href: '/admin/trips',
        icon: 'trip',
      },
      {
        name: 'Store',
        href: '/admin/store',
        icon: 'store',
      }
    )
  }

  return items
}
