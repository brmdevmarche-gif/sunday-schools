-- Mark existing migrations as applied in Supabase migration tracking
-- Run this in Supabase SQL Editor first, then push new migrations

-- Insert migration records for already-applied migrations
INSERT INTO supabase_migrations.schema_migrations (version, name, inserted_at)
VALUES 
  ('00', '00_FRESH_DATABASE_SETUP', NOW()),
  ('10', '10_add_admin_users_policies', NOW()),
  ('11', '11_add_user_settings', NOW()),
  ('12', '12_add_diocese_admin_assignments', NOW()),
  ('13', '13_add_images_and_themes', NOW()),
  ('14', '14_add_class_assignments_policies', NOW()),
  ('15', '15_create_store_items', NOW()),
  ('15', '15_create_store_items_v2', NOW()),
  ('16', '16_enhance_store_items', NOW()),
  ('17', '17_ensure_user_avatar_phone', NOW()),
  ('18', '18_create_store_orders', NOW()),
  ('19', '19_create_activities_system', NOW())
ON CONFLICT (version) DO NOTHING;

