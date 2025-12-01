# Sunday School Management System - Complete Database Structure

## Overview

This document provides a comprehensive overview of the database structure for the Sunday School Management System. The system uses **PostgreSQL** (via Supabase) with **Row Level Security (RLS)** for access control.

## System Hierarchy

```
Super Admin
  └─ Diocese
      └─ Church
          └─ Class
              ├─ Teachers (via class_assignments)
              └─ Students (via class_assignments)
                  └─ Parents (via user_relationships)
```

## Database Tables (18 Total)

### 1. Core User & Authentication Tables

#### `users` (Public Schema)
**Purpose:** User profiles with roles and organizational links

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK → auth.users(id) | User ID (references Supabase auth) |
| `email` | TEXT | UNIQUE, NOT NULL | User email address |
| `username` | TEXT | UNIQUE | Username |
| `full_name` | TEXT | | Full name |
| `avatar_url` | TEXT | | Profile picture URL |
| `bio` | TEXT | | User biography |
| `phone` | TEXT | | Phone number |
| `date_of_birth` | DATE | | Date of birth |
| `gender` | TEXT | CHECK (male, female) | Gender |
| `address` | TEXT | | Physical address |
| `role` | TEXT | DEFAULT 'student', CHECK | User role (see roles below) |
| `diocese_id` | UUID | FK → dioceses(id) | Associated diocese |
| `church_id` | UUID | FK → churches(id) | Associated church |
| `is_active` | BOOLEAN | DEFAULT true | Account active status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `users_email_idx` on `email`
- `users_username_idx` on `username`
- `users_role_idx` on `role`
- `users_is_active_idx` on `is_active`
- `users_diocese_id_idx` on `diocese_id`
- `users_church_id_idx` on `church_id`

**Triggers:**
- `set_updated_at` - Auto-updates `updated_at` on row update
- `on_auth_user_created` - Auto-creates profile when auth user is created

**User Roles:**
- `super_admin` - Full system access
- `diocese_admin` - Manages churches within a diocese
- `church_admin` - Manages classes within a church
- `teacher` - Manages assigned classes
- `parent` - Views student info, approves requests
- `student` - Views lessons, makes requests

#### `login_history`
**Purpose:** Tracks login attempts and authentication events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Record ID |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE | User who logged in |
| `success` | BOOLEAN | NOT NULL | Login success status |
| `ip_address` | INET | | IP address of login |
| `user_agent` | TEXT | | Browser/client info |
| `device_info` | JSONB | | Device details |
| `location` | TEXT | | Geographic location |
| `failure_reason` | TEXT | | Reason if login failed |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Login timestamp |

**Indexes:**
- `login_history_user_id_idx` on `user_id`
- `login_history_created_at_idx` on `created_at`
- `login_history_success_idx` on `success`

---

### 2. Organizational Structure Tables

#### `dioceses`
**Purpose:** Top-level organizational units

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Diocese ID |
| `name` | TEXT | NOT NULL | Diocese name |
| `description` | TEXT | | Description |
| `location` | TEXT | | Location |
| `contact_email` | TEXT | | Contact email |
| `contact_phone` | TEXT | | Contact phone |
| `created_by` | UUID | FK → auth.users(id) | Creator user ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `dioceses_name_idx` on `name`

#### `churches`
**Purpose:** Churches within dioceses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Church ID |
| `diocese_id` | UUID | FK → dioceses(id) ON DELETE CASCADE | Parent diocese |
| `name` | TEXT | NOT NULL | Church name |
| `address` | TEXT | | Street address |
| `city` | TEXT | | City |
| `contact_email` | TEXT | | Contact email |
| `contact_phone` | TEXT | | Contact phone |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `churches_diocese_id_idx` on `diocese_id`
- `churches_name_idx` on `name`

#### `classes`
**Purpose:** Sunday school classes within churches

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Class ID |
| `church_id` | UUID | FK → churches(id) ON DELETE CASCADE | Parent church |
| `name` | TEXT | NOT NULL | Class name |
| `description` | TEXT | | Class description |
| `grade_level` | TEXT | | Grade level (e.g., "Grade 1") |
| `academic_year` | TEXT | | Academic year (e.g., "2024-2025") |
| `schedule` | TEXT | | Class schedule |
| `capacity` | INTEGER | | Maximum students |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `classes_church_id_idx` on `church_id`
- `classes_is_active_idx` on `is_active`

---

### 3. User Relationships & Assignments

#### `user_relationships`
**Purpose:** Links parents/guardians to students

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Relationship ID |
| `parent_id` | UUID | FK → users(id) ON DELETE CASCADE | Parent/guardian user |
| `student_id` | UUID | FK → users(id) ON DELETE CASCADE | Student user |
| `relationship_type` | TEXT | DEFAULT 'parent', CHECK | Type: 'parent' or 'guardian' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Constraints:**
- UNIQUE(`parent_id`, `student_id`) - One relationship per pair

**Indexes:**
- `user_relationships_parent_id_idx` on `parent_id`
- `user_relationships_student_id_idx` on `student_id`

#### `class_assignments`
**Purpose:** Assigns teachers and students to classes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Assignment ID |
| `class_id` | UUID | FK → classes(id) ON DELETE CASCADE | Class being assigned to |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE | User being assigned |
| `assignment_type` | TEXT | NOT NULL, CHECK | Type: 'teacher', 'student', or 'assistant' |
| `assigned_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Assignment timestamp |
| `assigned_by` | UUID | FK → auth.users(id) | User who made assignment |
| `is_active` | BOOLEAN | DEFAULT true | Active status |

**Constraints:**
- UNIQUE(`class_id`, `user_id`, `assignment_type`) - One assignment per type per class

**Indexes:**
- `class_assignments_class_id_idx` on `class_id`
- `class_assignments_user_id_idx` on `user_id`
- `class_assignments_type_idx` on `assignment_type`

---

### 4. Content Tables

#### `lessons`
**Purpose:** Lesson plans and educational content

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Lesson ID |
| `class_id` | UUID | FK → classes(id) ON DELETE CASCADE | Associated class |
| `teacher_id` | UUID | FK → users(id) | Teacher who created lesson |
| `title` | TEXT | NOT NULL | Lesson title |
| `description` | TEXT | | Lesson description |
| `content` | TEXT | | Full lesson content |
| `lesson_date` | DATE | | Scheduled date |
| `materials_needed` | TEXT | | Required materials |
| `objectives` | TEXT | | Learning objectives |
| `scripture_references` | TEXT | | Bible references |
| `attachments` | JSONB | | File attachments |
| `is_published` | BOOLEAN | DEFAULT false | Published status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `lessons_class_id_idx` on `class_id`
- `lessons_teacher_id_idx` on `teacher_id`
- `lessons_lesson_date_idx` on `lesson_date`

#### `activities`
**Purpose:** Church activities (games, crafts, worship, service, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Activity ID |
| `church_id` | UUID | FK → churches(id) ON DELETE CASCADE | Associated church |
| `class_id` | UUID | FK → classes(id) ON DELETE SET NULL | Optional class filter |
| `title` | TEXT | NOT NULL | Activity title |
| `description` | TEXT | | Activity description |
| `activity_type` | TEXT | CHECK | Type: 'game', 'craft', 'worship', 'service', 'other' |
| `activity_date` | DATE | | Activity date |
| `start_time` | TIME | | Start time |
| `end_time` | TIME | | End time |
| `location` | TEXT | | Location |
| `cost` | DECIMAL(10,2) | DEFAULT 0 | Cost per participant |
| `max_participants` | INTEGER | | Maximum participants |
| `requires_permission` | BOOLEAN | DEFAULT false | Requires parent approval |
| `is_published` | BOOLEAN | DEFAULT false | Published status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `activities_church_id_idx` on `church_id`
- `activities_activity_date_idx` on `activity_date`

#### `trips`
**Purpose:** Field trips and outings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Trip ID |
| `church_id` | UUID | FK → churches(id) ON DELETE CASCADE | Associated church |
| `title` | TEXT | NOT NULL | Trip title |
| `description` | TEXT | | Trip description |
| `destination` | TEXT | | Destination |
| `trip_date` | DATE | | Trip date |
| `return_date` | DATE | | Return date (if overnight) |
| `cost` | DECIMAL(10,2) | DEFAULT 0 | Cost per participant |
| `max_participants` | INTEGER | | Maximum participants |
| `requires_parent_approval` | BOOLEAN | DEFAULT true | Requires parent approval |
| `transportation_details` | TEXT | | Transportation info |
| `what_to_bring` | TEXT | | What to bring list |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `trips_church_id_idx` on `church_id`
- `trips_trip_date_idx` on `trip_date`

#### `store_items`
**Purpose:** Sunday school store inventory

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Item ID |
| `church_id` | UUID | FK → churches(id) ON DELETE CASCADE | Associated church |
| `name` | TEXT | NOT NULL | Item name |
| `description` | TEXT | | Item description |
| `category` | TEXT | CHECK | Category: 'book', 'supply', 'uniform', 'gift', 'other' |
| `price` | DECIMAL(10,2) | NOT NULL | Item price |
| `stock_quantity` | INTEGER | DEFAULT 0 | Available quantity |
| `image_url` | TEXT | | Item image URL |
| `is_available` | BOOLEAN | DEFAULT true | Available for purchase |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `store_items_church_id_idx` on `church_id`
- `store_items_category_idx` on `category`

#### `tasks`
**Purpose:** Tasks assigned to teachers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Task ID |
| `assigned_to` | UUID | FK → users(id) ON DELETE CASCADE | User assigned to task |
| `assigned_by` | UUID | FK → users(id) | User who assigned task |
| `title` | TEXT | NOT NULL | Task title |
| `description` | TEXT | | Task description |
| `due_date` | DATE | | Due date |
| `priority` | TEXT | CHECK | Priority: 'low', 'medium', 'high' |
| `status` | TEXT | DEFAULT 'pending', CHECK | Status: 'pending', 'in_progress', 'completed', 'cancelled' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `tasks_assigned_to_idx` on `assigned_to`
- `tasks_status_idx` on `status`

---

### 5. Operational & Tracking Tables

#### `requests`
**Purpose:** Student requests requiring parent approval

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Request ID |
| `student_id` | UUID | FK → users(id) ON DELETE CASCADE | Student making request |
| `parent_id` | UUID | FK → users(id) | Parent to approve |
| `request_type` | TEXT | CHECK | Type: 'trip', 'activity', 'purchase', 'other' |
| `related_id` | UUID | | ID of related item (trip, activity, etc.) |
| `details` | TEXT | | Request details |
| `status` | TEXT | DEFAULT 'pending', CHECK | Status: 'pending', 'approved', 'declined' |
| `approved_at` | TIMESTAMPTZ | | Approval timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `requests_student_id_idx` on `student_id`
- `requests_parent_id_idx` on `parent_id`
- `requests_status_idx` on `status`

#### `activity_participants`
**Purpose:** Activity registrations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Participation ID |
| `activity_id` | UUID | FK → activities(id) ON DELETE CASCADE | Activity |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE | Participant |
| `registered_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Registration timestamp |
| `attended` | BOOLEAN | | Attendance status |

**Constraints:**
- UNIQUE(`activity_id`, `user_id`) - One registration per user per activity

**Indexes:**
- `activity_participants_activity_id_idx` on `activity_id`
- `activity_participants_user_id_idx` on `user_id`

#### `trip_participants`
**Purpose:** Trip registrations with parent approval

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Participation ID |
| `trip_id` | UUID | FK → trips(id) ON DELETE CASCADE | Trip |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE | Participant |
| `parent_approval` | BOOLEAN | DEFAULT false | Parent approval status |
| `payment_status` | TEXT | DEFAULT 'pending', CHECK | Payment: 'pending', 'paid', 'refunded' |
| `emergency_contact` | TEXT | | Emergency contact info |
| `medical_info` | TEXT | | Medical information |
| `registered_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Registration timestamp |

**Constraints:**
- UNIQUE(`trip_id`, `user_id`) - One registration per user per trip

**Indexes:**
- `trip_participants_trip_id_idx` on `trip_id`
- `trip_participants_user_id_idx` on `user_id`

#### `store_orders`
**Purpose:** Store purchase orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Order ID |
| `user_id` | UUID | FK → users(id) ON DELETE SET NULL | Customer |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Total order amount |
| `payment_status` | TEXT | DEFAULT 'pending', CHECK | Payment: 'pending', 'paid', 'cancelled' |
| `payment_method` | TEXT | | Payment method |
| `notes` | TEXT | | Order notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `store_orders_user_id_idx` on `user_id`
- `store_orders_payment_status_idx` on `payment_status`

#### `store_order_items`
**Purpose:** Individual items in store orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Order item ID |
| `order_id` | UUID | FK → store_orders(id) ON DELETE CASCADE | Parent order |
| `item_id` | UUID | FK → store_items(id) | Store item |
| `quantity` | INTEGER | NOT NULL | Quantity ordered |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Price per unit |
| `subtotal` | DECIMAL(10,2) | NOT NULL | Line total (quantity × unit_price) |

**Indexes:**
- `store_order_items_order_id_idx` on `order_id`

#### `attendance`
**Purpose:** Class attendance tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Attendance record ID |
| `class_id` | UUID | FK → classes(id) ON DELETE CASCADE | Class |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE | Student |
| `lesson_id` | UUID | FK → lessons(id) ON DELETE SET NULL | Associated lesson |
| `attendance_date` | DATE | NOT NULL | Date of attendance |
| `status` | TEXT | CHECK | Status: 'present', 'absent', 'excused', 'late' |
| `notes` | TEXT | | Additional notes |
| `marked_by` | UUID | FK → users(id) | User who marked attendance |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Constraints:**
- UNIQUE(`class_id`, `user_id`, `attendance_date`) - One record per student per day

**Indexes:**
- `attendance_class_id_idx` on `class_id`
- `attendance_user_id_idx` on `user_id`
- `attendance_date_idx` on `attendance_date`

---

## Database Relationships

### Foreign Key Relationships

```
auth.users
  └─ users (id references auth.users)

users
  ├─ diocese_id → dioceses(id)
  └─ church_id → churches(id)

dioceses
  └─ created_by → auth.users(id)

churches
  └─ diocese_id → dioceses(id)

classes
  └─ church_id → churches(id)

user_relationships
  ├─ parent_id → users(id)
  └─ student_id → users(id)

class_assignments
  ├─ class_id → classes(id)
  ├─ user_id → users(id)
  └─ assigned_by → auth.users(id)

lessons
  ├─ class_id → classes(id)
  └─ teacher_id → users(id)

activities
  ├─ church_id → churches(id)
  └─ class_id → classes(id)

trips
  └─ church_id → churches(id)

store_items
  └─ church_id → churches(id)

tasks
  ├─ assigned_to → users(id)
  └─ assigned_by → users(id)

requests
  ├─ student_id → users(id)
  └─ parent_id → users(id)

activity_participants
  ├─ activity_id → activities(id)
  └─ user_id → users(id)

trip_participants
  ├─ trip_id → trips(id)
  └─ user_id → users(id)

store_orders
  └─ user_id → users(id)

store_order_items
  ├─ order_id → store_orders(id)
  └─ item_id → store_items(id)

attendance
  ├─ class_id → classes(id)
  ├─ user_id → users(id)
  ├─ lesson_id → lessons(id)
  └─ marked_by → users(id)

login_history
  └─ user_id → users(id)
```

---

## Row Level Security (RLS)

All tables have **Row Level Security (RLS)** enabled. Access is controlled through policies that check:

1. **User roles** - Super admin, diocese admin, church admin, teacher, parent, student
2. **Organizational hierarchy** - Diocese → Church → Class relationships
3. **Direct assignments** - Class assignments, parent-student relationships
4. **Ownership** - Users can view/update their own data

### Helper Functions for RLS

The database includes these security helper functions:

1. **`is_super_admin()`** - Returns true if current user is super admin
2. **`is_diocese_admin(diocese_uuid)`** - Checks if user is admin of a diocese
3. **`is_church_admin(church_uuid)`** - Checks if user is admin of a church
4. **`is_class_teacher(class_uuid)`** - Checks if user teaches a class
5. **`is_class_student(class_uuid)`** - Checks if user is enrolled in a class
6. **`is_parent_of(student_uuid)`** - Checks if user is parent of a student
7. **`get_user_church_id()`** - Returns current user's church ID

---

## Access Control Matrix

| Resource | Super Admin | Diocese Admin | Church Admin | Teacher | Parent | Student |
|----------|-------------|---------------|--------------|---------|--------|---------|
| **Dioceses** | CRUD All | Read Own | Read | - | - | - |
| **Churches** | CRUD All | CRUD (diocese) | Read/Update Own | - | - | - |
| **Classes** | CRUD All | CRUD (diocese) | CRUD (church) | Read (assigned) | Read (child's) | Read (own) |
| **Users** | CRUD All | CRUD (diocese) | CRUD (church) | Read (assigned) | Read (child) | Read (own) |
| **Lessons** | CRUD All | - | CRUD (church) | CRUD (assigned) | Read | Read (published) |
| **Activities** | CRUD All | - | CRUD (church) | Read | Read | Read (published) |
| **Trips** | CRUD All | - | CRUD (church) | Read | Read | Read (published) |
| **Store Items** | CRUD All | - | CRUD (church) | Read | Read | Read (available) |
| **Attendance** | CRUD All | - | CRUD (church) | CRUD (class) | Read (child's) | Read (own) |
| **Requests** | Read All | - | Read (church) | - | Approve/Decline | Create/Read |
| **Tasks** | CRUD All | - | CRUD (church) | Read (assigned) | - | - |

---

## Database Triggers

### Auto-Update Timestamps
- **Trigger:** `set_updated_at` on `users`, `dioceses`, `churches`, `classes`, `lessons`, `activities`, `trips`, `store_items`, `tasks`
- **Function:** `handle_updated_at()`
- **Purpose:** Automatically updates `updated_at` column when row is modified

### Auto-Create User Profile
- **Trigger:** `on_auth_user_created` on `auth.users`
- **Function:** `handle_new_user()`
- **Purpose:** Automatically creates a profile in `public.users` when a new auth user is created

---

## Indexes Summary

All tables have appropriate indexes on:
- Primary keys (automatic)
- Foreign keys (for join performance)
- Frequently queried columns (email, username, dates, status fields)
- Unique constraints (email, username, composite keys)

---

## Data Types Reference

- **UUID** - Universally unique identifier (PostgreSQL native)
- **TEXT** - Variable-length string
- **DATE** - Date only (no time)
- **TIME** - Time only (no date)
- **TIMESTAMPTZ** - Timestamp with timezone
- **BOOLEAN** - True/false
- **INTEGER** - Whole number
- **DECIMAL(10,2)** - Decimal number with 10 digits total, 2 after decimal
- **JSONB** - JSON data in binary format (for attachments, device_info)
- **INET** - IP address type

---

## Migration Files

The database structure is defined in:
- **`supabase/migrations/00_FRESH_DATABASE_SETUP.sql`** - Complete setup for fresh database
- Individual migration files in `supabase/migrations/archive/` for incremental updates

---

## Notes

1. **Cascade Deletes:** Most relationships use `ON DELETE CASCADE` to maintain referential integrity
2. **Soft Deletes:** Some tables use `is_active` flags instead of hard deletes
3. **Audit Trail:** `created_at` and `updated_at` timestamps on most tables
4. **Security:** All tables have RLS enabled - no direct table access without proper policies
5. **Extensibility:** JSONB fields allow flexible data storage (attachments, device_info)

---

## Quick Reference: Table Counts

- **Core Tables:** 3 (users, login_history, user_relationships)
- **Organizational:** 3 (dioceses, churches, classes)
- **Assignments:** 1 (class_assignments)
- **Content:** 5 (lessons, activities, trips, store_items, tasks)
- **Operational:** 6 (requests, activity_participants, trip_participants, store_orders, store_order_items, attendance)

**Total: 18 tables**

