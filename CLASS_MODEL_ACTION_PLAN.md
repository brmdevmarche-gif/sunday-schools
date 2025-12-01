# Class Model Actions - Complete Implementation Plan

## Overview

This document outlines the complete plan to implement all class model actions and ensure full database integration for the Sunday School Management System.

## Current Status

### ✅ Already Implemented

1. **Basic CRUD Operations**
   - ✅ `getClasses(churchId?)` - Get all classes with optional church filter
   - ✅ `getClassById(id)` - Get single class by ID
   - ✅ `createClass(input)` - Create new class
   - ✅ `updateClass(id, updates)` - Update class
   - ✅ `deleteClass(id)` - Delete class

2. **Class Assignments**
   - ✅ `assignUserToClass(classId, userId, assignmentType)` - Assign teacher/student
   - ✅ `removeUserFromClass(assignmentId)` - Remove user from class
   - ✅ `getClassAssignments(classId)` - Get all assignments with user data

3. **Class Information**
   - ✅ `getClassWithDetails(id)` - Get class with church and diocese
   - ✅ `getClassStudentsCount(classId)` - Get student count

4. **UI Implementation**
   - ✅ Class management page (`/admin/classes`)
   - ✅ Create/Edit dialogs
   - ✅ Assignment dialogs
   - ✅ Roster view

---

## Missing/Needed Operations

### Priority 1: Core Functionality (High Priority)

#### 1. Toggle Active/Inactive Status
**Function:** `toggleClassStatus(classId: string, isActive: boolean)`
**Purpose:** Enable/disable classes without deleting them
**Database:** Update `is_active` field in `classes` table
**Use Case:** Temporarily disable classes during off-seasons

```typescript
export async function toggleClassStatus(
  classId: string,
  isActive: boolean
): Promise<Class> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('classes')
    .update({ is_active: isActive })
    .eq('id', classId)
    .select()
    .single()
  
  if (error) throw error
  return data as Class
}
```

#### 2. Get Teachers Count
**Function:** `getClassTeachersCount(classId: string)`
**Purpose:** Get number of active teachers assigned to a class
**Database:** Count `class_assignments` where `assignment_type = 'teacher'`
**Use Case:** Display teacher count in UI, validate minimum teachers

```typescript
export async function getClassTeachersCount(classId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('class_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('assignment_type', 'teacher')
    .eq('is_active', true)
  
  if (error) throw error
  return count || 0
}
```

#### 3. Get Classes by User
**Function:** `getClassesByUser(userId: string, assignmentType?: AssignmentType)`
**Purpose:** Get all classes a user is assigned to (as teacher or student)
**Database:** Query `class_assignments` joined with `classes`
**Use Case:** Teacher/student dashboard showing their classes

```typescript
export async function getClassesByUser(
  userId: string,
  assignmentType?: AssignmentType
): Promise<Class[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('class_assignments')
    .select('class:classes(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  if (assignmentType) {
    query = query.eq('assignment_type', assignmentType)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data.map((item: any) => item.class).filter(Boolean) as Class[]
}
```

#### 4. Get Classes by Academic Year
**Function:** `getClassesByAcademicYear(academicYear: string, churchId?: string)`
**Purpose:** Filter classes by academic year
**Database:** Query `classes` table with `academic_year` filter
**Use Case:** View classes for specific school year

```typescript
export async function getClassesByAcademicYear(
  academicYear: string,
  churchId?: string
): Promise<Class[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('classes')
    .select('*')
    .eq('academic_year', academicYear)
    .order('name', { ascending: true })
  
  if (churchId) {
    query = query.eq('church_id', churchId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data as Class[]
}
```

#### 5. Capacity Validation
**Function:** `checkClassCapacity(classId: string)`
**Purpose:** Check if class has available spots
**Database:** Compare student count vs capacity
**Use Case:** Prevent over-enrollment

```typescript
export async function checkClassCapacity(classId: string): Promise<{
  current: number
  capacity: number
  available: number
  isFull: boolean
}> {
  const supabase = createClient()
  
  // Get class capacity
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('capacity')
    .eq('id', classId)
    .single()
  
  if (classError) throw classError
  
  // Get current enrollment
  const current = await getClassStudentsCount(classId)
  const capacity = classData.capacity || 0
  const available = Math.max(0, capacity - current)
  
  return {
    current,
    capacity,
    available,
    isFull: current >= capacity
  }
}
```

---

### Priority 2: Enhanced Operations (Medium Priority)

#### 6. Bulk Assign Users
**Function:** `bulkAssignUsersToClass(classId: string, userIds: string[], assignmentType: AssignmentType)`
**Purpose:** Assign multiple users at once
**Database:** Batch insert into `class_assignments`
**Use Case:** Enroll multiple students at start of year

```typescript
export async function bulkAssignUsersToClass(
  classId: string,
  userIds: string[],
  assignmentType: AssignmentType
): Promise<ClassAssignment[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const assignments = userIds.map(userId => ({
    class_id: classId,
    user_id: userId,
    assignment_type: assignmentType,
    assigned_by: user.id,
  }))
  
  const { data, error } = await supabase
    .from('class_assignments')
    .insert(assignments)
    .select()
  
  if (error) throw error
  return data as ClassAssignment[]
}
```

#### 7. Bulk Remove Users
**Function:** `bulkRemoveUsersFromClass(classId: string, assignmentIds: string[])`
**Purpose:** Remove multiple users at once
**Database:** Batch delete from `class_assignments`
**Use Case:** End of year cleanup

```typescript
export async function bulkRemoveUsersFromClass(
  assignmentIds: string[]
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('class_assignments')
    .delete()
    .in('id', assignmentIds)
  
  if (error) throw error
}
```

#### 8. Search Classes
**Function:** `searchClasses(searchTerm: string, filters?: ClassSearchFilters)`
**Purpose:** Search classes by name, grade level, etc.
**Database:** Full-text search on `classes` table
**Use Case:** Quick class lookup

```typescript
interface ClassSearchFilters {
  churchId?: string
  dioceseId?: string
  gradeLevel?: string
  academicYear?: string
  isActive?: boolean
}

export async function searchClasses(
  searchTerm: string,
  filters?: ClassSearchFilters
): Promise<Class[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('classes')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  
  if (filters?.churchId) {
    query = query.eq('church_id', filters.churchId)
  }
  if (filters?.dioceseId) {
    // Need to join with churches
    query = query.eq('church.diocese_id', filters.dioceseId)
  }
  if (filters?.gradeLevel) {
    query = query.eq('grade_level', filters.gradeLevel)
  }
  if (filters?.academicYear) {
    query = query.eq('academic_year', filters.academicYear)
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data as Class[]
}
```

#### 9. Get Class Statistics
**Function:** `getClassStatistics(classId: string)`
**Purpose:** Get comprehensive class statistics
**Database:** Aggregate queries on multiple tables
**Use Case:** Dashboard analytics, reports

```typescript
export interface ClassStatistics {
  studentsCount: number
  teachersCount: number
  capacity: number
  enrollmentRate: number
  lessonsCount: number
  attendanceRate?: number
  upcomingLessons?: number
}

export async function getClassStatistics(classId: string): Promise<ClassStatistics> {
  const supabase = createClient()
  
  // Get class info
  const classData = await getClassById(classId)
  if (!classData) throw new Error('Class not found')
  
  // Get counts
  const [studentsCount, teachersCount] = await Promise.all([
    getClassStudentsCount(classId),
    getClassTeachersCount(classId)
  ])
  
  // Get lessons count
  const { count: lessonsCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
  
  const capacity = classData.capacity || 0
  const enrollmentRate = capacity > 0 ? (studentsCount / capacity) * 100 : 0
  
  return {
    studentsCount,
    teachersCount,
    capacity,
    enrollmentRate: Math.round(enrollmentRate * 100) / 100,
    lessonsCount: lessonsCount || 0,
  }
}
```

#### 10. Duplicate/Clone Class
**Function:** `duplicateClass(classId: string, newName: string, academicYear?: string)`
**Purpose:** Clone a class for new academic year
**Database:** Copy class record and optionally assignments
**Use Case:** Set up classes for new school year

```typescript
export async function duplicateClass(
  classId: string,
  newName: string,
  academicYear?: string,
  copyAssignments: boolean = false
): Promise<Class> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Get original class
  const originalClass = await getClassById(classId)
  if (!originalClass) throw new Error('Class not found')
  
  // Create new class
  const newClass = await createClass({
    church_id: originalClass.church_id!,
    name: newName,
    description: originalClass.description || undefined,
    grade_level: originalClass.grade_level || undefined,
    academic_year: academicYear || originalClass.academic_year || undefined,
    schedule: originalClass.schedule || undefined,
    capacity: originalClass.capacity || undefined,
  })
  
  // Optionally copy assignments
  if (copyAssignments) {
    const assignments = await getClassAssignments(classId)
    const userIds = assignments.map(a => a.user_id).filter(Boolean) as string[]
    const assignmentTypes = assignments.map(a => a.assignment_type) as AssignmentType[]
    
    // Bulk assign (need to handle different types)
    for (let i = 0; i < userIds.length; i++) {
      await assignUserToClass(newClass.id, userIds[i], assignmentTypes[i])
    }
  }
  
  return newClass
}
```

---

### Priority 3: Advanced Features (Lower Priority)

#### 11. Export Class Roster
**Function:** `exportClassRoster(classId: string, format: 'csv' | 'json')`
**Purpose:** Export class roster to file
**Database:** Query assignments with user details
**Use Case:** Generate reports, print rosters

```typescript
export async function exportClassRoster(
  classId: string,
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  const assignments = await getClassAssignments(classId)
  const classData = await getClassById(classId)
  
  if (format === 'json') {
    return JSON.stringify({
      class: classData,
      roster: assignments,
    }, null, 2)
  }
  
  // CSV format
  const headers = ['Name', 'Email', 'Role', 'Assigned At']
  const rows = assignments.map(a => [
    a.user?.full_name || a.user?.email || 'N/A',
    a.user?.email || 'N/A',
    a.assignment_type,
    new Date(a.assigned_at).toLocaleDateString(),
  ])
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}
```

#### 12. Get Upcoming Classes
**Function:** `getUpcomingClasses(churchId?: string, limit?: number)`
**Purpose:** Get classes starting soon (based on academic year)
**Database:** Query classes with date filtering
**Use Case:** Dashboard widgets, notifications

#### 13. Archive Class
**Function:** `archiveClass(classId: string)`
**Purpose:** Soft delete/archive old classes
**Database:** Set `is_active = false` and add archive flag
**Use Case:** Preserve historical data

#### 14. Get Classes by Grade Level
**Function:** `getClassesByGradeLevel(gradeLevel: string, churchId?: string)`
**Purpose:** Filter classes by grade
**Database:** Query with `grade_level` filter
**Use Case:** Grade-specific views

---

## Implementation Checklist

### Phase 1: Core Missing Functions (Week 1)
- [ ] Implement `toggleClassStatus()`
- [ ] Implement `getClassTeachersCount()`
- [ ] Implement `getClassesByUser()`
- [ ] Implement `getClassesByAcademicYear()`
- [ ] Implement `checkClassCapacity()`
- [ ] Update UI to use new functions

### Phase 2: Enhanced Operations (Week 2)
- [ ] Implement `bulkAssignUsersToClass()`
- [ ] Implement `bulkRemoveUsersFromClass()`
- [ ] Implement `searchClasses()`
- [ ] Implement `getClassStatistics()`
- [ ] Add bulk operations UI

### Phase 3: Advanced Features (Week 3)
- [ ] Implement `duplicateClass()`
- [ ] Implement `exportClassRoster()`
- [ ] Implement `getUpcomingClasses()`
- [ ] Implement `archiveClass()`
- [ ] Add export/download UI

### Phase 4: Testing & Integration (Week 4)
- [ ] Unit tests for all functions
- [ ] Integration tests with database
- [ ] Test RLS policies
- [ ] Test error handling
- [ ] Performance testing
- [ ] Documentation updates

---

## Database Integration Points

### Tables Used
1. **`classes`** - Main class data
2. **`class_assignments`** - Teacher/student assignments
3. **`users`** - User information (via joins)
4. **`churches`** - Church relationships
5. **`dioceses`** - Diocese relationships (via churches)
6. **`lessons`** - For statistics
7. **`attendance`** - For attendance statistics

### RLS Considerations
- All functions must respect Row Level Security
- Users can only access classes they have permission for
- Super admins can access all
- Diocese admins can access their diocese classes
- Church admins can access their church classes
- Teachers can access assigned classes
- Students can access their enrolled classes

### Performance Optimizations
- Use indexes on `church_id`, `academic_year`, `grade_level`
- Batch operations for bulk actions
- Cache statistics for frequently accessed data
- Use `select()` with specific fields to reduce payload

---

## Error Handling

All functions should handle:
1. **Authentication errors** - User not logged in
2. **Authorization errors** - User lacks permission
3. **Not found errors** - Class/user doesn't exist
4. **Validation errors** - Invalid input data
5. **Database errors** - Connection/query failures
6. **Capacity errors** - Class full, cannot enroll

---

## Testing Strategy

### Unit Tests
- Test each function in isolation
- Mock Supabase client
- Test error cases

### Integration Tests
- Test with real database (test environment)
- Test RLS policies
- Test transaction rollbacks

### E2E Tests
- Test complete workflows
- Test UI interactions
- Test permission boundaries

---

## Documentation Updates Needed

1. Update `src/lib/sunday-school/classes.ts` with JSDoc comments
2. Update API documentation
3. Update user guide with new features
4. Add code examples for each function

---

## Next Steps

1. **Review this plan** - Confirm all requirements
2. **Prioritize features** - Adjust priorities based on needs
3. **Start implementation** - Begin with Phase 1
4. **Test incrementally** - Test as you build
5. **Update UI** - Integrate new functions into UI
6. **Document** - Keep documentation updated

---

## Estimated Timeline

- **Phase 1:** 2-3 days
- **Phase 2:** 2-3 days
- **Phase 3:** 2-3 days
- **Phase 4:** 2-3 days

**Total:** 8-12 days of focused development

---

## Notes

- All functions should follow existing code patterns
- Use TypeScript types from `src/lib/types/sunday-school.ts`
- Maintain consistency with other modules (dioceses, churches)
- Consider adding API routes if needed for server-side operations
- Keep functions pure and testable

