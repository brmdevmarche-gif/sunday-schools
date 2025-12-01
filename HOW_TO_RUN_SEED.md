# How to Run the Seed Function

There are **3 easy ways** to seed dummy users for testing:

---

## 🎯 Method 1: Using the UI Button (Easiest)

### Steps:

1. **Start your development server** (if not running):
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Navigate to Classes Page**:
   ```
   http://localhost:3000/admin/classes
   ```

3. **Select a Church** (optional):
   - Use the "Church" filter dropdown
   - Or leave as "All Churches" (will use first available church)

4. **Click "Seed Test Data" Button**:
   - Located in the top-right corner
   - Next to the "Add Class" button
   - Has a database icon (📊)

5. **Confirm the Dialog**:
   - Click "OK" when prompted
   - Wait for the success message

6. **Done!** ✅
   - You'll see a toast notification
   - 5 teachers and 15 students are now created
   - Ready to assign to classes!

---

## 🔧 Method 2: Direct API Call

### Using Browser Console:

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Run this code**:

```javascript
fetch('/api/admin/seed-dummy-users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    churchId: null // or 'your-church-id-here'
  }),
})
.then(res => res.json())
.then(data => {
  console.log('✅ Created:', data.created, 'users')
  console.log('❌ Failed:', data.failed, 'users')
  console.log('Users:', data.users)
})
.catch(err => console.error('Error:', err))
```

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/admin/seed-dummy-users \
  -H "Content-Type: application/json" \
  -d '{"churchId": null}'
```

### Using Postman/Insomnia:

- **URL:** `POST http://localhost:3000/api/admin/seed-dummy-users`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "churchId": null
  }
  ```

---

## 💻 Method 3: Using TypeScript Script

### Option A: Using tsx (Recommended)

1. **Install tsx** (if not installed):
   ```bash
   npm install -D tsx
   # or
   yarn add -D tsx
   ```

2. **Run the script**:
   ```bash
   npx tsx scripts/seed-users.ts
   ```

### Option B: Using ts-node

1. **Install ts-node** (if not installed):
   ```bash
   npm install -D ts-node
   ```

2. **Run the script**:
   ```bash
   npx ts-node scripts/seed-users.ts
   ```

### Option C: Add to package.json

Add this to your `package.json`:

```json
{
  "scripts": {
    "seed:users": "tsx scripts/seed-users.ts"
  }
}
```

Then run:
```bash
npm run seed:users
```

---

## 📋 What Gets Created

### Teachers (5):
- Sarah Johnson (sarah.teacher@test.com)
- Michael Chen (michael.teacher@test.com)
- Emily Rodriguez (emily.teacher@test.com)
- David Williams (david.teacher@test.com)
- Lisa Anderson (lisa.teacher@test.com)

### Students (15):
- Emma Thompson, James Wilson, Olivia Brown, Noah Davis, Sophia Martinez
- Liam Garcia, Ava Miller, Mason Taylor, Isabella Moore, Ethan Jackson
- Mia White, Lucas Harris, Charlotte Clark, Alexander Lewis, Amelia Walker

### Default Credentials:
- **Password:** `Test123456` (for all users)
- **Role:** Teacher or Student
- **Status:** Active
- **Church:** Linked to selected/first church

---

## ✅ Verification

After seeding, verify users were created:

1. **Go to Users Page**: `/admin/users`
2. **Filter by Role**: Select "teacher" or "student"
3. **Search**: Type "@test.com" to see all dummy users
4. **Check Classes Page**: Try assigning users to classes

---

## 🐛 Troubleshooting

### "No churches found"
**Solution:** Create a church first
- Go to `/admin/churches`
- Click "Add Church"
- Create at least one church

### "Failed to create user"
**Possible causes:**
- User already exists (email conflict)
- Missing church (create one first)
- Permission issues (make sure you're logged in as admin)

**Check:**
- Browser console for errors
- Network tab in DevTools
- Server logs

### Button not appearing
**Check:**
- You're on `/admin/classes` page
- You're logged in as admin
- Page loaded completely

### Users not appearing in assignment dialog
**Check:**
- Users are linked to the same church as the class
- Users have correct role (teacher/student)
- Users are active (`is_active = true`)

---

## 🎯 Quick Start (Recommended)

**Fastest way to get started:**

1. Make sure you have at least one church created
2. Go to `/admin/classes`
3. Click "Seed Test Data" button
4. Done! ✅

**Total time: ~30 seconds**

---

## 📝 Notes

- **Duplicate Prevention:** If users already exist, they won't be recreated
- **Church Linking:** Users are automatically linked to the selected church
- **Password:** All users share the same password for easy testing
- **Email Format:** All emails end with `@test.com` for easy identification

---

## 🔄 Re-running the Seed

You can run the seed multiple times:
- Existing users won't be duplicated (you'll see errors in console)
- Only new users will be created
- Safe to run multiple times

---

**That's it! Happy testing! 🎉**

