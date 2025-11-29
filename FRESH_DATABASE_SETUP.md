# 🎯 Fresh Database Setup - Complete Guide

This guide will help you set up a brand new Sunday School database from scratch.

---

## 📋 Prerequisites

- Supabase account with a new project created
- Project URL and keys from Supabase dashboard

---

## ⚡ Quick Setup (3 Steps)

### **Step 1: Create New Supabase Project**

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name:** knasty-sunday-school (or any name)
   - **Database Password:** (create a strong password and save it)
   - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for database to provision

### **Step 2: Update .env.local with New Project Keys**

1. In Supabase, go to **Settings** → **API**
2. Copy the following keys:
   - **Project URL**
   - **anon/public key**
   - **service_role key** (keep this secret!)

3. Update `/Users/mahinourmagdi/projects/knasty/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Step 3: Run the Migration**

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file: `supabase/migrations/00_FRESH_DATABASE_SETUP.sql`
4. **Copy the ENTIRE contents** of the file
5. Paste into the SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. Wait for completion (should take 5-10 seconds)

You should see:
```
✅ DATABASE SETUP COMPLETE!
Created:
  - 14 tables with full RLS protection
  - 7 helper functions for permissions
  - Comprehensive indexes
  - Auto-create user profile trigger
```

---

## 🔐 Create Admin User

### Option A: Via Supabase Dashboard (Recommended)

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   ```
   Email: admin@knasty.local
   Password: 123456789
   ```
4. ✅ Check **"Auto Confirm User"**
5. Click **"Create user"**

6. Go to **SQL Editor** → **"New query"**
7. Paste and run:
   ```sql
   UPDATE public.users
   SET
     role = 'super_admin',
     username = 'admin',
     full_name = 'System Administrator',
     is_active = true
   WHERE email = 'admin@knasty.local';

   -- Verify
   SELECT id, email, username, role FROM public.users WHERE email = 'admin@knasty.local';
   ```

8. You should see the user with `role = 'super_admin'`

### Option B: Via Script (Alternative)

Update and run the admin creation script (instructions below).

---

## ✅ Verify Setup

### Check 1: Tables Created

Run this in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- activities
- activity_participants
- attendance
- class_assignments
- classes
- churches
- dioceses
- lessons
- login_history
- requests
- store_items
- store_order_items
- store_orders
- tasks
- trip_participants
- trips
- user_relationships
- users

### Check 2: Admin User Exists

```sql
SELECT
  u.email,
  u.username,
  u.role,
  u.is_active,
  a.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.users u
JOIN auth.users a ON a.id = u.id
WHERE u.email = 'admin@knasty.local';
```

Should show:
- email: admin@knasty.local
- username: admin
- role: super_admin
- is_active: true
- email_confirmed: true

---

## 🚀 Test Login

1. Make sure your Next.js app is running:
   ```bash
   npm run dev
   ```

2. Open browser to: http://localhost:3000/login

3. Login with:
   - **Email:** admin@knasty.local
   - **Password:** 123456789

4. You should be redirected to `/dashboard`

5. Navigate to: http://localhost:3000/admin

6. You should see the admin panel with:
   - Dashboard
   - Diocese Management
   - Church Management
   - Class Management
   - User Management

---

## 🎯 Create Your First Data

### 1. Create a Diocese

1. Go to `/admin/dioceses`
2. Click **"Create Diocese"**
3. Fill in:
   - Name: "Diocese of Alexandria"
   - Description: "Main diocese"
   - Location: "Alexandria, Egypt"
4. Click **"Create"**

### 2. Create a Church

1. Go to `/admin/churches`
2. Click **"Create Church"**
3. Fill in:
   - Diocese: Select "Diocese of Alexandria"
   - Name: "St. Mary Church"
   - City: "Alexandria"
   - Address: "123 Main Street"
4. Click **"Create"**

### 3. Create a Class

1. Go to `/admin/classes`
2. Click **"Create Class"**
3. Fill in:
   - Church: Select "St. Mary Church"
   - Name: "Grade 1 Sunday School"
   - Grade Level: "Grade 1"
   - Academic Year: "2024-2025"
   - Capacity: 20
4. Click **"Create"**

### 4. Create More Users

1. Go to `/admin/users`
2. First create them in Supabase Authentication UI
3. Then assign roles and link to churches

---

## 🔧 Troubleshooting

### Issue: Migration fails with error

**Solution:**
- Make sure you're using a FRESH database
- If you ran other migrations before, create a NEW Supabase project
- Copy and paste the ENTIRE migration file

### Issue: Can't login - "Invalid credentials"

**Check 1:** Is user in auth.users?
```sql
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'admin@knasty.local';
```

**Check 2:** Is user in public.users?
```sql
SELECT email, role FROM public.users WHERE email = 'admin@knasty.local';
```

**Check 3:** Is email confirmed?
If `email_confirmed_at` is NULL, run:
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'admin@knasty.local';
```

### Issue: User created but no profile in public.users

The trigger should auto-create it, but if not:
```sql
INSERT INTO public.users (id, email, username, role, is_active)
SELECT
  id,
  email,
  'admin',
  'super_admin',
  true
FROM auth.users
WHERE email = 'admin@knasty.local';
```

### Issue: Environment variables not updating

1. Stop your Next.js dev server (Ctrl+C)
2. Update `.env.local` with new keys
3. Restart: `npm run dev`

---

## 📊 What You Get

After setup, you have:

✅ **Complete database** with 18 tables
✅ **Row Level Security** on all tables
✅ **Permission system** with 6 roles
✅ **Admin panel** for management
✅ **Auto-create profiles** on user signup
✅ **Login history** tracking
✅ **Organizational hierarchy** (Diocese → Church → Class)
✅ **User management** with role assignments
✅ **Content management** (lessons, activities, trips)
✅ **Store system** with orders
✅ **Attendance tracking**
✅ **Task management**

---

## 🎉 Next Steps

1. ✅ Create dioceses and churches
2. ✅ Create classes for each church
3. ✅ Add teachers and assign to classes
4. ✅ Add students and enroll in classes
5. ✅ Link parents to students
6. ✅ Start creating lessons, activities, and trips
7. ✅ Track attendance
8. ✅ Build out the user-facing interface

---

## 📚 Additional Resources

- `ADMIN_PANEL_COMPLETE.md` - Full system documentation
- `SUNDAY_SCHOOL_SETUP.md` - Detailed database schema
- `README.md` - Project overview

---

## 🆘 Need Help?

If you encounter issues:

1. Check the SQL Editor for error messages
2. Verify all steps were followed in order
3. Ensure you're using the latest .env.local values
4. Try creating a completely fresh Supabase project

---

**You're all set! 🚀**

Login at http://localhost:3000/login with admin@knasty.local / 123456789
