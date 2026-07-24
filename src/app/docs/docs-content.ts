/**
 * Documentation content structure for Knasty Portal
 * Organized by role with subsections containing i18n keys
 */

export interface DocsSubsection {
  id: string
  titleKey: string
  contentKey: string
}

export interface DocsSection {
  id: string
  titleKey: string
  descriptionKey: string
  icon: string
  roles: string[]
  subsections: DocsSubsection[]
}

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: 'overview',
    titleKey: 'docs.sections.overview.title',
    descriptionKey: 'docs.sections.overview.description',
    icon: 'home',
    roles: ['public', 'student', 'teacher', 'parent', 'church_admin', 'diocese_admin', 'super_admin'],
    subsections: [
      {
        id: 'what-is-knasty',
        titleKey: 'docs.overview.whatIsKnasty.title',
        contentKey: 'docs.overview.whatIsKnasty.content',
      },
      {
        id: 'features',
        titleKey: 'docs.overview.features.title',
        contentKey: 'docs.overview.features.content',
      },
      {
        id: 'roles',
        titleKey: 'docs.overview.roles.title',
        contentKey: 'docs.overview.roles.content',
      },
      {
        id: 'getting-started',
        titleKey: 'docs.overview.gettingStarted.title',
        contentKey: 'docs.overview.gettingStarted.content',
      },
    ],
  },
  {
    id: 'student-guide',
    titleKey: 'docs.sections.studentGuide.title',
    descriptionKey: 'docs.sections.studentGuide.description',
    icon: 'graduate-cap',
    roles: ['public', 'student', 'church_admin', 'diocese_admin', 'super_admin'],
    subsections: [
      {
        id: 'dashboard-overview',
        titleKey: 'docs.studentGuide.dashboardOverview.title',
        contentKey: 'docs.studentGuide.dashboardOverview.content',
      },
      {
        id: 'trips',
        titleKey: 'docs.studentGuide.trips.title',
        contentKey: 'docs.studentGuide.trips.content',
      },
      {
        id: 'store',
        titleKey: 'docs.studentGuide.store.title',
        contentKey: 'docs.studentGuide.store.content',
      },
      {
        id: 'activities',
        titleKey: 'docs.studentGuide.activities.title',
        contentKey: 'docs.studentGuide.activities.content',
      },
      {
        id: 'competitions',
        titleKey: 'docs.studentGuide.competitions.title',
        contentKey: 'docs.studentGuide.competitions.content',
      },
      {
        id: 'spiritual-notes',
        titleKey: 'docs.studentGuide.spiritualNotes.title',
        contentKey: 'docs.studentGuide.spiritualNotes.content',
      },
      {
        id: 'gamification',
        titleKey: 'docs.studentGuide.gamification.title',
        contentKey: 'docs.studentGuide.gamification.content',
      },
      {
        id: 'profile',
        titleKey: 'docs.studentGuide.profile.title',
        contentKey: 'docs.studentGuide.profile.content',
      },
    ],
  },
  {
    id: 'teacher-guide',
    titleKey: 'docs.sections.teacherGuide.title',
    descriptionKey: 'docs.sections.teacherGuide.description',
    icon: 'book-open',
    roles: ['teacher', 'church_admin', 'diocese_admin', 'super_admin'],
    subsections: [
      {
        id: 'dashboard-overview',
        titleKey: 'docs.teacherGuide.dashboardOverview.title',
        contentKey: 'docs.teacherGuide.dashboardOverview.content',
      },
      {
        id: 'classes',
        titleKey: 'docs.teacherGuide.classes.title',
        contentKey: 'docs.teacherGuide.classes.content',
      },
      {
        id: 'attendance',
        titleKey: 'docs.teacherGuide.attendance.title',
        contentKey: 'docs.teacherGuide.attendance.content',
      },
      {
        id: 'student-drawer',
        titleKey: 'docs.teacherGuide.studentDrawer.title',
        contentKey: 'docs.teacherGuide.studentDrawer.content',
      },
      {
        id: 'trips',
        titleKey: 'docs.teacherGuide.trips.title',
        contentKey: 'docs.teacherGuide.trips.content',
      },
      {
        id: 'announcements',
        titleKey: 'docs.teacherGuide.announcements.title',
        contentKey: 'docs.teacherGuide.announcements.content',
      },
      {
        id: 'student-search',
        titleKey: 'docs.teacherGuide.studentSearch.title',
        contentKey: 'docs.teacherGuide.studentSearch.content',
      },
    ],
  },
  {
    id: 'parent-guide',
    titleKey: 'docs.sections.parentGuide.title',
    descriptionKey: 'docs.sections.parentGuide.description',
    icon: 'users',
    roles: ['parent', 'church_admin', 'diocese_admin', 'super_admin'],
    subsections: [
      {
        id: 'dashboard-overview',
        titleKey: 'docs.parentGuide.dashboardOverview.title',
        contentKey: 'docs.parentGuide.dashboardOverview.content',
      },
      {
        id: 'child-selector',
        titleKey: 'docs.parentGuide.childSelector.title',
        contentKey: 'docs.parentGuide.childSelector.content',
      },
      {
        id: 'child-profile',
        titleKey: 'docs.parentGuide.childProfile.title',
        contentKey: 'docs.parentGuide.childProfile.content',
      },
      {
        id: 'approvals',
        titleKey: 'docs.parentGuide.approvals.title',
        contentKey: 'docs.parentGuide.approvals.content',
      },
      {
        id: 'notifications',
        titleKey: 'docs.parentGuide.notifications.title',
        contentKey: 'docs.parentGuide.notifications.content',
      },
      {
        id: 'store',
        titleKey: 'docs.parentGuide.store.title',
        contentKey: 'docs.parentGuide.store.content',
      },
      {
        id: 'trips',
        titleKey: 'docs.parentGuide.trips.title',
        contentKey: 'docs.parentGuide.trips.content',
      },
      {
        id: 'activities',
        titleKey: 'docs.parentGuide.activities.title',
        contentKey: 'docs.parentGuide.activities.content',
      },
    ],
  },
  {
    id: 'church-admin-guide',
    titleKey: 'docs.sections.churchAdminGuide.title',
    descriptionKey: 'docs.sections.churchAdminGuide.description',
    icon: 'church',
    roles: ['church_admin', 'diocese_admin', 'super_admin'],
    subsections: [
      {
        id: 'dashboard-overview',
        titleKey: 'docs.churchAdminGuide.dashboardOverview.title',
        contentKey: 'docs.churchAdminGuide.dashboardOverview.content',
      },
      {
        id: 'classes',
        titleKey: 'docs.churchAdminGuide.classes.title',
        contentKey: 'docs.churchAdminGuide.classes.content',
      },
      {
        id: 'users',
        titleKey: 'docs.churchAdminGuide.users.title',
        contentKey: 'docs.churchAdminGuide.users.content',
      },
      {
        id: 'students',
        titleKey: 'docs.churchAdminGuide.students.title',
        contentKey: 'docs.churchAdminGuide.students.content',
      },
      {
        id: 'attendance',
        titleKey: 'docs.churchAdminGuide.attendance.title',
        contentKey: 'docs.churchAdminGuide.attendance.content',
      },
      {
        id: 'activities',
        titleKey: 'docs.churchAdminGuide.activities.title',
        contentKey: 'docs.churchAdminGuide.activities.content',
      },
      {
        id: 'trips',
        titleKey: 'docs.churchAdminGuide.trips.title',
        contentKey: 'docs.churchAdminGuide.trips.content',
      },
      {
        id: 'store',
        titleKey: 'docs.churchAdminGuide.store.title',
        contentKey: 'docs.churchAdminGuide.store.content',
      },
      {
        id: 'points',
        titleKey: 'docs.churchAdminGuide.points.title',
        contentKey: 'docs.churchAdminGuide.points.content',
      },
      {
        id: 'announcements',
        titleKey: 'docs.churchAdminGuide.announcements.title',
        contentKey: 'docs.churchAdminGuide.announcements.content',
      },
      {
        id: 'settings',
        titleKey: 'docs.churchAdminGuide.settings.title',
        contentKey: 'docs.churchAdminGuide.settings.content',
      },
    ],
  },
  {
    id: 'diocese-admin-guide',
    titleKey: 'docs.sections.dioceseAdminGuide.title',
    descriptionKey: 'docs.sections.dioceseAdminGuide.description',
    icon: 'building-2',
    roles: ['diocese_admin', 'super_admin'],
    subsections: [
      {
        id: 'dashboard-overview',
        titleKey: 'docs.dioceseAdminGuide.dashboardOverview.title',
        contentKey: 'docs.dioceseAdminGuide.dashboardOverview.content',
      },
      {
        id: 'churches',
        titleKey: 'docs.dioceseAdminGuide.churches.title',
        contentKey: 'docs.dioceseAdminGuide.churches.content',
      },
      {
        id: 'classes',
        titleKey: 'docs.dioceseAdminGuide.classes.title',
        contentKey: 'docs.dioceseAdminGuide.classes.content',
      },
      {
        id: 'users',
        titleKey: 'docs.dioceseAdminGuide.users.title',
        contentKey: 'docs.dioceseAdminGuide.users.content',
      },
      {
        id: 'students',
        titleKey: 'docs.dioceseAdminGuide.students.title',
        contentKey: 'docs.dioceseAdminGuide.students.content',
      },
      {
        id: 'overview-inheritance',
        titleKey: 'docs.dioceseAdminGuide.overviewInheritance.title',
        contentKey: 'docs.dioceseAdminGuide.overviewInheritance.content',
      },
    ],
  },
  {
    id: 'super-admin-guide',
    titleKey: 'docs.sections.superAdminGuide.title',
    descriptionKey: 'docs.sections.superAdminGuide.description',
    icon: 'shield',
    roles: ['super_admin'],
    subsections: [
      {
        id: 'system-overview',
        titleKey: 'docs.superAdminGuide.systemOverview.title',
        contentKey: 'docs.superAdminGuide.systemOverview.content',
      },
      {
        id: 'dioceses',
        titleKey: 'docs.superAdminGuide.dioceses.title',
        contentKey: 'docs.superAdminGuide.dioceses.content',
      },
      {
        id: 'roles-permissions',
        titleKey: 'docs.superAdminGuide.rolesPermissions.title',
        contentKey: 'docs.superAdminGuide.rolesPermissions.content',
      },
      {
        id: 'system-health',
        titleKey: 'docs.superAdminGuide.systemHealth.title',
        contentKey: 'docs.superAdminGuide.systemHealth.content',
      },
      {
        id: 'user-management',
        titleKey: 'docs.superAdminGuide.userManagement.title',
        contentKey: 'docs.superAdminGuide.userManagement.content',
      },
    ],
  },
  {
    id: 'api-reference',
    titleKey: 'docs.sections.apiReference.title',
    descriptionKey: 'docs.sections.apiReference.description',
    icon: 'code',
    roles: ['church_admin', 'diocese_admin', 'super_admin'],
    subsections: [
      {
        id: 'authentication',
        titleKey: 'docs.apiReference.authentication.title',
        contentKey: 'docs.apiReference.authentication.content',
      },
      {
        id: 'endpoints',
        titleKey: 'docs.apiReference.endpoints.title',
        contentKey: 'docs.apiReference.endpoints.content',
      },
      {
        id: 'server-actions',
        titleKey: 'docs.apiReference.serverActions.title',
        contentKey: 'docs.apiReference.serverActions.content',
      },
      {
        id: 'error-handling',
        titleKey: 'docs.apiReference.errorHandling.title',
        contentKey: 'docs.apiReference.errorHandling.content',
      },
      {
        id: 'rate-limiting',
        titleKey: 'docs.apiReference.rateLimiting.title',
        contentKey: 'docs.apiReference.rateLimiting.content',
      },
    ],
  },
  {
    id: 'developer-docs',
    titleKey: 'docs.sections.developerDocs.title',
    descriptionKey: 'docs.sections.developerDocs.description',
    icon: 'code-2',
    roles: ['super_admin'],
    subsections: [
      {
        id: 'architecture',
        titleKey: 'docs.developerDocs.architecture.title',
        contentKey: 'docs.developerDocs.architecture.content',
      },
      {
        id: 'setup',
        titleKey: 'docs.developerDocs.setup.title',
        contentKey: 'docs.developerDocs.setup.content',
      },
      {
        id: 'security',
        titleKey: 'docs.developerDocs.security.title',
        contentKey: 'docs.developerDocs.security.content',
      },
      {
        id: 'database',
        titleKey: 'docs.developerDocs.database.title',
        contentKey: 'docs.developerDocs.database.content',
      },
      {
        id: 'permissions',
        titleKey: 'docs.developerDocs.permissions.title',
        contentKey: 'docs.developerDocs.permissions.content',
      },
      {
        id: 'internationalization',
        titleKey: 'docs.developerDocs.internationalization.title',
        contentKey: 'docs.developerDocs.internationalization.content',
      },
      {
        id: 'coding-conventions',
        titleKey: 'docs.developerDocs.codingConventions.title',
        contentKey: 'docs.developerDocs.codingConventions.content',
      },
      {
        id: 'testing',
        titleKey: 'docs.developerDocs.testing.title',
        contentKey: 'docs.developerDocs.testing.content',
      },
    ],
  },
]

/**
 * Filter sections based on user role
 */
export function filterSectionsByRole(role: string | null): DocsSection[] {
  const userRole = role || 'public'
  return DOCS_SECTIONS.filter((section) => section.roles.includes(userRole))
}
