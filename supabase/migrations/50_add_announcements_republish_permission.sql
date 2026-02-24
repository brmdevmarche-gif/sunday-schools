-- =====================================================
-- ADD ANNOUNCEMENTS.REPUBLISH PERMISSION
-- Migration: 50_add_announcements_republish_permission.sql
-- =====================================================
-- Adds the new announcements.republish permission
-- and assigns it to system roles that have announcement permissions
-- =====================================================

-- Insert the new republish permission
INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES 
  ('announcements.republish', 'Republish Announcement', 'Republish deactivated or expired announcement', 'announcements', 'announcements', 'republish', 'action', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Assign to Super Admin (gets all permissions automatically, but ensure it's there)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.title = 'Super Admin'
  AND p.code = 'announcements.republish'
  AND p.is_active = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to Diocese Admin (if they have announcement permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.title = 'Diocese Admin'
  AND p.code = 'announcements.republish'
  AND p.is_active = true
  AND EXISTS (
    SELECT 1 
    FROM public.role_permissions rp2
    JOIN public.permissions p2 ON rp2.permission_id = p2.id
    WHERE rp2.role_id = r.id 
      AND p2.code = 'announcements.update'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to Church Admin (if they have announcement permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.title = 'Church Admin'
  AND p.code = 'announcements.republish'
  AND p.is_active = true
  AND EXISTS (
    SELECT 1 
    FROM public.role_permissions rp2
    JOIN public.permissions p2 ON rp2.permission_id = p2.id
    WHERE rp2.role_id = r.id 
      AND p2.code = 'announcements.update'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
