// =====================================================
// NAVIGATION PERMISSION MAPPING
// =====================================================
// Maps navigation items to their required permissions
// =====================================================

export interface NavigationItem {
  name: string
  href: string
  icon: string
  permission?: string // Required permission code
}

/**
 * Navigation items with their required permissions
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: 'dashboard',
    permission: 'dashboard.view',
  },
  {
    name: 'Dioceses',
    href: '/admin/dioceses',
    icon: 'building',
    permission: 'dioceses.view',
  },
  {
    name: 'Churches',
    href: '/admin/churches',
    icon: 'church',
    permission: 'churches.view',
  },
  {
    name: 'Classes',
    href: '/admin/classes',
    icon: 'school',
    permission: 'classes.view',
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: 'users',
    permission: 'users.view',
  },
  {
    name: 'Students',
    href: '/admin/students',
    icon: 'student',
    permission: 'students.view',
  },
  {
    name: 'Attendance',
    href: '/admin/attendance',
    icon: 'check',
    permission: 'attendance.view',
  },
  {
    name: 'Activities',
    href: '/admin/activities',
    icon: 'trophy',
    permission: 'activities.view',
  },
  {
    name: 'Trips',
    href: '/admin/trips',
    icon: 'trip',
    permission: 'trips.view',
  },
  {
    name: 'Store',
    href: '/admin/store',
    icon: 'store',
    permission: 'store.view',
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: 'announcement',
    permission: 'announcements.view',
  },
  {
    name: 'Roles',
    href: '/admin/roles',
    icon: 'shield',
    permission: 'roles.view',
  },
]

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions(
  items: NavigationItem[],
  userPermissions: string[]
): NavigationItem[] {
  return items.filter((item) => {
    // If no permission required, show it
    if (!item.permission) return true
    // Check if user has the required permission
    return userPermissions.includes(item.permission)
  })
}
