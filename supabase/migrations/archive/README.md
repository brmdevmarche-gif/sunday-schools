# Archived Migration Files

This folder contains the **old individual migration files** (01-09) that were previously used to set up the database incrementally.

---

## ⚠️ Important Notice

**These files are NO LONGER NEEDED for fresh database setups.**

All functionality from these files has been **consolidated into a single file**:
- `../00_FRESH_DATABASE_SETUP.sql`

---

## 📁 Archived Files

1. **01_enable_rls_policies.sql** - Initial RLS setup for users table
2. **02_add_profile_fields.sql** - Added username, bio, avatar_url fields
3. **03_auto_create_user_profile.sql** - Trigger to auto-create profiles on signup
4. **04_create_login_history.sql** - Login tracking table
5. **05_create_organizational_structure.sql** - Dioceses, churches, classes tables
6. **06_create_roles_and_permissions.sql** - User roles and assignment tables
7. **07_create_content_tables.sql** - Lessons, activities, trips, store, tasks
8. **08_create_requests_and_participation.sql** - Requests, attendance, orders
9. **09_create_rls_policies.sql** - Comprehensive RLS policies and helper functions

---

## 🎯 Why Were These Archived?

These files were created during incremental development, adding features one by one. However:

- **Problem:** Running 9 separate migrations was error-prone
- **Problem:** Order dependencies caused confusion
- **Problem:** Trigger issues made user creation difficult
- **Solution:** All migrations consolidated into one comprehensive file

---

## 📚 When to Use These Files

**Use Case:** If you have an **existing database** with partial migrations already applied, and you want to apply specific updates without recreating the entire database.

**Otherwise:** Use `../00_FRESH_DATABASE_SETUP.sql` for fresh databases.

---

## ⚠️ Compatibility Warning

These files may have interdependencies and assume certain tables or columns exist. They were designed to run in sequential order (01 → 02 → 03 → etc.).

If you need to use these for an existing database:
1. Check which migrations have already been applied
2. Run only the missing migrations in order
3. Test thoroughly after each migration

---

## ✅ Recommended Approach

Instead of using these archived files:

1. **Create a new Supabase project**
2. **Run `00_FRESH_DATABASE_SETUP.sql`**
3. **Migrate your data** from the old database to the new one

This ensures a clean, consistent database structure.

---

**Archived:** November 29, 2024
**Reason:** Consolidated into single migration file for easier setup
