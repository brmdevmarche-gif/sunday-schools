# Database Migrations

This folder contains the SQL migration files for the Sunday School Management System.

---

## 🚀 Quick Start (Fresh Database)

For a **new/fresh database**, run only this file:

### **00_FRESH_DATABASE_SETUP.sql**

This single file contains the complete database setup:
- ✅ 18 tables (users, dioceses, churches, classes, lessons, etc.)
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Permission helper functions (7 functions)
- ✅ Indexes for performance
- ✅ Triggers for auto-creating user profiles
- ✅ Complete organizational hierarchy

**How to run:**
1. Go to your Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the **entire contents** of `00_FRESH_DATABASE_SETUP.sql`
4. Paste and click "Run"
5. Wait for completion (~5-10 seconds)

You should see: `✅ DATABASE SETUP COMPLETE!`

---

## 📊 What Gets Created

### Tables (18 total):
1. **users** - User profiles with roles and organizational links
2. **login_history** - Login attempt tracking
3. **dioceses** - Top-level organizational units
4. **churches** - Churches within dioceses
5. **classes** - Sunday school classes
6. **user_relationships** - Parent-student links
7. **class_assignments** - Teacher and student class enrollments
8. **lessons** - Lesson plans and content
9. **activities** - Church activities (games, crafts, worship, etc.)
10. **trips** - Field trips and outings
11. **store_items** - Sunday school store inventory
12. **tasks** - Tasks assigned to teachers
13. **requests** - Student requests requiring parent approval
14. **activity_participants** - Activity registrations
15. **trip_participants** - Trip registrations with parent approval
16. **store_orders** - Store purchase orders
17. **store_order_items** - Individual items in orders
18. **attendance** - Class attendance tracking

### Helper Functions:
- `is_super_admin()` - Check super admin status
- `is_diocese_admin(diocese_id)` - Check diocese admin rights
- `is_church_admin(church_id)` - Check church admin rights
- `is_class_teacher(class_id)` - Check if user teaches a class
- `is_class_student(class_id)` - Check if user is in a class
- `is_parent_of(student_id)` - Check parent-student relationship
- `get_user_church_id()` - Get user's church ID

### User Roles:
1. **super_admin** - Full system access
2. **diocese_admin** - Manages churches in their diocese
3. **church_admin** - Manages classes and users in their church
4. **teacher** - Manages assigned classes, lessons, attendance
5. **parent** - Views student info, approves requests
6. **student** - Views lessons, activities, makes requests

---

## 🔐 After Migration: Create Admin User

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to **Authentication** → **Users** → **Add user**
2. Email: `admin@knasty.local`
3. Password: `123456789` (change later!)
4. ✅ Check "Auto Confirm User"
5. Click "Create user"

6. Then run this SQL:
```sql
UPDATE public.users
SET role = 'super_admin', username = 'admin', full_name = 'System Administrator', is_active = true
WHERE email = 'admin@knasty.local';
```

### Option 2: Via SQL Script

Run the contents of `create-admin-user-fresh-db.sql` (in project root) in SQL Editor.

---

## 📁 Archive Folder

The `archive/` folder contains the old individual migration files (01-09). These are **no longer needed** for fresh setups but are kept for reference:

- 01_enable_rls_policies.sql
- 02_add_profile_fields.sql
- 03_auto_create_user_profile.sql
- 04_create_login_history.sql
- 05_create_organizational_structure.sql
- 06_create_roles_and_permissions.sql
- 07_create_content_tables.sql
- 08_create_requests_and_participation.sql
- 09_create_rls_policies.sql

**Note:** All functionality from these files is now included in `00_FRESH_DATABASE_SETUP.sql`.

---

## ✅ Verification

After running the migration, verify everything is set up:

```sql
-- Check all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Should return 18 tables

-- Check users table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
-- Should show: id, email, username, role, etc.

-- Check helper functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'is_%';
-- Should show: is_super_admin, is_diocese_admin, etc.
```

---

## 🆘 Troubleshooting

### Migration fails with errors

**Cause:** Database might not be fresh (has existing tables/data)

**Solution:**
1. Create a brand new Supabase project
2. Run `00_FRESH_DATABASE_SETUP.sql` on the fresh database

### User creation fails

**Cause:** Trigger might be disabled or permissions issue

**Solution:**
1. Create user via Supabase Dashboard UI (Authentication → Users)
2. Then update role via SQL:
```sql
UPDATE public.users SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

### Can't login - "Invalid credentials"

**Check 1:** User exists in both auth.users and public.users
```sql
SELECT
  a.email,
  a.email_confirmed_at,
  u.role
FROM auth.users a
LEFT JOIN public.users u ON u.id = a.id
WHERE a.email = 'admin@knasty.local';
```

**Check 2:** Email is confirmed
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'admin@knasty.local';
```

---

## 📚 Related Documentation

- `FRESH_DATABASE_SETUP.md` - Detailed setup guide
- `QUICK_START.md` - 5-minute quick start
- `ADMIN_PANEL_COMPLETE.md` - Full system documentation
- `SUNDAY_SCHOOL_SETUP.md` - Database schema details

---

## 🎯 Migration Strategy

**For Fresh Databases:** Use `00_FRESH_DATABASE_SETUP.sql` (recommended)

**For Existing Databases:** Individual migrations in `archive/` can be used if you need to apply changes incrementally to an existing database. However, for best results, we recommend creating a fresh Supabase project.

---

**Last Updated:** November 29, 2024
**Migration Version:** 1.0.0 (Consolidated)
