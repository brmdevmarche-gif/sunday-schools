# Types Modules

This directory contains modular TypeScript type definitions for the Sunday School Management System.

## Structure

```
modules/
├── base.ts             # Base types (UserRole, Gender, etc.)
├── organizational.ts   # Diocese, Church, Class types
├── users.ts           # User, relationships, and assignments
├── trips.ts           # Trip management types
├── store.ts           # Store items and orders
├── activities.ts      # Activities and participation
└── attendance.ts      # Attendance tracking
```

## Usage

### Option 1: Import from main index (recommended for most cases)
```typescript
import type { Trip, TripType, Church, ExtendedUser } from '@/lib/types'
```

### Option 2: Import from specific module (recommended for large imports)
```typescript
import type { Trip, TripType, TripStatus } from '@/lib/types/modules/trips'
import type { Church, Diocese } from '@/lib/types/modules/organizational'
```

### Option 3: Legacy import (deprecated but still supported)
```typescript
// This still works but is deprecated
import type { Trip } from '@/lib/types/sunday-school'
```

## Module Descriptions

### base.ts
Core types used across the application:
- `UserRole` - All user role types
- `Gender` - Gender enum
- `ActivityType` - Activity type enum
- `PriceTier` - Pricing tier enum
- And more base enums

### organizational.ts
Organizational structure:
- `Diocese` - Diocese entity and related types
- `Church` - Church entity and related types
- `Class` - Class entity and related types
- `Lesson` - Lesson entity and related types

### users.ts
User management:
- `ExtendedUser` - User profile with all fields
- `UserWithClassAssignments` - User with class information
- `ClassAssignment` - Class assignment records
- `UserRelationship` - Parent-student relationships
- `Task` - Task management
- `Request` - Request and approval system

### trips.ts
Trip management:
- `Trip` - Trip entity
- `TripDestination` - Trip destinations
- `TripParticipant` - Trip participants
- `TripWithDetails` - Trip with all related data
- Input types for creating and updating trips

### store.ts
Store and orders:
- `StoreItem` - Store item entity
- `Order` - Order entity
- `OrderItem` - Individual order items
- `OrderWithDetails` - Order with user and items
- Input types for creating orders

### activities.ts
Activities system:
- `Activity` - Activity entity
- `ActivityParticipant` - Participation records
- `ActivityCompletion` - Completion tracking
- `ActivityWithDetails` - Activity with participation data
- Input types for managing activities

### attendance.ts
Attendance tracking:
- `Attendance` - Attendance record
- `AttendanceWithUser` - Attendance with user info
- Input types for creating attendance records

## Migration from sunday-school.ts

The old `sunday-school.ts` file has been converted to a re-export file for backward compatibility. All types are now in modular files.

To migrate your imports:

**Before:**
```typescript
import type {
  Trip,
  TripType,
  Church,
  ExtendedUser
} from '@/lib/types/sunday-school'
```

**After (Option 1 - Recommended):**
```typescript
import type {
  Trip,
  TripType,
  Church,
  ExtendedUser
} from '@/lib/types'
```

**After (Option 2 - More specific):**
```typescript
import type { Trip, TripType } from '@/lib/types/modules/trips'
import type { Church } from '@/lib/types/modules/organizational'
import type { ExtendedUser } from '@/lib/types/modules/users'
```

## Benefits of Modular Structure

1. **Better organization** - Related types are grouped together
2. **Easier maintenance** - Smaller files are easier to navigate and update
3. **Faster IDE performance** - TypeScript can load only needed modules
4. **Clear dependencies** - Easy to see which modules depend on others
5. **Better tree-shaking** - Bundlers can optimize imports better
