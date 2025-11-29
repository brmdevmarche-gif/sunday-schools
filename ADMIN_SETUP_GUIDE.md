# Admin User Setup Guide

## Method 1: Supabase Dashboard (EASIEST - Use This!)

This is the most reliable method.

### Step 1: Create User in Supabase Dashboard

1. Go to https://wzfkvegqytcnjdkxowvx.supabase.co
2. Click **Authentication** in the left sidebar
3. Click the **Users** tab
4. Click **Add user** button
5. Select **Create new user**
6. Fill in:
   - **Email:** `admin@knasty.local`
   - **Password:** `123456789`
   - **Check:** ✅ Auto Confirm User (IMPORTANT!)
7. Click **Create user**

You should see the new user in the list.

### Step 2: Make User a Super Admin

1. Still in Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste this SQL:

```sql
UPDATE public.users
SET
  role = 'super_admin',
  username = 'admin',
  full_name = 'System Administrator',
  is_active = true
WHERE email = 'admin@knasty.local';

-- Verify it worked
SELECT id, email, username, role, is_active
FROM public.users
WHERE email = 'admin@knasty.local';
```

4. Click **Run** (or press Cmd/Ctrl + Enter)

You should see the user with role = 'super_admin' in the results.

### Step 3: Login

Go to http://localhost:3000/login

- **Email:** admin@knasty.local
- **Password:** 123456789

---

## Method 2: SQL Script (If Method 1 Doesn't Work)

1. Go to https://wzfkvegqytcnjdkxowvx.supabase.co
2. Click **SQL Editor**
3. Click **New query**
4. Open the file `create-admin-simple.sql` from your project
5. Copy ALL the contents
6. Paste into the SQL Editor
7. Click **Run**

---

## Troubleshooting

### "Invalid login credentials" Error

**Check 1: Is the migration run?**
```sql
-- Run this in SQL Editor to check if users table exists
SELECT * FROM public.users LIMIT 1;
```

If you get an error, you need to run the migrations first (see below).

**Check 2: Is the user in auth.users?**
```sql
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@knasty.local';
```

If you see the user but `email_confirmed_at` is NULL, the email isn't confirmed. Run:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@knasty.local';
```

**Check 3: Is the user in public.users?**
```sql
SELECT id, email, role
FROM public.users
WHERE email = 'admin@knasty.local';
```

If the user is NOT there, run:
```sql
-- Get the user ID from auth.users first
INSERT INTO public.users (id, email, username, full_name, role, is_active)
SELECT
  id,
  email,
  'admin',
  'System Administrator',
  'super_admin',
  true
FROM auth.users
WHERE email = 'admin@knasty.local';
```

### "Database error" When Creating User

This usually means the migrations haven't been run. Run all migrations in order:

1. `supabase/migrations/01_enable_rls_policies.sql`
2. `supabase/migrations/02_add_profile_fields.sql`
3. `supabase/migrations/03_auto_create_user_profile.sql`
4. `supabase/migrations/04_create_login_history.sql`
5. `supabase/migrations/05_create_organizational_structure.sql`
6. `supabase/migrations/06_create_roles_and_permissions.sql`
7. `supabase/migrations/07_create_content_tables.sql`
8. `supabase/migrations/08_create_requests_and_participation.sql`
9. `supabase/migrations/09_create_rls_policies.sql`

### Still Not Working?

Delete and recreate:

```sql
-- Delete existing user
DELETE FROM public.users WHERE email = 'admin@knasty.local';
DELETE FROM auth.users WHERE email = 'admin@knasty.local';
```

Then use Method 1 above to create from scratch.

---

## Final Credentials

Once created successfully:

**Login URL:** http://localhost:3000/login

**Credentials:**
- Email: `admin@knasty.local`
- Password: `123456789`
- Username: `admin`
- Role: `super_admin`

⚠️ **IMPORTANT:** Change the password after first login!

---

## After Login

Once logged in as super_admin, you can:

1. Access the admin panel at `/admin`
2. Create dioceses
3. Create churches
4. Create classes
5. Manage users and assign roles
6. View all system data
