# Create Admin User

## Admin User Credentials

**Email:** admin@knasty.local
**Password:** 123456789
**Username:** admin
**Role:** super_admin

---

## Method 1: Automated Script (Recommended)

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://wzfkvegqytcnjdkxowvx.supabase.co
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API** under Project Settings
4. Scroll to **Project API keys**
5. Copy the **service_role** key (⚠️ Keep this secret!)

### Step 2: Add Service Role Key to .env.local

Open `.env.local` and replace `your-service-role-key-here` with your actual service role key:

```
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run the Creation Script

```bash
node create-admin.js
```

You should see:
```
✅ Auth user created successfully!
✅ User profile updated to super_admin!

═══════════════════════════════════════
📋 ADMIN USER CREDENTIALS:
═══════════════════════════════════════
Email:    admin@knasty.local
Password: 123456789
Username: admin
Role:     super_admin
═══════════════════════════════════════
```

---

## Method 2: Manual Creation via Supabase Dashboard

### Step 1: Create the Auth User

1. Go to Supabase Dashboard: https://wzfkvegqytcnjdkxowvx.supabase.co
2. Click **Authentication** in the left sidebar
3. Click **Users** tab
4. Click **Add user** → **Create new user**
5. Fill in:
   - **Email:** admin@knasty.local
   - **Password:** 123456789
   - Check **Auto Confirm User**
6. Click **Create user**

### Step 2: Update User Profile

1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Paste this SQL:

```sql
-- Update the newly created user to super_admin
UPDATE public.users
SET
  role = 'super_admin',
  username = 'admin',
  full_name = 'System Administrator',
  is_active = true
WHERE email = 'admin@knasty.local';

-- Verify the admin was created
SELECT id, email, username, role, created_at
FROM public.users
WHERE email = 'admin@knasty.local';
```

4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see the admin user details in the results

---

## Login

After creating the admin user, you can login at:

**http://localhost:3000/login**

Use:
- **Email:** admin@knasty.local
- **Password:** 123456789

---

## Next Steps

Once logged in as super_admin, you can:

1. Go to `/admin` to access the admin panel
2. Create dioceses
3. Create churches
4. Create classes
5. Manage other users and assign roles

---

## Security Note

⚠️ **IMPORTANT:** Change the password after first login! The password "123456789" is only for initial setup and should be changed to something secure.

To change the password, you can either:
- Use the Supabase dashboard to reset it
- Add a password change feature in your app
- Use the Supabase API to update it
