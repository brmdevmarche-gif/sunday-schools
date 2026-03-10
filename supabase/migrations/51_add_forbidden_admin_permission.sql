-- Adds an "admin.forbidden" permission used to block admin access.
-- This permission is intentionally NOT assigned to any system role by default.

INSERT INTO public.permissions (code, name, description, module, resource, action, category, is_active)
VALUES (
  'admin.forbidden',
  'Forbidden (Admin Lockout)',
  'If assigned, the user is not eligible to perform any actions in the admin app.',
  'admin',
  'admin',
  'forbidden',
  'security',
  true
)
ON CONFLICT (code) DO NOTHING;

