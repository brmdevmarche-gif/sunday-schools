# Troubleshooting: Users Not Showing in Classes Screen

## 🔍 Quick Diagnosis

### Step 1: Check if Users Exist

1. **Go to Users Page**: `/admin/users`
2. **Filter by Role**: Select "teacher" or "student"
3. **Search**: Type "@test.com" to find dummy users
4. **Check Church**: Verify users have `church_id` set

### Step 2: Use Debug Button

1. **Go to Classes Page**: `/admin/classes`
2. **Click "Debug Users" button** (next to Seed All Data)
3. **Check Console** (F12) for output
4. **Check Toast Message** for count

### Step 3: Verify Church Match

**The Issue:** Users must be linked to the **same church** as the class!

- ✅ Class has `church_id: "abc-123"`
- ✅ User has `church_id: "abc-123"` → **Will show**
- ❌ User has `church_id: "xyz-789"` → **Won't show**
- ❌ User has `church_id: null` → **Won't show**

---

## 🛠️ Common Issues & Fixes

### Issue 1: Users Created but Not Linked to Church

**Symptoms:**
- Users exist in database
- But don't appear in assignment dialog
- Debug shows 0 users

**Fix:**
```sql
-- In Supabase SQL Editor, update users:
UPDATE public.users
SET church_id = 'your-church-id-here'
WHERE email LIKE '%@test.com'
AND church_id IS NULL;
```

### Issue 2: Users Linked to Wrong Church

**Symptoms:**
- Users exist
- But class is in different church
- Users don't show

**Fix:**
1. Check class's `church_id`
2. Check users' `church_id`
3. Update users to match class's church:
```sql
UPDATE public.users
SET church_id = 'class-church-id'
WHERE email LIKE '%@test.com';
```

### Issue 3: RLS Policy Blocking Access

**Symptoms:**
- Users exist in database
- But queries return empty
- Console shows permission errors

**Fix:**
Check RLS policies allow admins to view users:
```sql
-- Verify admin can view users
SELECT * FROM public.users 
WHERE role IN ('teacher', 'student')
LIMIT 5;
```

### Issue 4: Users Not Active

**Symptoms:**
- Users exist
- But `is_active = false`
- Won't show in available users

**Fix:**
```sql
UPDATE public.users
SET is_active = true
WHERE email LIKE '%@test.com'
AND is_active = false;
```

---

## ✅ Verification Checklist

After seeding, verify:

- [ ] Users exist in `/admin/users` page
- [ ] Users have `church_id` set
- [ ] Users have correct `role` (teacher/student)
- [ ] Users have `is_active = true`
- [ ] Class has `church_id` set
- [ ] Class `church_id` matches users' `church_id`
- [ ] Debug button shows users count > 0

---

## 🔧 Quick Fix Script

Run this in Supabase SQL Editor to fix common issues:

```sql
-- 1. Get your church ID
SELECT id, name FROM public.churches LIMIT 1;

-- 2. Update all test users to that church (replace 'your-church-id')
UPDATE public.users
SET 
  church_id = 'your-church-id-here',
  is_active = true
WHERE email LIKE '%@test.com';

-- 3. Verify update
SELECT email, full_name, role, church_id, is_active 
FROM public.users 
WHERE email LIKE '%@test.com'
ORDER BY role, full_name;
```

---

## 🎯 Step-by-Step Fix

### If Users Don't Show:

1. **Check Users Page**
   - Go to `/admin/users`
   - Filter by "teacher" or "student"
   - Do you see the users? ✅/❌

2. **If Users Don't Exist:**
   - Run seed again
   - Check console for errors
   - Verify seed completed successfully

3. **If Users Exist but Don't Show:**
   - Check church_id match:
     ```sql
     -- Get class church_id
     SELECT id, name, church_id FROM public.classes;
     
     -- Get users church_id
     SELECT email, role, church_id FROM public.users 
     WHERE email LIKE '%@test.com';
     ```
   - Update users to match class church_id

4. **Test Again:**
   - Click "Assign Teacher" or "Assign Student"
   - Check if users appear now

---

## 📊 Debug Information

The classes page now includes:
- ✅ Console logging when loading users
- ✅ Warning messages if no users found
- ✅ Debug button to check user counts
- ✅ Better error messages

**Check Browser Console (F12)** for detailed logs!

---

## 🚀 Quick Re-seed with Fix

If nothing works, re-seed with this approach:

1. **Delete existing test users** (optional):
   ```sql
   DELETE FROM auth.users WHERE email LIKE '%@test.com';
   ```

2. **Run Seed Again:**
   - Click "Seed All Data" button
   - Wait for completion

3. **Verify:**
   - Check `/admin/users` page
   - Use "Debug Users" button
   - Try assigning to a class

---

## 💡 Pro Tips

1. **Always check church_id match** - This is the #1 issue
2. **Use Debug button** - It shows exactly what's in database
3. **Check console logs** - They show what's being loaded
4. **Verify in Users page first** - Make sure users exist before trying to assign

---

**Still having issues?** Check the browser console (F12) for detailed error messages!

