# 🚀 Quick Seed Guide - Run Dummy Data

## ⚡ Fastest Way (30 seconds)

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Open Browser
Go to: `http://localhost:3000/admin/classes`

### Step 3: Click Button
Click **"Seed All Data"** button (top-right, database icon 📊)

### Step 4: Confirm
Click "OK" in the confirmation dialog

### ✅ Done!
You now have:
- ✅ Diocese & Church
- ✅ 5 Teachers
- ✅ 15 Students  
- ✅ 5 Classes
- ✅ All assignments ready!

---

## 🔧 Alternative: Browser Console

1. Open `/admin/classes` page
2. Press F12 (DevTools)
3. Go to Console tab
4. Paste and run:

```javascript
fetch('/api/admin/seed-all-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(d => {
  console.log('✅ Seeded!', d)
  console.log(`Created: ${d.teachers.created} teachers, ${d.students.created} students, ${d.classes.created} classes`)
})
```

---

## 💻 Terminal Script (If UI doesn't work)

### Install tsx (one time):
```bash
npm install -D tsx
```

### Run seed:
```bash
npx tsx scripts/seed-all-data.ts
```

---

## 📋 What You Get

**Organizational:**
- 1 Diocese: "Test Diocese"
- 1 Church: "St. Mary Test Church"

**Users:**
- 5 Teachers (all with password: `Test123456`)
- 15 Students (all with password: `Test123456`)

**Classes:**
- Grade 1 - Sunday School
- Grade 2-3 - Sunday School
- Grade 4-5 - Sunday School
- Youth Group (Grades 6-8)
- High School Bible Study

**Assignments:**
- Teachers assigned to classes
- Students enrolled in classes
- Ready to test immediately!

---

## 🎯 After Seeding

1. **View Classes**: Go to `/admin/classes` - you'll see 5 classes
2. **View Roster**: Click the Users icon on any class
3. **Test Assignments**: Try assigning more teachers/students
4. **Test Statistics**: Click BarChart icon to see class stats
5. **Export Data**: Click Download icon to export rosters

---

**That's it! Happy testing! 🎉**

