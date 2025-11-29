# Simple Admin User Creation (Works 100%)

The trigger issue prevents us from creating users via SQL or API. Use this method instead:

---

## ✅ **METHOD: Use Supabase Dashboard UI**

### Step 1: Create User via Supabase Dashboard

1. Go to: https://wzfkvegqytcnjdkxowvx.supabase.co
2. Click **Authentication** in left sidebar
3. Click **Users** tab
4. Click **Add user** button (top right)
5. Select **Create new user**
6. Fill in:
   ```
   Email: admin@knasty.local
   Password: 123456789
   ```
7. ✅ **IMPORTANT:** Check "Auto Confirm User"
8. Click **Create user**

**You should see the new user appear in the list.**

---

### Step 2: Make User a Super Admin

1. Stay in Supabase, click **SQL Editor** in left sidebar
2. Click **New query**
3. Copy and paste this:

```sql
-- Update the user to super_admin
UPDATE public.users
SET
  role = 'super_admin',
  username = 'admin',
  full_name = 'System Administrator',
  is_active = true
WHERE email = 'admin@knasty.local';

-- Verify it worked
SELECT
  id,
  email,
  username,
  role,
  is_active,
  created_at
FROM public.users
WHERE email = 'admin@knasty.local';
```

4. Click **Run** (or Cmd/Ctrl + Enter)

**You should see the user with `role = 'super_admin'` in the results.**

---

### Step 3: Login

Go to: http://localhost:3000/login

**Credentials:**
- Email: `admin@knasty.local`
- Password: `123456789`

---

## 🔧 Troubleshooting

### If Step 1 fails (can't create user in dashboard):

Check **Authentication** → **Providers**:
- Make sure **Email** provider is enabled
- Disable "Confirm email" for testing (enable it later for production)

### If you get "Invalid login credentials" after creating:

Run this SQL to check if user was created:

```sql
-- Check auth.users
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@knasty.local';

-- Check public.users
SELECT id, email, username, role
FROM public.users
WHERE email = 'admin@knasty.local';
```

If user exists in `auth.users` but `email_confirmed_at` is NULL, run:

```sql
-- Manually confirm the email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@knasty.local';
```

### If user exists in auth.users but NOT in public.users:

```sql
-- Manually create profile
INSERT INTO public.users (id, email, username, full_name, role, is_active)
SELECT
  id,
  email,
  'admin',
  'System Administrator',
  'super_admin',
  true
FROM auth.users
WHERE email = 'admin@knasty.local'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'admin@knasty.local'
);
```

---

## ✅ Final Result

After successful login, you'll have access to:
- `/admin` - Admin panel
- Diocese management
- Church management
- User management
- All super_admin features

---

**This method works because the Supabase Dashboard has the necessary permissions to create auth users that we don't have via API.**
