-- =====================================================
-- SEED PERMISSIONS
-- Migration: 48_seed_permissions.sql
-- =====================================================
-- Seeds all permissions from the permission registry
-- Creates system roles and assigns default permissions
-- =====================================================

-- =====================================================
-- 1. INSERT ALL PERMISSIONS
-- =====================================================
-- This should be run after the permission registry is defined
-- For now, we'll insert the permissions manually based on the registry

-- Dashboard
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('dashboard.view', 'View Dashboard', 'Access to the admin dashboard', 'dashboard', 'dashboard', 'view', 'navigation', true)
ON CONFLICT (code) DO NOTHING;

-- Dioceses
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('dioceses.view', 'View Dioceses', 'View dioceses list', 'dioceses', 'dioceses', 'view', 'navigation', true),
  ('dioceses.create', 'Create Diocese', 'Create new diocese', 'dioceses', 'dioceses', 'create', 'action', true),
  ('dioceses.update', 'Update Diocese', 'Edit existing diocese', 'dioceses', 'dioceses', 'update', 'action', true),
  ('dioceses.delete', 'Delete Diocese', 'Delete diocese', 'dioceses', 'dioceses', 'delete', 'action', true),
  ('dioceses.view_detail', 'View Diocese Details', 'View individual diocese details', 'dioceses', 'dioceses', 'view_detail', 'view', true)
ON CONFLICT (code) DO NOTHING;

-- Churches
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('churches.view', 'View Churches', 'View churches list', 'churches', 'churches', 'view', 'navigation', true),
  ('churches.create', 'Create Church', 'Create new church', 'churches', 'churches', 'create', 'action', true),
  ('churches.update', 'Update Church', 'Edit existing church', 'churches', 'churches', 'update', 'action', true),
  ('churches.delete', 'Delete Church', 'Delete church', 'churches', 'churches', 'delete', 'action', true),
  ('churches.view_detail', 'View Church Details', 'View individual church details', 'churches', 'churches', 'view_detail', 'view', true)
ON CONFLICT (code) DO NOTHING;

-- Classes
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('classes.view', 'View Classes', 'View classes list', 'classes', 'classes', 'view', 'navigation', true),
  ('classes.create', 'Create Class', 'Create new class', 'classes', 'classes', 'create', 'action', true),
  ('classes.update', 'Update Class', 'Edit existing class', 'classes', 'classes', 'update', 'action', true),
  ('classes.delete', 'Delete Class', 'Delete class', 'classes', 'classes', 'delete', 'action', true),
  ('classes.view_detail', 'View Class Details', 'View individual class details', 'classes', 'classes', 'view_detail', 'view', true),
  ('classes.assign_teachers', 'Assign Teachers to Class', 'Assign teachers to classes', 'classes', 'classes', 'assign_teachers', 'action', true),
  ('classes.assign_students', 'Assign Students to Class', 'Assign students to classes', 'classes', 'classes', 'assign_students', 'action', true),
  ('classes.view_birthdays', 'View Class Birthdays', 'View class birthdays', 'classes', 'classes', 'view_birthdays', 'view', true),
  ('classes.view_trips', 'View Class Trips', 'View trips for a class', 'classes', 'classes', 'view_trips', 'view', true)
ON CONFLICT (code) DO NOTHING;

-- Users
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('users.view', 'View Users', 'View users list', 'users', 'users', 'view', 'navigation', true),
  ('users.create', 'Create User', 'Create new user', 'users', 'users', 'create', 'action', true),
  ('users.update', 'Update User', 'Edit existing user', 'users', 'users', 'update', 'action', true),
  ('users.delete', 'Delete User', 'Delete user', 'users', 'users', 'delete', 'action', true),
  ('users.view_detail', 'View User Details', 'View individual user details', 'users', 'users', 'view_detail', 'view', true),
  ('users.assign_roles', 'Assign Roles to User', 'Assign roles to users', 'users', 'users', 'assign_roles', 'action', true)
ON CONFLICT (code) DO NOTHING;

-- Students
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('students.view', 'View Students', 'View students list', 'students', 'students', 'view', 'navigation', true),
  ('students.create', 'Create Student', 'Create new student', 'students', 'students', 'create', 'action', true),
  ('students.update', 'Update Student', 'Edit existing student', 'students', 'students', 'update', 'action', true),
  ('students.delete', 'Delete Student', 'Delete student', 'students', 'students', 'delete', 'action', true),
  ('students.view_detail', 'View Student Details', 'View individual student details', 'students', 'students', 'view_detail', 'view', true)
ON CONFLICT (code) DO NOTHING;

-- Attendance
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('attendance.view', 'View Attendance', 'View attendance records', 'attendance', 'attendance', 'view', 'navigation', true),
  ('attendance.mark', 'Mark Attendance', 'Mark attendance for students', 'attendance', 'attendance', 'mark', 'action', true),
  ('attendance.view_stats', 'View Attendance Statistics', 'View attendance statistics', 'attendance', 'attendance', 'view_stats', 'view', true),
  ('attendance.view_history', 'View Attendance History', 'View attendance history', 'attendance', 'attendance', 'view_history', 'view', true),
  ('attendance.update', 'Update Attendance Record', 'Update existing attendance record', 'attendance', 'attendance', 'update', 'action', true)
ON CONFLICT (code) DO NOTHING;

-- Activities
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('activities.view', 'View Activities', 'View activities list', 'activities', 'activities', 'view', 'navigation', true),
  ('activities.create', 'Create Activity', 'Create new activity', 'activities', 'activities', 'create', 'action', true),
  ('activities.update', 'Update Activity', 'Edit existing activity', 'activities', 'activities', 'update', 'action', true),
  ('activities.delete', 'Delete Activity', 'Delete activity', 'activities', 'activities', 'delete', 'action', true),
  ('activities.view_detail', 'View Activity Details', 'View individual activity details', 'activities', 'activities', 'view_detail', 'view', true),
  ('activities.view_competitions', 'View Competitions', 'View competitions', 'activities', 'activities', 'view_competitions', 'view', true),
  ('activities.view_readings', 'View Readings', 'View readings', 'activities', 'activities', 'view_readings', 'view', true),
  ('activities.view_spiritual_notes', 'View Spiritual Notes', 'View spiritual notes', 'activities', 'activities', 'view_spiritual_notes', 'view', true),
  ('activities.manage_participants', 'Manage Activity Participants', 'Manage participants for activities', 'activities', 'activities', 'manage_participants', 'action', true)
ON CONFLICT (code) DO NOTHING;

-- Trips
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('trips.view', 'View Trips', 'View trips list', 'trips', 'trips', 'view', 'navigation', true),
  ('trips.create', 'Create Trip', 'Create new trip', 'trips', 'trips', 'create', 'action', true),
  ('trips.update', 'Update Trip', 'Edit existing trip', 'trips', 'trips', 'update', 'action', true),
  ('trips.delete', 'Delete Trip', 'Delete trip', 'trips', 'trips', 'delete', 'action', true),
  ('trips.view_detail', 'View Trip Details', 'View individual trip details', 'trips', 'trips', 'view_detail', 'view', true),
  ('trips.manage_participants', 'Manage Trip Participants', 'Manage participants for trips', 'trips', 'trips', 'manage_participants', 'action', true),
  ('trips.approve_registrations', 'Approve Trip Registrations', 'Approve trip registrations', 'trips', 'trips', 'approve_registrations', 'action', true)
ON CONFLICT (code) DO NOTHING;

-- Store
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('store.view', 'View Store Items', 'View store items list', 'store', 'store', 'view', 'navigation', true),
  ('store.create', 'Create Store Item', 'Create new store item', 'store', 'store', 'create', 'action', true),
  ('store.update', 'Update Store Item', 'Edit existing store item', 'store', 'store', 'update', 'action', true),
  ('store.delete', 'Delete Store Item', 'Delete store item', 'store', 'store', 'delete', 'action', true),
  ('store.view_detail', 'View Store Item Details', 'View individual store item details', 'store', 'store', 'view_detail', 'view', true),
  ('store.orders_view', 'View Store Orders', 'View store orders', 'store', 'store', 'orders_view', 'view', true),
  ('store.orders_create', 'Create Store Order', 'Create store order', 'store', 'store', 'orders_create', 'action', true),
  ('store.orders_update', 'Update Store Order', 'Update store order', 'store', 'store', 'orders_update', 'action', true),
  ('store.manage_inventory', 'Manage Inventory', 'Manage store inventory', 'store', 'store', 'manage_inventory', 'action', true)
ON CONFLICT (code) DO NOTHING;

-- Announcements
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('announcements.view', 'View Announcements', 'View announcements list', 'announcements', 'announcements', 'view', 'navigation', true),
  ('announcements.create', 'Create Announcement', 'Create new announcement', 'announcements', 'announcements', 'create', 'action', true),
  ('announcements.update', 'Update Announcement', 'Edit existing announcement', 'announcements', 'announcements', 'update', 'action', true),
  ('announcements.delete', 'Delete Announcement', 'Delete announcement', 'announcements', 'announcements', 'delete', 'action', true),
  ('announcements.view_inbox', 'View Announcements Inbox', 'View announcements inbox', 'announcements', 'announcements', 'view_inbox', 'view', true)
ON CONFLICT (code) DO NOTHING;

-- Settings
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('settings.view', 'View Settings', 'View settings page', 'settings', 'settings', 'view', 'navigation', true),
  ('settings.update', 'Update Settings', 'Update system settings', 'settings', 'settings', 'update', 'action', true)
ON CONFLICT (code) DO NOTHING;

-- Roles (Meta - for managing roles themselves)
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('roles.view', 'View Roles', 'View roles list', 'roles', 'roles', 'view', 'navigation', true),
  ('roles.create', 'Create Role', 'Create new role', 'roles', 'roles', 'create', 'action', true),
  ('roles.update', 'Update Role', 'Edit existing role', 'roles', 'roles', 'update', 'action', true),
  ('roles.delete', 'Delete Role', 'Delete role', 'roles', 'roles', 'delete', 'action', true),
  ('roles.view_detail', 'View Role Details', 'View individual role details', 'roles', 'roles', 'view_detail', 'view', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. CREATE SYSTEM ROLES
-- =====================================================

-- Super Admin Role (all permissions)
INSERT INTO public.roles (title, description, is_system_role, is_active)
VALUES ('Super Admin', 'Full system access with all permissions', true, true)
ON CONFLICT (title) DO UPDATE SET description = EXCLUDED.description;

-- Diocese Admin Role
INSERT INTO public.roles (title, description, is_system_role, is_active)
VALUES ('Diocese Admin', 'Manages churches within a diocese', true, true)
ON CONFLICT (title) DO UPDATE SET description = EXCLUDED.description;

-- Church Admin Role
INSERT INTO public.roles (title, description, is_system_role, is_active)
VALUES ('Church Admin', 'Manages classes, teachers, students within a church', true, true)
ON CONFLICT (title) DO UPDATE SET description = EXCLUDED.description;

-- Teacher Role
INSERT INTO public.roles (title, description, is_system_role, is_active)
VALUES ('Teacher', 'Manages assigned classes, lessons, attendance', true, true)
ON CONFLICT (title) DO UPDATE SET description = EXCLUDED.description;

-- =====================================================
-- 3. ASSIGN PERMISSIONS TO SYSTEM ROLES
-- =====================================================

-- Super Admin gets ALL permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.title = 'Super Admin'
  AND p.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Diocese Admin permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.title = 'Diocese Admin'
  AND p.code IN (
    'dashboard.view',
    'churches.view', 'churches.create', 'churches.update', 'churches.view_detail',
    'classes.view', 'classes.create', 'classes.update', 'classes.view_detail',
    'users.view', 'users.create', 'users.update', 'users.view_detail',
    'students.view', 'students.create', 'students.update', 'students.view_detail',
    'attendance.view', 'attendance.mark', 'attendance.view_stats', 'attendance.view_history',
    'activities.view', 'activities.create', 'activities.update', 'activities.view_detail',
    'trips.view', 'trips.create', 'trips.update', 'trips.view_detail',
    'announcements.view', 'announcements.create', 'announcements.update', 'announcements.view_inbox'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Church Admin permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.title = 'Church Admin'
  AND p.code IN (
    'dashboard.view',
    'classes.view', 'classes.create', 'classes.update', 'classes.view_detail',
    'classes.assign_teachers', 'classes.assign_students',
    'users.view', 'users.create', 'users.update', 'users.view_detail',
    'students.view', 'students.create', 'students.update', 'students.view_detail',
    'attendance.view', 'attendance.mark', 'attendance.view_stats', 'attendance.view_history',
    'activities.view', 'activities.create', 'activities.update', 'activities.view_detail',
    'trips.view', 'trips.create', 'trips.update', 'trips.view_detail',
    'store.view', 'store.create', 'store.update', 'store.view_detail', 'store.orders_view',
    'announcements.view', 'announcements.create', 'announcements.update', 'announcements.view_inbox'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Teacher permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.title = 'Teacher'
  AND p.code IN (
    'dashboard.view',
    'classes.view', 'classes.view_detail',
    'attendance.view', 'attendance.mark', 'attendance.view_stats', 'attendance.view_history',
    'activities.view', 'activities.view_detail',
    'trips.view', 'trips.view_detail',
    'announcements.view', 'announcements.view_inbox'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
