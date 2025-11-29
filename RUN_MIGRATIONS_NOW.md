# ⚠️ CRITICAL: Run Migrations First!

## The Problem

Your database is incomplete. The `public.users` table is missing the `role` column and other fields.

**This is why login doesn't work - the database isn't set up yet!**

---

## ✅ SOLUTION: Run ALL Migrations

### Step 1: Go to Supabase SQL Editor

1. Open: https://wzfkvegqytcnjdkxowvx.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run Each Migration File IN ORDER

Open each file from `supabase/migrations/` and run them **one by one** in this exact order:

#### Migration 1: Enable RLS
File: `01_enable_rls_policies.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 2: Add Profile Fields
File: `02_add_profile_fields.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 3: Auto Create User Profile
File: `03_auto_create_user_profile.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 4: Create Login History
File: `04_create_login_history.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 5: Organizational Structure
File: `05_create_organizational_structure.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 6: Roles and Permissions
File: `06_create_roles_and_permissions.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 7: Content Tables
File: `07_create_content_tables.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 8: Requests and Participation
File: `08_create_requests_and_participation.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

#### Migration 9: RLS Policies
File: `09_create_rls_policies.sql`
- Copy the entire contents
- Paste in SQL Editor
- Click Run
- Wait for "Success"

---

## Step 3: Verify Migrations Ran Successfully

After running all 9 migrations, run this SQL to verify:

```sql
-- Check if role column exists
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
```

You should see columns like: id, email, username, full_name, bio, avatar_url, **role**, diocese_id, church_id, etc.

---

## Step 4: Create Admin User (AFTER migrations)

Once migrations are complete, use existing users OR create new admin:

### Option A: Use Existing User

You have 2 users in the database:
- beshoy.r.mansour+sunday_00@gmail.com
- maxmos.abdelsayed@gmail.com

Make one of them super_admin:

```sql
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'beshoy.r.mansour+sunday_00@gmail.com';
```

Then login with that email and its password.

### Option B: Create New Admin

1. Go to Authentication → Users
2. Click "Add user"
3. Email: admin@knasty.local
4. Password: 123456789
5. Check "Auto Confirm User"
6. Click "Create user"
7. Then run:

```sql
UPDATE public.users
SET role = 'super_admin', username = 'admin'
WHERE email = 'admin@knasty.local';
```

---

## ⚠️ Important Notes

1. **Migrations MUST be run in order (01 through 09)**
2. **Each migration must complete successfully before the next one**
3. **If a migration fails, read the error and fix it before continuing**
4. **After ALL migrations are done, then create the admin user**

---

## 🎯 After Migrations Complete

Once all migrations are run and admin user is created:

1. Go to http://localhost:3000/login
2. Login with your admin credentials
3. You'll have access to `/admin` panel
4. Everything should work!

---

**START WITH MIGRATION 01 NOW!**
