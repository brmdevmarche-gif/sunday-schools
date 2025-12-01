# Seed Dummy Users for Testing

This feature allows you to quickly create dummy students and teachers for testing the classes module.

## 🎯 What Gets Created

When you click "Seed Test Data", the system creates:

- **5 Teachers:**
  - Sarah Johnson (sarah.teacher@test.com)
  - Michael Chen (michael.teacher@test.com)
  - Emily Rodriguez (emily.teacher@test.com)
  - David Williams (david.teacher@test.com)
  - Lisa Anderson (lisa.teacher@test.com)

- **15 Students:**
  - Emma Thompson, James Wilson, Olivia Brown, Noah Davis, Sophia Martinez
  - Liam Garcia, Ava Miller, Mason Taylor, Isabella Moore, Ethan Jackson
  - Mia White, Lucas Harris, Charlotte Clark, Alexander Lewis, Amelia Walker

**Total: 20 users**

## 🔑 Default Credentials

All dummy users are created with:
- **Password:** `Test123456`
- **Role:** Teacher or Student (as appropriate)
- **Church:** Linked to the currently selected church (or first church if "All Churches" is selected)
- **Status:** Active

## 🚀 How to Use

### Method 1: From Classes Page (Recommended)

1. Navigate to `/admin/classes`
2. Select a church from the filter (or leave as "All Churches")
3. Click the **"Seed Test Data"** button in the header
4. Confirm the action
5. Wait for the success message

### Method 2: Via API

You can also call the API directly:

```typescript
const response = await fetch('/api/admin/seed-dummy-users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    churchId: 'your-church-id' // Optional
  }),
})

const result = await response.json()
console.log(`Created ${result.created} users`)
```

## 📋 Usage Example

1. **Go to Classes Page**
   ```
   http://localhost:3000/admin/classes
   ```

2. **Select a Church** (optional)
   - Use the church filter dropdown
   - Or leave as "All Churches" to use the first available church

3. **Click "Seed Test Data"**
   - Button is in the top right, next to "Add Class"
   - Confirm the dialog

4. **Wait for Success**
   - You'll see a toast notification
   - Users are now available for assignment to classes

5. **Test Class Assignments**
   - Go to any class
   - Click "Assign Teacher" or "Assign Student"
   - You'll see the dummy users in the list!

## ✅ What You Can Do After Seeding

- **Assign Teachers to Classes**
  - Use "Assign Teacher" button on any class
  - Select from the 5 dummy teachers

- **Enroll Students in Classes**
  - Use "Assign Student" button on any class
  - Select from the 15 dummy students

- **Bulk Assignments**
  - Use "Bulk Add" in the roster dialog
  - Select multiple users at once

- **Test Capacity**
  - Assign students up to class capacity
  - Test capacity warnings

## 🔍 Finding the Users

After seeding, you can find the users:

1. **In Users Page** (`/admin/users`)
   - Filter by role: "teacher" or "student"
   - Search by email (e.g., "teacher@test.com" or "student@test.com")

2. **In Class Assignment Dialogs**
   - When assigning teachers/students to classes
   - They'll appear in the dropdown lists

## ⚠️ Important Notes

- **Duplicate Prevention:** If users already exist, they won't be created again (you'll see errors in console)
- **Church Assignment:** Users are linked to the selected church (or first church)
- **Password:** All users have the same password: `Test123456`
- **Email Format:** All emails end with `@test.com` for easy identification

## 🧹 Cleanup

To remove dummy users:

1. Go to `/admin/users`
2. Filter by role (teacher/student)
3. Search for "@test.com" emails
4. Delete users individually

Or use SQL in Supabase:

```sql
-- Delete all dummy users
DELETE FROM auth.users 
WHERE email LIKE '%@test.com';

-- This will cascade delete from public.users due to foreign key
```

## 📝 Customization

To customize the dummy data, edit:

**File:** `src/lib/utils/seed-dummy-users.ts`

- Modify `dummyTeachers` array to add/remove teachers
- Modify `dummyStudents` array to add/remove students
- Change `DEFAULT_PASSWORD` if needed

## 🎓 Testing Scenarios

After seeding, you can test:

1. **Single Assignment**
   - Assign one teacher to a class
   - Assign one student to a class

2. **Bulk Assignment**
   - Assign multiple teachers at once
   - Enroll multiple students at once

3. **Capacity Testing**
   - Create a class with capacity 10
   - Try to enroll 15 students (should show warnings)

4. **Roster Management**
   - View class roster
   - Remove users from classes
   - Export roster to CSV/JSON

5. **Statistics**
   - View class statistics
   - Check enrollment rates

## 🐛 Troubleshooting

### "No churches found"
- Create at least one church first
- Go to `/admin/churches` and create a church

### "Failed to create user"
- Check if user already exists
- Check console for specific error
- Verify you have admin permissions

### Users not appearing in assignment dialog
- Make sure users are linked to the same church as the class
- Check that users have the correct role (teacher/student)
- Verify users are active (`is_active = true`)

## 📊 Expected Results

After successful seeding:
- ✅ 5 teachers created
- ✅ 15 students created
- ✅ All linked to selected church
- ✅ All active and ready for assignment
- ✅ Can be assigned to classes immediately

---

**Happy Testing! 🎉**

