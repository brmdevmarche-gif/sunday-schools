# Knesty Portal - Sunday School Management System

## Project Overview

Knesty Portal is a comprehensive Sunday School Management System built with Next.js 14, TypeScript, Supabase, and Tailwind CSS. The system manages churches, servants, students, classes, activities, and includes a points-based store system.

## Database Architecture

### Core Entity Hierarchy

```
Diocese (Bishop-level administration)
├── Churches (Individual church locations)
│   ├── Areas (Geographic regions)
│   ├── Servants (Staff/Teachers)
│   ├── Students (Sunday school students)
│   ├── Class Groups (Educational units)
│   ├── Church Activities (Events/programs)
│   ├── Stores (Points-based marketplace)
│   └── Offers (Donations/contributions)
```

### Key Database Tables

#### **Administrative Structure**

- **`diocese`**: Top-level church administration (bishop territories)
- **`churches`**: Individual church locations with contact info, coordinates
- **`areas`**: Geographic regions connecting churches
- **`area_churches`**: Many-to-many church-area relationships

#### **People Management**

- **`servants`**: Church staff/teachers with roles (superAdmin, admin, servant, beginner)
  - Roles: `superAdmin` (highest) → `admin` → `servant` → `beginner`
  - Fields: contact info, service dates, year_type specialization, coordinates
- **`students`**: Sunday school students with parent info, class assignments
- **`users`**: App users for content/blog features

#### **Educational System**

- **`class_groups`**: Educational units by year_type (kg, primary, preparatory, secondary)
- **`student_class_assignments`**: Student enrollment in classes
- **`servant_class_assignments`**: Teacher assignments to classes
- **`lessons`**: Curriculum content by year_type
- **`class_sessions`**: Scheduled class meetings with attendance
- **`student_attendance`**: Student attendance tracking
- **`servant_attendance`**: Staff attendance for activities

#### **Activities & Events**

- **`church_activities`**: Events, programs, special services
- **`student_activity_participation`**: Student event participation

#### **Store & Points System**

- **`stores`**: Church stores (physical/virtual marketplace)
- **`store_items_catalog`**: Product catalog with points/cash pricing
- **`store_item_stock`**: Inventory management per store
- **`store_class_assignments`**: Which classes can access which stores
- **`student_wallets`**: Student points balance system
- **`store_order_requests`**: Purchase orders with workflow states
- **`store_order_items`**: Line items for orders
- **`store_order_state_history`**: Order status audit trail

#### **Content & Communication**

- **`posts`**: Announcements, blog posts, news
- **`comments`**: User comments on posts
- **`offers`**: Donation tracking and management

### Data Types & Enums

#### **Role Hierarchy**

```typescript
type ServantRole = "superAdmin" | "admin" | "servant" | "beginner";
```

#### **Educational Levels**

```typescript
type YearType = "kg" | "primary" | "preparatory" | "secondary";
```

#### **Order Workflow**

```typescript
type OrderStatus =
  | "requested"
  | "reviewing"
  | "approved"
  | "purchased"
  | "ready_for_pickup"
  | "collected"
  | "cancelled"
  | "rejected";
```

#### **Activity Types**

```typescript
type ActivityType = "service" | "event" | "class" | "meeting" | "social";
```

## Current Implementation Status

### ✅ **Completed Components**

- **Servant Management**: Full CRUD with role-based access
  - Form validation and error handling
  - Role badge system with color coding
  - Church assignment and contact management
- **Database Integration**: Supabase connection with RLS
- **Type Safety**: Comprehensive TypeScript interfaces
- **UI Foundation**: Tailwind CSS with shadcn/ui components

### 🔄 **In Progress**

- **Authentication**: Supabase Auth integration
- **Role-based Access Control**: Permission system implementation

### ❌ **Missing Critical Components**

#### **People Management**

- **Student Management**: Registration, enrollment, parent contacts
- **Diocese/Church Management**: Hierarchical administration
- **User Management**: App user accounts and profiles

#### **Educational System**

- **Class Group Management**: Class creation, scheduling, room assignments
- **Lesson Planning**: Curriculum management by year type
- **Attendance System**: Digital check-in/out for students and servants
- **Class Assignment**: Student-class and servant-class relationship management

#### **Activity Management**

- **Event Creation**: Church activities with target audiences
- **Participation Tracking**: Who attended what events
- **Calendar Integration**: Event scheduling and conflicts

#### **Store System** (Major Missing Feature)

- **Store Setup**: Create and manage church stores
- **Catalog Management**: Product listing with points/cash pricing
- **Inventory Control**: Stock management per store/item
- **Order Management**: Request → Review → Purchase → Pickup workflow
- **Student Wallet**: Points balance and transaction history
- **Manager Dashboard**: Order approval and inventory oversight

#### **Financial Management**

- **Donation Tracking**: Offer management and reporting
- **Financial Reports**: Income, expenses, points economy

#### **Content Management**

- **Blog/News System**: Church announcements and communication
- **Comment System**: Community engagement features

## UI Architecture Plan

### **Main Navigation Structure**

```
Dashboard (Overview + Quick Actions)
├── People
│   ├── Students (Registration, Profiles, Search)
│   ├── Servants (Current: Fully Implemented)
│   └── Families (Parent/Guardian management)
├── Education
│   ├── Classes (Group management, Scheduling)
│   ├── Lessons (Curriculum, Planning)
│   ├── Attendance (Daily tracking, Reports)
│   └── Reports (Academic progress, Statistics)
├── Activities
│   ├── Events (Create, Manage, Calendar view)
│   ├── Participation (Registration, Tracking)
│   └── Calendar (Master schedule, Conflicts)
├── Store System
│   ├── Stores (Setup, Management)
│   ├── Catalog (Products, Pricing)
│   ├── Orders (Workflow, Approval)
│   ├── Inventory (Stock levels, Restocking)
│   └── Wallets (Points, Transactions)
├── Administration
│   ├── Churches (Locations, Contact info)
│   ├── Dioceses (Regional management)
│   ├── Areas (Geographic organization)
│   └── Settings (System configuration)
├── Financial
│   ├── Donations (Offer tracking)
│   ├── Reports (Income, Expenses)
│   └── Points Economy (Store metrics)
└── Communication
    ├── News/Blog (Announcements)
    ├── Messages (Internal communication)
    └── Comments (Community engagement)
```

### **Critical UI Components Needed**

#### **High Priority (Core Functionality)**

1. **Dashboard**: Overview with key metrics, recent activities
2. **Student Management**: Registration forms, profile management
3. **Class Management**: Group creation, student/servant assignment
4. **Attendance System**: Quick check-in interface, daily reports
5. **Store Basic Setup**: Catalog management, simple ordering

#### **Medium Priority (Enhanced Features)**

1. **Activity Management**: Event creation, participation tracking
2. **Advanced Store Features**: Full order workflow, inventory
3. **Financial Reports**: Donation tracking, store economics
4. **Calendar System**: Integrated scheduling, conflict detection

#### **Low Priority (Nice-to-Have)**

1. **Content Management**: Blog/news system
2. **Advanced Analytics**: Detailed reporting, trends
3. **Mobile App Integration**: PWA features
4. **Communication Tools**: Messaging, notifications

## Development Guidelines

### **Data Handling Patterns**

```typescript
// Use UUID strings for all entity IDs
interface BaseEntity {
  id: string; // UUID
  created_at: string;
  updated_at: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
  deleted?: boolean;
}

// Follow hierarchical relationships
interface Student extends BaseEntity {
  church_id: string; // FK to churches
  year_type: YearType;
  // ... other fields
}
```

### **Component Architecture**

- **Custom Hooks**: `useStudentManagement`, `useStoreManagement`, etc.
- **Form Validation**: Zod schemas for type-safe validation
- **Error Handling**: Consistent error states and user feedback
- **Loading States**: Skeleton components and loading indicators

### **State Management**

- **React Query/SWR**: Server state management
- **Zustand**: Global client state (user preferences, UI state)
- **Form State**: React Hook Form with Zod validation

### **Security & Permissions**

- **Row Level Security (RLS)**: Implemented at database level
- **Role-based UI**: Show/hide features based on servant role
- **Church Isolation**: Users only see data from their assigned church

## Next Development Priorities

### **Phase 1: Core Education Features** (2-3 weeks)

1. Student Management (registration, profiles)
2. Class Group Management (creation, assignments)
3. Basic Attendance System (daily check-in)

### **Phase 2: Store System Foundation** (3-4 weeks)

1. Store Setup and Catalog Management
2. Student Wallet System
3. Basic Order Workflow (request → approve → fulfill)

### **Phase 3: Activities & Advanced Features** (2-3 weeks)

1. Church Activity Management
2. Participation Tracking
3. Calendar Integration

### **Phase 4: Administration & Reporting** (2 weeks)

1. Diocese/Church Management
2. Financial Reporting
3. System Administration

## Code Style & Standards

- **TypeScript**: Strict mode, comprehensive type safety
- **ESLint + Prettier**: Consistent code formatting
- **Component Naming**: PascalCase for components, kebab-case for files
- **Database Naming**: snake_case to match PostgreSQL conventions
- **Git**: Conventional commits, feature branches
- **Testing**: Unit tests for utilities, integration tests for critical flows
