# Deployment Checklist

## Pre-Deployment Steps

Follow these steps before deploying your refactored application to production.

---

## 1. Apply Database Migrations

### Migration 10: Admin User Policies

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/10_add_admin_users_policies.sql`
3. Paste and run the SQL
4. Verify no errors in the output

**Expected Output:**
```
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
CREATE POLICY
CREATE POLICY
...
```

**Verify:**
```sql
-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'users';
```

---

### Migration 11: User Settings

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/11_add_user_settings.sql`
3. Paste and run the SQL
4. Verify no errors

**Verify:**
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_settings', 'backup_logs');

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('users', 'user_settings');
```

---

## 2. Environment Variables

Verify all required environment variables are set:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # or production URL
```

---

## 3. Test Each Page

### ✅ Admin Users Page (`/admin/users`)

- [ ] Page loads without errors
- [ ] All users are visible (not just current user)
- [ ] Can filter by role
- [ ] Can filter by diocese
- [ ] Can filter by church
- [ ] Can search by name/email
- [ ] Can create new user
- [ ] Can update user role
- [ ] Can assign diocese/church
- [ ] Can activate/deactivate user
- [ ] Can link parent to student

**Test as different roles:**
- [ ] Super admin sees all users
- [ ] Diocese admin sees users in their diocese
- [ ] Church admin sees users in their church

---

### ✅ Admin Churches Page (`/admin/churches`)

- [ ] Page loads without errors
- [ ] All churches are visible
- [ ] Can filter by diocese
- [ ] Class count shows correctly
- [ ] Can create new church
- [ ] Can edit church details
- [ ] Can delete church
- [ ] Diocese selection works

---

### ✅ Admin Dioceses Page (`/admin/dioceses`)

- [ ] Page loads without errors
- [ ] All dioceses are visible
- [ ] Church count shows correctly
- [ ] Can create new diocese
- [ ] Can edit diocese details
- [ ] Can delete diocese
- [ ] Contact information saves correctly

---

### ✅ Admin Classes Page (`/admin/classes`)

- [ ] Page loads without errors
- [ ] All classes are visible
- [ ] Can filter by diocese
- [ ] Can filter by church
- [ ] Student count shows correctly
- [ ] Can create new class
- [ ] Can edit class details
- [ ] Can delete class
- [ ] Can view class roster
- [ ] Can assign teacher to class
- [ ] Can assign student to class
- [ ] Can remove user from class

---

### ✅ Admin Settings Page (`/admin/settings`)

- [ ] Page loads without errors
- [ ] Language selection works
- [ ] Theme selection works
- [ ] Date format selection works
- [ ] Time format selection works
- [ ] Timezone selection works
- [ ] Notification toggles work
- [ ] Settings save successfully
- [ ] Settings persist after page refresh

**For Super Admin:**
- [ ] Database stats display correctly
- [ ] Can create manual backup
- [ ] Backup logs display correctly
- [ ] Backup status shows correctly

**For Non-Super Admin:**
- [ ] Backup section is hidden

---

### ✅ Dashboard Page (`/dashboard`)

- [ ] Page loads without errors
- [ ] User profile displays correctly
- [ ] Avatar shows if available
- [ ] Login history shows
- [ ] Security alerts display
- [ ] Edit profile link works
- [ ] Logout works

---

## 4. Permission Testing

Create test users for each role and verify access:

### Test User Setup
```sql
-- Create test super admin
INSERT INTO users (id, email, role, full_name)
VALUES (
  gen_random_uuid(),
  'superadmin@test.com',
  'super_admin',
  'Super Admin Test'
);

-- Create test diocese admin
INSERT INTO users (id, email, role, full_name, diocese_id)
VALUES (
  gen_random_uuid(),
  'dioceseadmin@test.com',
  'diocese_admin',
  'Diocese Admin Test',
  'your-diocese-id'
);

-- Create test church admin
INSERT INTO users (id, email, role, full_name, church_id)
VALUES (
  gen_random_uuid(),
  'churchadmin@test.com',
  'church_admin',
  'Church Admin Test',
  'your-church-id'
);
```

### Permission Tests

**Super Admin:**
- [ ] Can access all admin pages
- [ ] Can see all users
- [ ] Can see all churches
- [ ] Can see all dioceses
- [ ] Can see all classes
- [ ] Can access settings page
- [ ] Can see backup section
- [ ] Can create backups

**Diocese Admin:**
- [ ] Can access admin panel
- [ ] Can only see users in their diocese
- [ ] Can see churches in their diocese
- [ ] Cannot see other dioceses
- [ ] Can manage classes in their diocese
- [ ] Can access settings page
- [ ] Cannot see backup section

**Church Admin:**
- [ ] Can access admin panel
- [ ] Can only see users in their church
- [ ] Can only see their church
- [ ] Cannot manage dioceses
- [ ] Can manage classes in their church
- [ ] Can access settings page
- [ ] Cannot see backup section

**Teacher:**
- [ ] Can access admin panel
- [ ] Can see their classes
- [ ] Can view students in their classes
- [ ] Cannot manage users
- [ ] Cannot manage churches/dioceses
- [ ] Can access settings page

**Regular User (Parent/Student):**
- [ ] Cannot access admin panel
- [ ] Can access dashboard
- [ ] Can access profile page
- [ ] Can access settings page

---

## 5. Data Integrity Tests

### Test Data Creation Flow

1. **Create Diocese:**
   - [ ] Create new diocese
   - [ ] Verify it appears in churches dropdown
   - [ ] Verify church count is 0

2. **Create Church:**
   - [ ] Create new church under diocese
   - [ ] Verify diocese church count increases
   - [ ] Verify it appears in classes dropdown

3. **Create Class:**
   - [ ] Create new class under church
   - [ ] Verify church class count increases
   - [ ] Verify student count is 0

4. **Create Users:**
   - [ ] Create teacher user
   - [ ] Create student user
   - [ ] Assign teacher to class
   - [ ] Assign student to class
   - [ ] Verify student count increases

5. **Test Relationships:**
   - [ ] Create parent user
   - [ ] Create student user
   - [ ] Link parent to student
   - [ ] Verify relationship created

---

## 6. Error Handling Tests

### Test Error Scenarios

- [ ] Try to create user with duplicate email
- [ ] Try to delete diocese with churches
- [ ] Try to delete church with classes
- [ ] Try to delete class with students
- [ ] Try to access admin page without permission
- [ ] Try to create church without selecting diocese
- [ ] Try to update user without permission
- [ ] Submit form with missing required fields

**Expected:** Proper error messages displayed via toast notifications

---

## 7. Performance Tests

### Load Time Tests

- [ ] Admin users page loads < 1 second
- [ ] Admin churches page loads < 1 second
- [ ] Admin classes page loads < 1 second
- [ ] Dashboard loads < 1 second

### Data Volume Tests

- [ ] Test with 100+ users
- [ ] Test with 50+ churches
- [ ] Test with 20+ dioceses
- [ ] Test with 100+ classes
- [ ] Pagination works if implemented
- [ ] Filters work with large datasets

---

## 8. Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 9. Security Tests

### SQL Injection Tests
```typescript
// Try these as inputs (should be handled safely):
- User search: '; DROP TABLE users; --
- Email: admin@test.com' OR '1'='1
- Name: Robert'); DROP TABLE users;--
```

**Expected:** All inputs safely escaped, no SQL injection possible

### XSS Tests
```typescript
// Try these as inputs:
- Name: <script>alert('XSS')</script>
- Bio: <img src=x onerror=alert('XSS')>
```

**Expected:** HTML escaped, no scripts executed

### CSRF Protection
- [ ] All mutations use POST requests
- [ ] Server actions have CSRF protection
- [ ] Forms cannot be submitted cross-origin

---

## 10. Production Deployment

### Pre-Deploy

- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors: `npm run build`
- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] Backup of production database created

### Deploy Steps

1. **Build:**
   ```bash
   npm run build
   ```

2. **Test Production Build:**
   ```bash
   npm run start
   ```

3. **Deploy:**
   ```bash
   # Deploy to Vercel/your hosting
   vercel deploy --prod
   ```

4. **Post-Deploy Verification:**
   - [ ] All pages load
   - [ ] Authentication works
   - [ ] Database connections work
   - [ ] Environment variables correct
   - [ ] No console errors
   - [ ] SSL certificate valid
   - [ ] Custom domain works

### Monitoring Setup

- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

---

## 11. Rollback Plan

If issues occur:

1. **Immediate:**
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

2. **Database:**
   ```sql
   -- If needed, rollback migrations
   DROP POLICY IF EXISTS "policy_name" ON table_name;
   DROP FUNCTION IF EXISTS function_name();
   ```

3. **Restore Backup:**
   - Use Supabase backup restoration
   - Restore to last known good state

---

## 12. Post-Deployment

### First 24 Hours

- [ ] Monitor error logs
- [ ] Check user reports
- [ ] Monitor performance metrics
- [ ] Verify all features working
- [ ] Check database query performance

### First Week

- [ ] Gather user feedback
- [ ] Monitor for edge cases
- [ ] Check for memory leaks
- [ ] Review slow queries
- [ ] Optimize as needed

---

## ✅ Final Checklist

- [ ] All migrations applied
- [ ] All pages tested
- [ ] All permissions verified
- [ ] Error handling works
- [ ] Performance acceptable
- [ ] Security tests passed
- [ ] Browser compatibility confirmed
- [ ] Production deployment successful
- [ ] Monitoring enabled
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Documentation updated

---

## 🆘 Troubleshooting

### Issue: Users page shows only current user

**Solution:**
```sql
-- Check if RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'users';

-- If missing, reapply migration 10
```

### Issue: "Not authenticated" error

**Solution:**
- Check Supabase URL and keys in `.env.local`
- Verify user is logged in
- Check browser cookies enabled

### Issue: Server actions not working

**Solution:**
- Ensure `'use server'` at top of actions.ts
- Check Next.js version ≥ 13.4
- Verify no syntax errors

### Issue: Page takes too long to load

**Solution:**
- Check database query performance
- Add indexes to frequently queried columns
- Use parallel data fetching
- Consider pagination

---

**Checklist Version:** 1.0
**Last Updated:** November 30, 2025
