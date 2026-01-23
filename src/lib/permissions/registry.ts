// =====================================================
// PERMISSION REGISTRY
// =====================================================
// Central registry of all permissions in the admin panel
// This is used to auto-generate permissions in the database
// =====================================================

export interface PermissionDefinition {
  name: string;
  description: string;
  category: 'navigation' | 'action' | 'view';
}

export interface ModulePermissions {
  [action: string]: PermissionDefinition;
}

export interface PermissionRegistry {
  [module: string]: ModulePermissions;
}

export const PERMISSION_REGISTRY: PermissionRegistry = {
  dashboard: {
    view: {
      name: 'View Dashboard',
      description: 'Access to the admin dashboard',
      category: 'navigation',
    },
  },

  dioceses: {
    view: {
      name: 'View Dioceses',
      description: 'View dioceses list',
      category: 'navigation',
    },
    create: {
      name: 'Create Diocese',
      description: 'Create new diocese',
      category: 'action',
    },
    update: {
      name: 'Update Diocese',
      description: 'Edit existing diocese',
      category: 'action',
    },
    delete: {
      name: 'Delete Diocese',
      description: 'Delete diocese',
      category: 'action',
    },
    view_detail: {
      name: 'View Diocese Details',
      description: 'View individual diocese details',
      category: 'view',
    },
  },

  churches: {
    view: {
      name: 'View Churches',
      description: 'View churches list',
      category: 'navigation',
    },
    create: {
      name: 'Create Church',
      description: 'Create new church',
      category: 'action',
    },
    update: {
      name: 'Update Church',
      description: 'Edit existing church',
      category: 'action',
    },
    delete: {
      name: 'Delete Church',
      description: 'Delete church',
      category: 'action',
    },
    view_detail: {
      name: 'View Church Details',
      description: 'View individual church details',
      category: 'view',
    },
  },

  classes: {
    view: {
      name: 'View Classes',
      description: 'View classes list',
      category: 'navigation',
    },
    create: {
      name: 'Create Class',
      description: 'Create new class',
      category: 'action',
    },
    update: {
      name: 'Update Class',
      description: 'Edit existing class',
      category: 'action',
    },
    delete: {
      name: 'Delete Class',
      description: 'Delete class',
      category: 'action',
    },
    view_detail: {
      name: 'View Class Details',
      description: 'View individual class details',
      category: 'view',
    },
    assign_teachers: {
      name: 'Assign Teachers to Class',
      description: 'Assign teachers to classes',
      category: 'action',
    },
    assign_students: {
      name: 'Assign Students to Class',
      description: 'Assign students to classes',
      category: 'action',
    },
    view_birthdays: {
      name: 'View Class Birthdays',
      description: 'View class birthdays',
      category: 'view',
    },
    view_trips: {
      name: 'View Class Trips',
      description: 'View trips for a class',
      category: 'view',
    },
  },

  users: {
    view: {
      name: 'View Users',
      description: 'View users list',
      category: 'navigation',
    },
    create: {
      name: 'Create User',
      description: 'Create new user',
      category: 'action',
    },
    update: {
      name: 'Update User',
      description: 'Edit existing user',
      category: 'action',
    },
    delete: {
      name: 'Delete User',
      description: 'Delete user',
      category: 'action',
    },
    view_detail: {
      name: 'View User Details',
      description: 'View individual user details',
      category: 'view',
    },
    assign_roles: {
      name: 'Assign Roles to User',
      description: 'Assign roles to users',
      category: 'action',
    },
  },

  students: {
    view: {
      name: 'View Students',
      description: 'View students list',
      category: 'navigation',
    },
    create: {
      name: 'Create Student',
      description: 'Create new student',
      category: 'action',
    },
    update: {
      name: 'Update Student',
      description: 'Edit existing student',
      category: 'action',
    },
    delete: {
      name: 'Delete Student',
      description: 'Delete student',
      category: 'action',
    },
    view_detail: {
      name: 'View Student Details',
      description: 'View individual student details',
      category: 'view',
    },
  },

  attendance: {
    view: {
      name: 'View Attendance',
      description: 'View attendance records',
      category: 'navigation',
    },
    mark: {
      name: 'Mark Attendance',
      description: 'Mark attendance for students',
      category: 'action',
    },
    view_stats: {
      name: 'View Attendance Statistics',
      description: 'View attendance statistics',
      category: 'view',
    },
    view_history: {
      name: 'View Attendance History',
      description: 'View attendance history',
      category: 'view',
    },
    update: {
      name: 'Update Attendance Record',
      description: 'Update existing attendance record',
      category: 'action',
    },
  },

  activities: {
    view: {
      name: 'View Activities',
      description: 'View activities list',
      category: 'navigation',
    },
    create: {
      name: 'Create Activity',
      description: 'Create new activity',
      category: 'action',
    },
    update: {
      name: 'Update Activity',
      description: 'Edit existing activity',
      category: 'action',
    },
    delete: {
      name: 'Delete Activity',
      description: 'Delete activity',
      category: 'action',
    },
    view_detail: {
      name: 'View Activity Details',
      description: 'View individual activity details',
      category: 'view',
    },
    view_competitions: {
      name: 'View Competitions',
      description: 'View competitions',
      category: 'view',
    },
    view_readings: {
      name: 'View Readings',
      description: 'View readings',
      category: 'view',
    },
    view_spiritual_notes: {
      name: 'View Spiritual Notes',
      description: 'View spiritual notes',
      category: 'view',
    },
    manage_participants: {
      name: 'Manage Activity Participants',
      description: 'Manage participants for activities',
      category: 'action',
    },
  },

  trips: {
    view: {
      name: 'View Trips',
      description: 'View trips list',
      category: 'navigation',
    },
    create: {
      name: 'Create Trip',
      description: 'Create new trip',
      category: 'action',
    },
    update: {
      name: 'Update Trip',
      description: 'Edit existing trip',
      category: 'action',
    },
    delete: {
      name: 'Delete Trip',
      description: 'Delete trip',
      category: 'action',
    },
    view_detail: {
      name: 'View Trip Details',
      description: 'View individual trip details',
      category: 'view',
    },
    manage_participants: {
      name: 'Manage Trip Participants',
      description: 'Manage participants for trips',
      category: 'action',
    },
    approve_registrations: {
      name: 'Approve Trip Registrations',
      description: 'Approve trip registrations',
      category: 'action',
    },
  },

  store: {
    view: {
      name: 'View Store Items',
      description: 'View store items list',
      category: 'navigation',
    },
    create: {
      name: 'Create Store Item',
      description: 'Create new store item',
      category: 'action',
    },
    update: {
      name: 'Update Store Item',
      description: 'Edit existing store item',
      category: 'action',
    },
    delete: {
      name: 'Delete Store Item',
      description: 'Delete store item',
      category: 'action',
    },
    view_detail: {
      name: 'View Store Item Details',
      description: 'View individual store item details',
      category: 'view',
    },
    orders_view: {
      name: 'View Store Orders',
      description: 'View store orders',
      category: 'view',
    },
    orders_create: {
      name: 'Create Store Order',
      description: 'Create store order',
      category: 'action',
    },
    orders_update: {
      name: 'Update Store Order',
      description: 'Update store order',
      category: 'action',
    },
    manage_inventory: {
      name: 'Manage Inventory',
      description: 'Manage store inventory',
      category: 'action',
    },
  },

  announcements: {
    view: {
      name: 'View Announcements',
      description: 'View announcements list',
      category: 'navigation',
    },
    create: {
      name: 'Create Announcement',
      description: 'Create new announcement',
      category: 'action',
    },
    update: {
      name: 'Update Announcement',
      description: 'Edit existing announcement',
      category: 'action',
    },
    delete: {
      name: 'Delete Announcement',
      description: 'Delete announcement',
      category: 'action',
    },
    view_inbox: {
      name: 'View Announcements Inbox',
      description: 'View announcements inbox',
      category: 'view',
    },
  },

  settings: {
    view: {
      name: 'View Settings',
      description: 'View settings page',
      category: 'navigation',
    },
    update: {
      name: 'Update Settings',
      description: 'Update system settings',
      category: 'action',
    },
  },

  roles: {
    view: {
      name: 'View Roles',
      description: 'View roles list',
      category: 'navigation',
    },
    create: {
      name: 'Create Role',
      description: 'Create new role',
      category: 'action',
    },
    update: {
      name: 'Update Role',
      description: 'Edit existing role',
      category: 'action',
    },
    delete: {
      name: 'Delete Role',
      description: 'Delete role',
      category: 'action',
    },
    view_detail: {
      name: 'View Role Details',
      description: 'View individual role details',
      category: 'view',
    },
  },
};

/**
 * Get all permission codes from the registry
 */
export function getAllPermissionCodes(): string[] {
  const codes: string[] = [];
  for (const [module, permissions] of Object.entries(PERMISSION_REGISTRY)) {
    for (const [action, _] of Object.entries(permissions)) {
      codes.push(`${module}.${action}`);
    }
  }
  return codes;
}

/**
 * Get permission definition by code
 */
export function getPermissionByCode(code: string): {
  module: string;
  resource: string;
  action: string;
  definition: PermissionDefinition;
} | null {
  const [module, action] = code.split('.');
  if (!module || !action) return null;

  const modulePermissions = PERMISSION_REGISTRY[module];
  if (!modulePermissions) return null;

  const definition = modulePermissions[action];
  if (!definition) return null;

  return {
    module,
    resource: module,
    action,
    definition,
  };
}

/**
 * Get all permissions grouped by module
 */
export function getPermissionsByModule(): Record<string, Array<{
  code: string;
  action: string;
  definition: PermissionDefinition;
}>> {
  const grouped: Record<string, Array<{
    code: string;
    action: string;
    definition: PermissionDefinition;
  }>> = {};

  for (const [module, permissions] of Object.entries(PERMISSION_REGISTRY)) {
    grouped[module] = [];
    for (const [action, definition] of Object.entries(permissions)) {
      grouped[module].push({
        code: `${module}.${action}`,
        action,
        definition,
      });
    }
  }

  return grouped;
}
