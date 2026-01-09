# Knasty Portal - Full-Stack Architecture Document

**Version:** 1.0
**Date:** January 2026
**Author:** Winston (Architect Agent)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Layers](#4-architecture-layers)
5. [Database Architecture](#5-database-architecture)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Internationalization (i18n)](#7-internationalization-i18n)
8. [Existing Module Architecture](#8-existing-module-architecture)
9. [New Feature: Enhanced Activities System](#9-new-feature-enhanced-activities-system)
10. [API Design](#10-api-design)
11. [Security Considerations](#11-security-considerations)
12. [Performance Considerations](#12-performance-considerations)
13. [Deployment Architecture](#13-deployment-architecture)

---

## 1. Executive Summary

**Knasty Portal** is a comprehensive **Sunday School Management System** designed for the Coptic Orthodox Church. It provides a multi-tenant platform for managing students, classes, attendance, activities, trips, and a points-based reward system across a hierarchical organizational structure (Diocese → Church → Class).

### Key Capabilities

- **Multi-level Organization**: Diocese, Church, and Class hierarchy with role-based access
- **User Management**: Students, Parents, Teachers, and Administrators
- **Attendance Tracking**: Class attendance with points integration
- **Activities & Points**: Gamified spiritual activities with approval workflows
- **Trips Management**: Multi-destination trips with participant tracking
- **Store System**: Points-based store for rewards
- **Announcements**: Targeted communications across organizational levels
- **Bilingual Support**: English and Arabic with full RTL support

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Web Browser   │  │   Mobile Web    │  │   PWA (Future)  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NEXT.JS APP ROUTER                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Middleware Layer                          │ │
│  │  • Session Management  • Locale Detection  • Route Guards   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  Server Components│  │  Client Components│  │ Server Actions │ │
│  │  (Data Fetching)  │  │  (Interactivity)  │  │ (Mutations)    │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL    │  │  Auth (GoTrue)  │  │    Storage      │  │
│  │   + RLS Policies│  │                 │  │  (Future: Files)│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure

```
knasty-portal/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing page
│   │   ├── login/                # Authentication
│   │   ├── dashboard/            # Student/Parent dashboard
│   │   ├── admin/                # Admin panel
│   │   │   ├── announcements/
│   │   │   ├── attendance/
│   │   │   ├── activities/
│   │   │   ├── classes/
│   │   │   ├── churches/
│   │   │   ├── dioceses/
│   │   │   ├── students/
│   │   │   ├── trips/
│   │   │   ├── store/
│   │   │   ├── points/
│   │   │   └── settings/
│   │   ├── activities/           # User-facing activities
│   │   ├── announcements/        # User-facing announcements
│   │   ├── attendance/           # Attendance views
│   │   ├── trips/                # Trip views
│   │   ├── store/                # Store/shop
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── ui/                   # Radix-based UI components
│   │   ├── admin/                # Admin-specific components
│   │   ├── providers/            # React context providers
│   │   └── [module]/             # Module-specific components
│   ├── lib/
│   │   ├── supabase/             # Supabase client setup
│   │   ├── sunday-school/        # Domain logic
│   │   ├── types/                # TypeScript definitions
│   │   └── utils/                # Utility functions
│   ├── i18n/                     # Internationalization config
│   └── middleware.ts             # Next.js middleware
├── supabase/
│   └── migrations/               # Database migrations (33 files)
├── messages/                     # i18n translation files
│   ├── en.json
│   └── ar.json
└── public/                       # Static assets
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.7 | React framework with App Router |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Radix UI | Various | Headless UI components |
| React Hook Form | 7.65.0 | Form management |
| Zod | 4.1.12 | Schema validation |
| next-intl | 4.5.6 | Internationalization |
| next-themes | 0.4.6 | Theme management |
| Lucide React | 0.548.0 | Icons |
| Sonner | 2.0.7 | Toast notifications |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | Latest | Backend-as-a-Service |
| PostgreSQL | 15+ | Relational database |
| Supabase Auth | Latest | Authentication (GoTrue) |
| Row Level Security | - | Authorization at database level |

### 3.3 Development Tools

| Tool | Purpose |
|------|---------|
| Turbopack | Fast bundler (Next.js 16 default) |
| ESLint 9 | Code linting |
| Supabase CLI | Database management |
| tsx | TypeScript script execution |

---

## 4. Architecture Layers

### 4.1 Presentation Layer

**Server Components** (Default)
- Used for: Data fetching, auth checks, static content
- Benefits: Zero client JavaScript, direct database access
- Location: `src/app/**/page.tsx`

**Client Components** (`"use client"`)
- Used for: Interactive UI, forms, state management
- Benefits: Rich interactivity, event handling
- Location: `src/app/**/*Client.tsx`, `src/components/**`

**Server Actions** (`"use server"`)
- Used for: Form submissions, data mutations
- Benefits: Type-safe RPC, automatic revalidation
- Location: `src/app/**/actions.ts`

### 4.2 Business Logic Layer

Located in `src/lib/`:

```
lib/
├── supabase/
│   ├── server.ts          # Server-side Supabase client
│   ├── client.ts          # Client-side Supabase client
│   └── admin.ts           # Admin client (bypasses RLS)
├── sunday-school/
│   ├── users.ts           # User queries
│   ├── users.server.ts    # Server-only user logic
│   ├── classes.ts         # Class management
│   ├── dioceses.ts        # Diocese queries
│   ├── churches.ts        # Church queries
│   ├── permissions.ts     # Role-based permission checks
│   └── diocese-admins.ts  # Diocese admin assignments
├── auth.ts                # Authentication utilities
├── profile.ts             # User profile management
└── login-history.ts       # Login audit trail
```

### 4.3 Data Layer

**Supabase Client Types:**

1. **User Client** (`createClient`)
   - Respects Row Level Security (RLS)
   - Uses user's session for authorization
   - For user-facing operations

2. **Admin Client** (`createAdminClient`)
   - Bypasses RLS with service role key
   - For administrative operations
   - Used in server actions with prior auth check

---

## 5. Database Architecture

### 5.1 Entity Relationship Overview

```
                    ┌─────────────┐
                    │  dioceses   │
                    └──────┬──────┘
                           │ 1:N
                    ┌──────▼──────┐
                    │  churches   │
                    └──────┬──────┘
                           │ 1:N
                    ┌──────▼──────┐
                    │   classes   │
                    └──────┬──────┘
                           │ N:M
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌──────────┐  ┌─────────┐
        │  users  │  │attendance│  │activities│
        └────┬────┘  └──────────┘  └────┬────┘
             │                          │
     ┌───────┼───────┐          ┌───────┼───────┐
     ▼       ▼       ▼          ▼       ▼       ▼
  points  orders  trips    participants completions
```

### 5.2 Core Tables

#### Users & Organization

| Table | Purpose |
|-------|---------|
| `dioceses` | Top-level organizational unit |
| `churches` | Churches within dioceses |
| `classes` | Sunday school classes |
| `users` | User profiles (all roles) |
| `class_assignments` | User-to-class relationships |
| `user_relationships` | Family relationships |
| `diocese_admins` | Diocese admin assignments |

#### Activities & Points

| Table | Purpose |
|-------|---------|
| `activities` | Activity definitions (hierarchical) |
| `activity_participants` | User participation with approval |
| `activity_completions` | Completion records with points |
| `church_points_config` | Per-church points settings |
| `student_points_balance` | User points ledger |
| `points_transactions` | Audit trail for all point changes |

#### Other Modules

| Table | Purpose |
|-------|---------|
| `attendance` | Class attendance records |
| `trips` | Trip definitions |
| `trip_participants` | Trip participation |
| `store_items` | Store inventory |
| `orders` | Store orders |
| `announcements` | Targeted announcements |
| `login_history` | User login audit |

### 5.3 Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:

1. **Organizational Scope**: Users can only access data within their diocese/church/class
2. **Role Hierarchy**: Higher roles can access more data
3. **Ownership**: Users can access their own records

Example Policy Pattern:
```sql
CREATE POLICY "Users can view own records"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view scoped records"
  ON public.table_name FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'super_admin'
        OR (u.role = 'diocese_admin' AND ...)
        OR (u.role = 'church_admin' AND ...)
        OR (u.role = 'teacher' AND ...)
      )
    )
  );
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│  User    │───▶│  Login Page  │───▶│ Supabase    │
│          │    │  (email/code)│    │ Auth        │
└──────────┘    └──────────────┘    └──────┬──────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │  Session    │
                                    │  Cookie     │
                                    └──────┬──────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ Middleware  │
                                    │ Validation  │
                                    └─────────────┘
```

**Login Methods:**
1. Email + Password
2. 6-digit User Code + Password

### 6.2 Role Hierarchy

```
super_admin
    │
    ├── diocese_admin
    │       │
    │       ├── church_admin
    │       │       │
    │       │       └── teacher
    │       │
    │       └── teacher
    │
    ├── parent
    │
    └── student
```

### 6.3 Permission Functions

Located in `src/lib/sunday-school/permissions.ts`:

```typescript
isSuperAdmin(user)      // Full system access
isDioceseAdmin(user)    // Diocese-level access
isChurchAdmin(user)     // Church-level access
isTeacher(user)         // Class-level access
isParent(user)          // View child's data
isStudent(user)         // Self access
```

---

## 7. Internationalization (i18n)

### 7.1 Configuration

**Supported Locales:** `en` (English), `ar` (Arabic)
**Default Locale:** `en`
**RTL Support:** Yes (Arabic)

### 7.2 Implementation

```
src/i18n/
└── request.ts         # Locale detection from headers

messages/
├── en.json            # English translations
└── ar.json            # Arabic translations (RTL)
```

**Locale Detection Flow:**
1. Middleware checks URL prefix (`/ar/*`, `/en/*`)
2. Sets `NEXT_LOCALE` cookie
3. Redirects to base URL
4. `x-next-intl-locale` header passed to app

**Usage:**
```typescript
// Server Component
const t = await getTranslations();

// Client Component
const t = useTranslations();
```

---

## 8. Existing Module Architecture

### 8.1 Activities Module (Current)

**Database Tables:**
- `activities` - Activity definitions
- `activity_participants` - Participation tracking
- `activity_completions` - Completion & points

**Features:**
- Hierarchical activities (parent/sub-activities)
- Multi-level scoping (diocese/church/class)
- Participation approval workflow
- Completion approval workflow
- Points with time-sensitive reduced rates
- Point revocation capability

**UI Components:**
- `ActivitiesClient.tsx` - User-facing activities list
- `ActivitiesManagementClient.tsx` - Admin management
- `CreateActivityClient.tsx` - Activity creation form
- `EditActivityClient.tsx` - Activity editing

### 8.2 Points System (Current)

**Database Tables:**
- `church_points_config` - Per-church configuration
- `student_points_balance` - Available/suspended/used points
- `points_transactions` - Audit trail

**Transaction Types:**
```typescript
'activity_completion'     // Earned from activities
'activity_revocation'     // Revoked points
'attendance'              // Attendance points
'trip_participation'      // Trip points
'teacher_adjustment'      // Manual adjustment
'store_order_pending'     // Suspended for order
'store_order_approved'    // Order completed
'store_order_cancelled'   // Order cancelled
'store_order_rejected'    // Order rejected
'admin_adjustment'        // Admin override
```

---

## 9. New Feature: Enhanced Activities System

### 9.1 Feature Overview

The Enhanced Activities System extends the existing activities module with three new sub-modules:

1. **Spiritual Notes** - Track daily spiritual practices
2. **Competitions** - Manage contests with various submission types
3. **Daily Readings** - Bible reading schedules with verse tracking

### 9.2 Database Schema Extensions

#### 9.2.1 New Enums

```sql
-- Spiritual activity types
CREATE TYPE spiritual_activity_type AS ENUM (
  'prayer',
  'mass',
  'confession',
  'fasting',
  'bible_reading',
  'charity',
  'other'
);

-- Competition submission types
CREATE TYPE competition_submission_type AS ENUM (
  'text',
  'pdf_upload',
  'google_form'
);

-- Submission status
CREATE TYPE submission_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'needs_revision'
);
```

#### 9.2.2 Spiritual Notes Table

```sql
CREATE TABLE public.spiritual_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to user
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Activity categorization
  activity_type spiritual_activity_type NOT NULL,
  custom_type VARCHAR(100),  -- For 'other' type

  -- Content
  title VARCHAR(255),
  description TEXT,

  -- Date of activity
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Points configuration (from activity template)
  activity_template_id UUID REFERENCES public.spiritual_activity_templates(id),

  -- Approval workflow
  status submission_status NOT NULL DEFAULT 'submitted',
  points_requested INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,

  -- Teacher review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Scoping
  class_id UUID REFERENCES public.classes(id),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template for spiritual activities (admin-defined)
CREATE TABLE public.spiritual_activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  activity_type spiritual_activity_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Points
  base_points INTEGER NOT NULL DEFAULT 5,
  max_per_day INTEGER DEFAULT 1,  -- Limit submissions per day

  -- Scoping
  diocese_id UUID REFERENCES public.dioceses(id),
  church_id UUID REFERENCES public.churches(id),
  class_id UUID REFERENCES public.classes(id),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 9.2.3 Competitions Table

```sql
CREATE TABLE public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Submission configuration
  submission_type competition_submission_type NOT NULL,
  google_form_url TEXT,  -- For google_form type

  -- Instructions
  instructions TEXT,
  submission_guidelines TEXT,

  -- Time window
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Points
  base_points INTEGER NOT NULL DEFAULT 10,
  bonus_points INTEGER DEFAULT 0,  -- For winners

  -- Scoping
  diocese_id UUID REFERENCES public.dioceses(id),
  church_id UUID REFERENCES public.churches(id),
  class_id UUID REFERENCES public.classes(id),

  -- Status
  status activity_status NOT NULL DEFAULT 'draft',

  -- Creator
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.competition_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Content (based on submission type)
  text_content TEXT,
  file_url TEXT,  -- For PDF uploads
  google_form_response_id TEXT,  -- For Google Form tracking

  -- Grading
  status submission_status NOT NULL DEFAULT 'submitted',
  score INTEGER,  -- Optional numeric score
  ranking INTEGER,  -- Position in competition

  -- Points
  points_awarded INTEGER DEFAULT 0,

  -- Teacher review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,

  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(competition_id, user_id)
);
```

#### 9.2.4 Daily Readings Table

```sql
CREATE TABLE public.reading_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Schedule period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Points per reading
  points_per_reading INTEGER NOT NULL DEFAULT 5,

  -- Scoping
  diocese_id UUID REFERENCES public.dioceses(id),
  church_id UUID REFERENCES public.churches(id),
  class_id UUID REFERENCES public.classes(id),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Creator
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.reading_schedule_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  schedule_id UUID NOT NULL REFERENCES public.reading_schedules(id) ON DELETE CASCADE,

  -- Reading assignment
  reading_date DATE NOT NULL,
  book_name VARCHAR(100) NOT NULL,  -- e.g., "Matthew", "Genesis"
  chapter_start INTEGER NOT NULL,
  chapter_end INTEGER,  -- Optional for multi-chapter readings
  verse_start INTEGER,  -- Optional for specific verses
  verse_end INTEGER,

  -- Display
  reading_reference VARCHAR(255) NOT NULL,  -- e.g., "Matthew 5:1-12"

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(schedule_id, reading_date)
);

CREATE TABLE public.user_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  schedule_day_id UUID NOT NULL REFERENCES public.reading_schedule_days(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Reading record
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Favorite verse
  favorite_verse_reference VARCHAR(100),  -- e.g., "Matthew 5:9"
  favorite_verse_text TEXT,

  -- Optional reflection
  reflection TEXT,

  -- Approval (optional, can be auto-approved)
  status submission_status NOT NULL DEFAULT 'submitted',
  points_awarded INTEGER DEFAULT 0,

  -- Teacher review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  UNIQUE(schedule_day_id, user_id)
);
```

### 9.3 TypeScript Types

```typescript
// src/lib/types/modules/enhanced-activities.ts

// =====================================================
// SPIRITUAL NOTES
// =====================================================

export type SpiritualActivityType =
  | 'prayer'
  | 'mass'
  | 'confession'
  | 'fasting'
  | 'bible_reading'
  | 'charity'
  | 'other';

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_revision';

export interface SpiritualActivityTemplate {
  id: string;
  activity_type: SpiritualActivityType;
  name: string;
  description: string | null;
  base_points: number;
  max_per_day: number | null;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SpiritualNote {
  id: string;
  user_id: string;
  activity_type: SpiritualActivityType;
  custom_type: string | null;
  title: string | null;
  description: string | null;
  activity_date: string;
  activity_template_id: string | null;
  status: SubmissionStatus;
  points_requested: number;
  points_awarded: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  class_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSpiritualNoteInput {
  activity_type: SpiritualActivityType;
  custom_type?: string;
  title?: string;
  description?: string;
  activity_date: string;
  activity_template_id?: string;
}

// =====================================================
// COMPETITIONS
// =====================================================

export type CompetitionSubmissionType = 'text' | 'pdf_upload' | 'google_form';

export interface Competition {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  submission_type: CompetitionSubmissionType;
  google_form_url: string | null;
  instructions: string | null;
  submission_guidelines: string | null;
  start_date: string;
  end_date: string;
  base_points: number;
  bonus_points: number | null;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitionSubmission {
  id: string;
  competition_id: string;
  user_id: string;
  text_content: string | null;
  file_url: string | null;
  google_form_response_id: string | null;
  status: SubmissionStatus;
  score: number | null;
  ranking: number | null;
  points_awarded: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface CreateCompetitionInput {
  name: string;
  description?: string;
  submission_type: CompetitionSubmissionType;
  google_form_url?: string;
  instructions?: string;
  submission_guidelines?: string;
  start_date: string;
  end_date: string;
  base_points: number;
  bonus_points?: number;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
}

export interface SubmitCompetitionInput {
  competition_id: string;
  text_content?: string;
  file?: File;  // For PDF upload
}

// =====================================================
// DAILY READINGS
// =====================================================

export interface ReadingSchedule {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  points_per_reading: number;
  diocese_id: string | null;
  church_id: string | null;
  class_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ReadingScheduleDay {
  id: string;
  schedule_id: string;
  reading_date: string;
  book_name: string;
  chapter_start: number;
  chapter_end: number | null;
  verse_start: number | null;
  verse_end: number | null;
  reading_reference: string;
  created_at: string;
}

export interface UserReading {
  id: string;
  schedule_day_id: string;
  user_id: string;
  completed_at: string;
  favorite_verse_reference: string | null;
  favorite_verse_text: string | null;
  reflection: string | null;
  status: SubmissionStatus;
  points_awarded: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface CreateReadingScheduleInput {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  points_per_reading: number;
  diocese_id?: string;
  church_id?: string;
  class_id?: string;
  readings: {
    reading_date: string;
    book_name: string;
    chapter_start: number;
    chapter_end?: number;
    verse_start?: number;
    verse_end?: number;
    reading_reference: string;
  }[];
}

export interface SubmitReadingInput {
  schedule_day_id: string;
  favorite_verse_reference?: string;
  favorite_verse_text?: string;
  reflection?: string;
}
```

### 9.4 UI Component Architecture

```
src/app/
├── activities/
│   ├── page.tsx                    # Activities hub
│   ├── spiritual-notes/
│   │   ├── page.tsx                # My spiritual notes
│   │   ├── new/page.tsx            # Add new note
│   │   └── SpiritualNotesClient.tsx
│   ├── competitions/
│   │   ├── page.tsx                # Available competitions
│   │   ├── [id]/page.tsx           # Competition details & submit
│   │   └── CompetitionsClient.tsx
│   └── readings/
│       ├── page.tsx                # My reading schedule
│       ├── [scheduleId]/page.tsx   # Schedule details
│       └── ReadingsClient.tsx
│
└── admin/
    └── activities/
        ├── spiritual-notes/
        │   ├── page.tsx            # Review submissions
        │   ├── templates/page.tsx  # Manage templates
        │   └── AdminSpiritualNotesClient.tsx
        ├── competitions/
        │   ├── page.tsx            # Manage competitions
        │   ├── [id]/page.tsx       # Review submissions
        │   ├── create/page.tsx     # Create competition
        │   └── AdminCompetitionsClient.tsx
        └── readings/
            ├── page.tsx            # Manage schedules
            ├── create/page.tsx     # Create schedule
            ├── [id]/page.tsx       # Review completions
            └── AdminReadingsClient.tsx
```

### 9.5 Server Actions

```typescript
// src/app/activities/spiritual-notes/actions.ts

'use server'

export async function createSpiritualNoteAction(input: CreateSpiritualNoteInput) {
  // Validate user is student
  // Check daily limit from template
  // Create spiritual note
  // Request points based on template
}

export async function getSpiritualNotesAction(filters?: {
  user_id?: string;
  status?: SubmissionStatus;
  activity_type?: SpiritualActivityType;
  date_from?: string;
  date_to?: string;
}) {
  // Fetch spiritual notes with filters
  // Apply RLS based on user role
}

// Admin actions
export async function reviewSpiritualNoteAction(input: {
  note_id: string;
  approved: boolean;
  points_awarded?: number;
  review_notes?: string;
}) {
  // Update status
  // Award points if approved
  // Create points transaction
}

export async function bulkReviewSpiritualNotesAction(
  note_ids: string[],
  approved: boolean
) {
  // Batch review multiple notes
}
```

### 9.6 Approval Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Student   │────▶│  Submitted  │────▶│   Teacher   │
│   Creates   │     │   (Queue)   │     │   Reviews   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                           ┌───────────────────┼───────────────────┐
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │  Approved   │     │  Rejected   │     │   Needs     │
                    │  + Points   │     │             │     │  Revision   │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

### 9.7 Points Integration

All three sub-modules integrate with the existing points system:

1. **Spiritual Notes**: Points based on activity template
2. **Competitions**: Base points + optional bonus for winners
3. **Daily Readings**: Points per completed reading

New transaction types to add:
```sql
ALTER TYPE points_transaction_type ADD VALUE 'spiritual_note';
ALTER TYPE points_transaction_type ADD VALUE 'competition_submission';
ALTER TYPE points_transaction_type ADD VALUE 'reading_completion';
```

---

## 10. API Design

### 10.1 REST API Routes

```
/api/
├── auth/
│   └── profile/                    GET     # Get user profile
├── admin/
│   ├── users/                      GET/POST
│   ├── create-user/                POST
│   └── dioceses/[id]/admins/       GET/POST
└── announcements/
    └── unviewed-count/             GET
```

### 10.2 Server Actions Pattern

All mutations use Next.js Server Actions instead of API routes:

```typescript
// Pattern for all server actions
export async function actionName(input: InputType): Promise<ActionResult> {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 2. Check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!hasPermission(profile.role)) {
    throw new Error('Unauthorized');
  }

  // 3. Use admin client for write operations
  const adminClient = createAdminClient();

  // 4. Perform operation
  const { data, error } = await adminClient
    .from('table')
    .insert(input);

  // 5. Revalidate affected paths
  revalidatePath('/path');

  return { success: true, data };
}
```

---

## 11. Security Considerations

### 11.1 Authentication Security

- Session tokens stored in HTTP-only cookies
- Automatic session refresh in middleware
- Login attempts logged in `login_history`

### 11.2 Authorization Security

- Row Level Security (RLS) on all tables
- Role-based access control in application layer
- Admin client only used after explicit auth check

### 11.3 Input Validation

- Zod schemas for all form inputs
- Server-side validation in all actions
- Sanitization of user-generated content

### 11.4 File Upload Security (For Competitions)

For PDF uploads, implement:
- File type validation (application/pdf only)
- File size limits (e.g., 10MB)
- Virus scanning (via Supabase Storage policies)
- Secure URL generation with expiry

---

## 12. Performance Considerations

### 12.1 Database Optimization

- Indexes on frequently queried columns
- Efficient RLS policies using EXISTS subqueries
- Pagination for list views

### 12.2 Frontend Optimization

- Server Components for initial data fetch
- Suspense boundaries for streaming
- Image optimization via Next.js Image
- Lazy loading for heavy components

### 12.3 Caching Strategy

- `revalidatePath()` for targeted cache invalidation
- Consider `unstable_cache()` for expensive queries
- Static generation where possible

---

## 13. Deployment Architecture

### 13.1 Infrastructure

```
┌─────────────────────────────────────────────────┐
│                   Vercel                        │
│  ┌──────────────────────────────────────────┐  │
│  │           Next.js Application            │  │
│  │  • Server Components                     │  │
│  │  • Edge Middleware                       │  │
│  │  • API Routes                            │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                  Supabase                       │
│  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │ PostgreSQL  │  │    Auth     │  │Storage │  │
│  │ (Database)  │  │  (GoTrue)   │  │(Files) │  │
│  └─────────────┘  └─────────────┘  └────────┘  │
└─────────────────────────────────────────────────┘
```

### 13.2 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Appendix A: Migration Order for Enhanced Activities

1. Add new enums
2. Create `spiritual_activity_templates` table
3. Create `spiritual_notes` table
4. Create `competitions` table
5. Create `competition_submissions` table
6. Create `reading_schedules` table
7. Create `reading_schedule_days` table
8. Create `user_readings` table
9. Add new points transaction types
10. Create RLS policies for all new tables
11. Create indexes

---

## Appendix B: i18n Keys for Enhanced Activities

```json
{
  "spiritualNotes": {
    "title": "Spiritual Notes",
    "addNew": "Add Spiritual Note",
    "types": {
      "prayer": "Prayer",
      "mass": "Divine Liturgy",
      "confession": "Confession",
      "fasting": "Fasting",
      "bible_reading": "Bible Reading",
      "charity": "Charity",
      "other": "Other"
    }
  },
  "competitions": {
    "title": "Competitions",
    "submit": "Submit Entry",
    "submissionTypes": {
      "text": "Written Answer",
      "pdf_upload": "Upload PDF",
      "google_form": "Google Form"
    }
  },
  "readings": {
    "title": "Daily Readings",
    "todaysReading": "Today's Reading",
    "markComplete": "Mark as Read",
    "favoriteVerse": "Favorite Verse"
  }
}
```

---

*Document generated by Winston, Architect Agent*
