

# Sunday School Management System - Complete Setup Guide

## Overview

This system manages Sunday schools across multiple dioceses, churches, and classes with role-based access control.

## System Hierarchy

```
Super Admin
  └─ Diocese
      └─ Church
          └─ Class
              ├─ Teachers
              └─ Students
                  └─ Parents
```

## User Roles

1. **super_admin** - Full system access, manages dioceses
2. **diocese_admin** - Manages churches within a diocese
3. **church_admin** - Manages classes, teachers, students within a church
4. **teacher** - Manages assigned classes, lessons, attendance
5. **parent** - Views student info, approves requests
6. **student** - Views lessons, activities, makes requests

## Database Setup

### Step 1: Run Existing Migrations (If not done)

First, ensure you've run the previous migrations:
1. `01_enable_rls_policies.sql`
2. `02_add_profile_fields.sql`
3. `03_auto_create_user_profile.sql`
4. `04_create_login_history.sql`

### Step 2: Run New Migrations IN ORDER

Navigate to SQL Editor in Supabase dashboard and run these migrations:

#### Migration 05: Organizational Structure
**File:** `05_create_organizational_structure.sql`

Creates:
- `dioceses` table - Top-level organizational unit
- `churches` table - Churches within dioceses
- `classes` table - Sunday school classes within churches

#### Migration 06: Roles & Permissions
**File:** `06_create_roles_and_permissions.sql`

Creates:
- Updates `users` table with role, diocese_id, church_id
- `user_relationships` table - Links parents to students
- `class_assignments` table - Assigns teachers/students to classes

#### Migration 07: Content Tables
**File:** `07_create_content_tables.sql`

Creates:
- `lessons` table - Lesson plans and content
- `activities` table - Activities (games, crafts, worship, etc.)
- `trips` table - Field trips and outings
- `store_items` table - Sunday school store inventory
- `tasks` table - Tasks assigned to teachers

#### Migration 08: Requests & Participation
**File:** `08_create_requests_and_participation.sql`

Creates:
- `requests` table - Student requests requiring parent approval
- `activity_participants` table - Activity registrations
- `trip_participants` table - Trip registrations
- `store_orders` & `store_order_items` tables - Store purchases
- `attendance` table - Class attendance tracking

#### Migration 09: RLS Policies
**File:** `09_create_rls_policies.sql`

Creates:
- Helper functions for role checking
- Comprehensive RLS policies for all tables
- Role-based access control enforcement

## Data Model

### Core Tables

#### dioceses
```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- location (TEXT)
- contact_email (TEXT)
- contact_phone (TEXT)
- created_by (UUID → users)
```

#### churches
```sql
- id (UUID, PK)
- diocese_id (UUID → dioceses)
- name (TEXT)
- address, city (TEXT)
- contact_email, contact_phone (TEXT)
```

#### classes
```sql
- id (UUID, PK)
- church_id (UUID → churches)
- name, description (TEXT)
- grade_level (TEXT)
- academic_year (TEXT)
- schedule (TEXT)
- capacity (INTEGER)
- is_active (BOOLEAN)
```

#### users (Extended)
```sql
- id (UUID, PK)
- email (TEXT)
- role (TEXT) - super_admin | diocese_admin | church_admin | teacher | parent | student
- diocese_id (UUID → dioceses)
- church_id (UUID → churches)
- username, full_name, bio, avatar_url
- phone, date_of_birth, gender, address
- is_active (BOOLEAN)
```

### Assignment Tables

#### class_assignments
```sql
- class_id (UUID → classes)
- user_id (UUID → users)
- assignment_type (TEXT) - teacher | student | assistant
- is_active (BOOLEAN)
```

#### user_relationships
```sql
- parent_id (UUID → users)
- student_id (UUID → users)
- relationship_type (TEXT) - parent | guardian
```

### Content Tables

#### lessons
```sql
- class_id (UUID → classes)
- title, description, content (TEXT)
- lesson_date (DATE)
- materials_needed, objectives, scripture_references (TEXT)
- attachments (JSONB)
- is_published (BOOLEAN)
```

#### activities
```sql
- church_id, class_id (UUID)
- title, description (TEXT)
- activity_type (TEXT) - game | craft | worship | service | other
- activity_date, start_time, end_time
- location, cost, max_participants
- requires_permission, is_published (BOOLEAN)
```

#### trips
```sql
- church_id (UUID)
- title, description, destination (TEXT)
- trip_date, return_date (DATE)
- cost, max_participants
- requires_parent_approval (BOOLEAN)
- transportation_details, what_to_bring (TEXT)
```

#### store_items
```sql
- church_id (UUID)
- name, description (TEXT)
- category (TEXT) - book | supply | uniform | gift | other
- price, stock_quantity
- is_available (BOOLEAN)
```

### Tracking Tables

#### requests
```sql
- student_id, parent_id (UUID)
- request_type (TEXT) - trip | activity | purchase | other
- related_id (UUID)
- status (TEXT) - pending | approved | declined
```

#### attendance
```sql
- class_id, user_id, lesson_id (UUID)
- attendance_date (DATE)
- status (TEXT) - present | absent | excused | late
```

## Access Control Matrix

| Resource | Super Admin | Diocese Admin | Church Admin | Teacher | Parent | Student |
|----------|-------------|---------------|--------------|---------|---------|---------|
| Dioceses | CRUD | Read (own) | Read | - | - | - |
| Churches | CRUD | CRUD (diocese) | Read/Update (own) | - | - | - |
| Classes | CRUD | CRUD (diocese) | CRUD (church) | Read (assigned) | Read (child's) | Read (own) |
| Lessons | CRUD | - | CRUD (church) | CRUD (assigned) | Read | Read (published) |
| Activities | CRUD | - | CRUD (church) | Read | Read | Read (published) |
| Trips | CRUD | - | CRUD (church) | Read | Read | Read (published) |
| Store | CRUD | - | CRUD (church) | Read | Read | Read (available) |
| Attendance | CRUD | - | CRUD (church) | CRUD (class) | Read (child's) | Read (own) |
| Requests | Read all | - | Read (church) | - | Approve/Decline | Create/Read |

## Helper Functions

The system includes these SQL helper functions for RLS:

- `is_super_admin()` - Check if current user is super admin
- `is_diocese_admin(diocese_id)` - Check diocese admin rights
- `is_church_admin(church_id)` - Check church admin rights
- `is_class_teacher(class_id)` - Check if user teaches a class
- `is_class_student(class_id)` - Check if user is in a class
- `is_parent_of(student_id)` - Check parent-student relationship

## Initial Data Setup

### 1. Create First Super Admin

After running migrations, manually update a user to super admin:

```sql
-- Update your user to super_admin
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

### 2. Create Sample Diocese

```sql
INSERT INTO public.dioceses (name, description, location)
VALUES ('Sample Diocese', 'Main diocese', 'City Name')
RETURNING id;
```

### 3. Create Sample Church

```sql
INSERT INTO public.churches (diocese_id, name, address, city)
VALUES (
  'diocese-uuid-here',
  'St. Mary Church',
  '123 Main Street',
  'City Name'
);
```

### 4. Create Sample Class

```sql
INSERT INTO public.classes (church_id, name, grade_level, academic_year)
VALUES (
  'church-uuid-here',
  'Grade 1 - Sunday School',
  'Grade 1',
  '2024-2025'
);
```

## Testing Checklist

- [ ] Super admin can create dioceses
- [ ] Diocese admin can create churches in their diocese
- [ ] Church admin can create classes in their church
- [ ] Church admin can assign teachers to classes
- [ ] Teachers can create lessons for their classes
- [ ] Students can view published lessons
- [ ] Students can register for activities
- [ ] Parents can approve/decline trip requests
- [ ] Store orders work correctly
- [ ] Attendance tracking works for teachers

## Application Features

### Admin Side

**Super Admin:**
- Diocese management (CRUD)
- View all churches and classes
- User role management
- System-wide reports

**Diocese Admin:**
- Church management within diocese
- View diocese-level statistics
- Assign church admins

**Church Admin:**
- Class management
- Teacher assignment
- Student enrollment
- Content management (lessons, activities, trips)
- Store management
- Reports and analytics

### User Side

**Student View:**
- My Classes
- Lessons (view published content)
- Activities (browse and register)
- Trips (browse and register)
- Store (browse and purchase)
- My Attendance
- Settings

**Parent View:**
- All student features (for linked students)
- Approval Center (trip requests, purchase requests)
- Student progress tracking
- Communication with teachers

**Teacher View:**
- My Classes
- Lesson Management (create/edit)
- Attendance Management
- Student roster
- Tasks assigned to me
- Class resources

## Next Steps

1. Run all database migrations in order
2. Create first super admin user
3. Set up initial diocese and church data
4. Build frontend admin panel
5. Build user-facing interfaces
6. Test all role-based access controls

## Troubleshooting

### RLS Errors
If you get permission denied errors:
- Verify user role is set correctly
- Check diocese_id and church_id are assigned
- Ensure RLS policies were created successfully

### Missing Tables
- Run migrations in exact order
- Check for SQL errors in migration output
- Verify all previous migrations completed

### Can't Access Data
- Confirm user authentication is working
- Check user role assignment
- Verify organizational hierarchy (diocese → church → class)

## Support

For detailed implementation, see:
- `README.md` - Main project documentation
- `supabase/migrations/` - All SQL migration files
- Application source code in `src/` directory
