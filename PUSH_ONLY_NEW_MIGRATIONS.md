# Push Only New Migrations - Step by Step

## Problem
Your database already has some migrations applied manually, but Supabase CLI doesn't know about them. We need to:
1. Mark existing migrations as applied
2. Push only the new migration (21_trips_system.sql)

---

## Solution: Two-Step Process

### Step 1: Mark Existing Migrations as Applied

**Option A: Using SQL (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL to mark existing migrations as applied:

```sql
-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mark existing migrations as applied
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
```

**Option B: Using CLI (if you know the exact timestamps)**

```bash
npx supabase migration repair --status applied --version 00
npx supabase migration repair --status applied --version 10
# ... repeat for each migration
```

---

### Step 2: Push Only New Migration

After marking existing migrations, push the new one:

```bash
npx supabase db push
```

This will now only push migration `21_trips_system.sql` since the others are marked as applied.

---

## Alternative: Push Single Migration Directly

If you just want to push migration 21 without dealing with tracking:

**Option 1: Direct SQL (Easiest)**
1. Open Supabase SQL Editor
2. Copy contents of `supabase/migrations/21_trips_system.sql`
3. Paste and run

**Option 2: Using CLI with specific file**

```bash
# Push only migration 21
npx supabase db push --include 21_trips_system.sql
```

---

## Verify What's Applied

Check migration status:

```bash
npx supabase migration list
```

You should see:
- ✅ Remote: All migrations 00-19 (marked as applied)
- ⏳ Local only: 21_trips_system.sql (needs to be pushed)

---

## Quick Command Reference

```bash
# Check migration status
npx supabase migration list

# Push all new migrations
npx supabase db push

# Mark migration as applied (if needed)
npx supabase migration repair --status applied --version 21
```

