# ⚡ Quick Start Guide - 5 Minutes to Running System

## Step 1: Create New Supabase Project (2 min)

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Name: `knasty-sunday-school`
4. Create strong database password
5. Click **"Create new project"**
6. ⏳ Wait 2-3 minutes

## Step 2: Update Environment Variables (1 min)

1. In Supabase: **Settings** → **API**
2. Copy these 3 keys:
   - Project URL
   - anon/public key
   - service_role key

3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 3: Run Database Migration (1 min)

1. Supabase: **SQL Editor** → **New query**
2. Open: `supabase/migrations/00_FRESH_DATABASE_SETUP.sql`
3. Copy ENTIRE file contents
4. Paste and click **"Run"**
5. Wait for "✅ DATABASE SETUP COMPLETE!"

## Step 4: Create Admin User (1 min)

### Easy Way (Recommended):

1. Supabase: **Authentication** → **Users** → **"Add user"**
2. Email: `admin@knasty.local`
3. Password: `123456789`
4. ✅ Check "Auto Confirm User"
5. Click **"Create user"**

6. **SQL Editor** → **New query**:
   ```sql
   UPDATE public.users
   SET role = 'super_admin', username = 'admin', full_name = 'System Administrator', is_active = true
   WHERE email = 'admin@knasty.local';
   ```

### Alternative - SQL Script:

1. **SQL Editor** → **New query**
2. Open: `create-admin-user-fresh-db.sql`
3. Copy and paste entire contents
4. Click **"Run"**

## Step 5: Login! (30 sec)

1. Start app: `npm run dev`
2. Open: http://localhost:3000/login
3. Login:
   - Email: `admin@knasty.local`
   - Password: `123456789`
4. Visit: http://localhost:3000/admin

---

## ✅ You're Done!

You now have:
- ✅ Complete database (18 tables)
- ✅ Admin user with full access
- ✅ Working login system
- ✅ Admin panel ready to use

**Next:** Create your first diocese, church, and class!

---

## 🆘 Troubleshooting

### Can't login?

Run this in SQL Editor:
```sql
-- Check if user exists and email is confirmed
SELECT
  a.email,
  a.email_confirmed_at,
  u.role
FROM auth.users a
LEFT JOIN public.users u ON u.id = a.id
WHERE a.email = 'admin@knasty.local';
```

If `email_confirmed_at` is NULL:
```sql
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'admin@knasty.local';
```

### Migration fails?

- Make sure it's a FRESH database (no previous migrations)
- Create a brand new Supabase project if needed
- Copy the ENTIRE migration file

---

**Need detailed help?** See `FRESH_DATABASE_SETUP.md`
