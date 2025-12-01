/**
 * Comprehensive Seed Script - Creates Complete Dummy Data
 * 
 * This script creates:
 * - Diocese (if needed)
 * - Church (if needed)
 * - Teachers (5)
 * - Students (15)
 * - Classes (3-5)
 * - Class Assignments (teachers and students to classes)
 */

import { createUser } from '../sunday-school/users'
import { getChurches, createChurch } from '../sunday-school/churches'
import { getDioceses, createDiocese } from '../sunday-school/dioceses'
import { createClass, bulkAssignUsersToClass } from '../sunday-school/classes'
import type { CreateClassInput } from '../types/sunday-school'

const DEFAULT_PASSWORD = 'Test123456'

// Dummy teacher data
const dummyTeachers = [
  { full_name: 'Sarah Johnson', email: 'sarah.teacher@test.com', username: 'sarahj' },
  { full_name: 'Michael Chen', email: 'michael.teacher@test.com', username: 'michaelc' },
  { full_name: 'Emily Rodriguez', email: 'emily.teacher@test.com', username: 'emilyr' },
  { full_name: 'David Williams', email: 'david.teacher@test.com', username: 'davidw' },
  { full_name: 'Lisa Anderson', email: 'lisa.teacher@test.com', username: 'lisaa' },
]

// Dummy student data
const dummyStudents = [
  { full_name: 'Emma Thompson', email: 'emma.student@test.com', username: 'emmat', gender: 'female' },
  { full_name: 'James Wilson', email: 'james.student@test.com', username: 'jamesw', gender: 'male' },
  { full_name: 'Olivia Brown', email: 'olivia.student@test.com', username: 'oliviab', gender: 'female' },
  { full_name: 'Noah Davis', email: 'noah.student@test.com', username: 'noahd', gender: 'male' },
  { full_name: 'Sophia Martinez', email: 'sophia.student@test.com', username: 'sophiam', gender: 'female' },
  { full_name: 'Liam Garcia', email: 'liam.student@test.com', username: 'liamg', gender: 'male' },
  { full_name: 'Ava Miller', email: 'ava.student@test.com', username: 'avam', gender: 'female' },
  { full_name: 'Mason Taylor', email: 'mason.student@test.com', username: 'masont', gender: 'male' },
  { full_name: 'Isabella Moore', email: 'isabella.student@test.com', username: 'isabellam', gender: 'female' },
  { full_name: 'Ethan Jackson', email: 'ethan.student@test.com', username: 'ethanj', gender: 'male' },
  { full_name: 'Mia White', email: 'mia.student@test.com', username: 'miaw', gender: 'female' },
  { full_name: 'Lucas Harris', email: 'lucas.student@test.com', username: 'lucash', gender: 'male' },
  { full_name: 'Charlotte Clark', email: 'charlotte.student@test.com', username: 'charlottec', gender: 'female' },
  { full_name: 'Alexander Lewis', email: 'alexander.student@test.com', username: 'alexanderl', gender: 'male' },
  { full_name: 'Amelia Walker', email: 'amelia.student@test.com', username: 'ameliaw', gender: 'female' },
]

// Dummy class data
const dummyClasses: Omit<CreateClassInput, 'church_id'>[] = [
  {
    name: 'Grade 1 - Sunday School',
    description: 'Introduction to Bible stories and Christian values for young children',
    grade_level: 'Grade 1',
    academic_year: '2024-2025',
    schedule: 'Sundays 10:00 AM - 11:00 AM',
    capacity: 20,
  },
  {
    name: 'Grade 2-3 - Sunday School',
    description: 'Building on foundational stories and beginning to explore deeper meanings',
    grade_level: 'Grade 2-3',
    academic_year: '2024-2025',
    schedule: 'Sundays 10:00 AM - 11:30 AM',
    capacity: 25,
  },
  {
    name: 'Grade 4-5 - Sunday School',
    description: 'Intermediate level class focusing on Bible study and Christian living',
    grade_level: 'Grade 4-5',
    academic_year: '2024-2025',
    schedule: 'Sundays 10:00 AM - 11:30 AM',
    capacity: 30,
  },
  {
    name: 'Youth Group (Grades 6-8)',
    description: 'Teen-focused class with discussions and activities',
    grade_level: 'Grade 6-8',
    academic_year: '2024-2025',
    schedule: 'Sundays 11:00 AM - 12:30 PM',
    capacity: 35,
  },
  {
    name: 'High School Bible Study',
    description: 'Advanced Bible study and Christian leadership for high school students',
    grade_level: 'Grade 9-12',
    academic_year: '2024-2025',
    schedule: 'Sundays 11:00 AM - 12:30 PM',
    capacity: 40,
  },
]

export interface SeedAllResult {
  success: boolean
  diocese?: { id: string; name: string }
  church?: { id: string; name: string }
  teachers: { created: number; users: Array<{ id: string; email: string; name: string }> }
  students: { created: number; users: Array<{ id: string; email: string; name: string }> }
  classes: { created: number; classes: Array<{ id: string; name: string }> }
  assignments: { teachers: number; students: number }
  errors: string[]
}

/**
 * Seed complete dummy data (diocese, church, users, classes, assignments)
 */
export async function seedAllDummyData(options?: {
  dioceseId?: string
  churchId?: string
  createDiocese?: boolean
  createChurch?: boolean
}): Promise<SeedAllResult> {
  const result: SeedAllResult = {
    success: true,
    teachers: { created: 0, users: [] },
    students: { created: 0, users: [] },
    classes: { created: 0, classes: [] },
    assignments: { teachers: 0, students: 0 },
    errors: [],
  }

  try {
    // Step 1: Ensure we have a diocese
    let dioceseId = options?.dioceseId
    if (!dioceseId && options?.createDiocese !== false) {
      const dioceses = await getDioceses()
      if (dioceses.length === 0) {
        // Create a dummy diocese
        try {
          const diocese = await createDiocese({
            name: 'Test Diocese',
            description: 'Dummy diocese for testing',
            location: 'Test City',
            contact_email: 'diocese@test.com',
            contact_phone: '123-456-7890',
          })
          dioceseId = diocese.id
          result.diocese = { id: diocese.id, name: diocese.name }
        } catch (error: any) {
          result.errors.push(`Failed to create diocese: ${error.message}`)
          throw new Error('Could not create or find diocese')
        }
      } else {
        dioceseId = dioceses[0].id
      }
    }

    // Step 2: Ensure we have a church
    let churchId = options?.churchId
    if (!churchId && options?.createChurch !== false) {
      const churches = await getChurches()
      const existingChurch = churches.find(c => c.diocese_id === dioceseId)
      
      if (!existingChurch) {
        // Create a dummy church
        try {
          const church = await createChurch({
            diocese_id: dioceseId!,
            name: 'St. Mary Test Church',
            description: 'Dummy church for testing',
            address: '123 Test Street',
            city: 'Test City',
            contact_email: 'church@test.com',
            contact_phone: '123-456-7890',
          })
          churchId = church.id
          result.church = { id: church.id, name: church.name }
        } catch (error: any) {
          result.errors.push(`Failed to create church: ${error.message}`)
          throw new Error('Could not create or find church')
        }
      } else {
        churchId = existingChurch.id
      }
    }

    if (!churchId) {
      throw new Error('No church available')
    }

    // Step 3: Create teachers
    const createdTeachers: Array<{ id: string; email: string; name: string }> = []
    const { getUserById } = await import('../sunday-school/users')
    
    for (const teacher of dummyTeachers) {
      try {
        const user = await createUser({
          email: teacher.email,
          password: DEFAULT_PASSWORD,
          role: 'teacher',
          username: teacher.username,
          full_name: teacher.full_name,
          church_id: churchId,
        })
        createdTeachers.push({
          id: user.id,
          email: user.email,
          name: user.full_name || user.email,
        })
        result.teachers.created++
      } catch (error: any) {
        // User might already exist, try to get existing user
        if (error.message?.includes('already exists') || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          // Try to find existing user by email
          const { getUsers } = await import('../sunday-school/users')
          const existingUsers = await getUsers({ churchId })
          const existingUser = existingUsers.find(u => u.email === teacher.email)
          
          if (existingUser) {
            // Update existing user to ensure correct church and role
            const { updateUser } = await import('../sunday-school/users')
            try {
              await updateUser(existingUser.id, {
                role: 'teacher',
                church_id: churchId,
                is_active: true,
              })
              createdTeachers.push({
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.full_name || existingUser.email,
              })
              result.teachers.created++
            } catch (updateError: any) {
              result.errors.push(`Teacher ${teacher.email} exists but failed to update: ${updateError.message}`)
            }
          } else {
            result.errors.push(`Teacher ${teacher.email} already exists but not found in database`)
          }
        } else {
          result.errors.push(`Failed to create teacher ${teacher.email}: ${error.message}`)
        }
      }
    }

    // Step 4: Create students
    const createdStudents: Array<{ id: string; email: string; name: string }> = []
    
    for (const student of dummyStudents) {
      try {
        const user = await createUser({
          email: student.email,
          password: DEFAULT_PASSWORD,
          role: 'student',
          username: student.username,
          full_name: student.full_name,
          church_id: churchId,
        })
        createdStudents.push({
          id: user.id,
          email: user.email,
          name: user.full_name || user.email,
        })
        result.students.created++
      } catch (error: any) {
        // User might already exist, try to get existing user
        if (error.message?.includes('already exists') || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          // Try to find existing user by email
          const { getUsers } = await import('../sunday-school/users')
          const existingUsers = await getUsers({ churchId })
          const existingUser = existingUsers.find(u => u.email === student.email)
          
          if (existingUser) {
            // Update existing user to ensure correct church and role
            const { updateUser } = await import('../sunday-school/users')
            try {
              await updateUser(existingUser.id, {
                role: 'student',
                church_id: churchId,
                is_active: true,
              })
              createdStudents.push({
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.full_name || existingUser.email,
              })
              result.students.created++
            } catch (updateError: any) {
              result.errors.push(`Student ${student.email} exists but failed to update: ${updateError.message}`)
            }
          } else {
            result.errors.push(`Student ${student.email} already exists but not found in database`)
          }
        } else {
          result.errors.push(`Failed to create student ${student.email}: ${error.message}`)
        }
      }
    }

    // Step 5: Create classes
    const createdClasses: Array<{ id: string; name: string }> = []
    for (const classData of dummyClasses) {
      try {
        const newClass = await createClass({
          ...classData,
          church_id: churchId,
        })
        createdClasses.push({
          id: newClass.id,
          name: newClass.name,
        })
        result.classes.created++
      } catch (error: any) {
        result.errors.push(`Failed to create class ${classData.name}: ${error.message}`)
      }
    }

    // Step 6: Assign teachers and students to classes
    if (createdClasses.length > 0 && (createdTeachers.length > 0 || createdStudents.length > 0)) {
      // Distribute teachers across classes (at least 1 teacher per class)
      for (let i = 0; i < createdClasses.length; i++) {
        const classItem = createdClasses[i]
        const teacherIndex = i % createdTeachers.length
        const teacher = createdTeachers[teacherIndex]
        
        try {
          await bulkAssignUsersToClass(classItem.id, [teacher.id], 'teacher')
          result.assignments.teachers++
        } catch (error: any) {
          result.errors.push(`Failed to assign teacher to ${classItem.name}: ${error.message}`)
        }
      }

      // Assign some teachers to multiple classes (for variety)
      if (createdClasses.length > 1 && createdTeachers.length > 1) {
        // Assign second teacher to first 2 classes
        if (createdTeachers.length > 1) {
          try {
            await bulkAssignUsersToClass(createdClasses[0].id, [createdTeachers[1].id], 'teacher')
            result.assignments.teachers++
          } catch (error: any) {
            // Ignore duplicate assignment errors
          }
        }
      }

      // Distribute students across classes
      const studentsPerClass = Math.floor(createdStudents.length / createdClasses.length)
      let studentIndex = 0

      for (let i = 0; i < createdClasses.length; i++) {
        const classItem = createdClasses[i]
        const studentsForClass: string[] = []
        
        // Assign students to this class
        const endIndex = i === createdClasses.length - 1 
          ? createdStudents.length // Last class gets remaining students
          : studentIndex + studentsPerClass

        for (let j = studentIndex; j < endIndex && j < createdStudents.length; j++) {
          studentsForClass.push(createdStudents[j].id)
        }

        if (studentsForClass.length > 0) {
          try {
            await bulkAssignUsersToClass(classItem.id, studentsForClass, 'student')
            result.assignments.students += studentsForClass.length
          } catch (error: any) {
            result.errors.push(`Failed to assign students to ${classItem.name}: ${error.message}`)
          }
        }

        studentIndex = endIndex
      }
    }

    result.teachers.users = createdTeachers
    result.students.users = createdStudents
    result.classes.classes = createdClasses

    if (result.errors.length > 0 && result.errors.length > (result.teachers.created + result.students.created + result.classes.created)) {
      result.success = false
    }

    return result
  } catch (error: any) {
    result.success = false
    result.errors.push(`Seed failed: ${error.message}`)
    return result
  }
}

/**
 * Get seed data summary
 */
export function getSeedDataSummary() {
  return {
    teachers: dummyTeachers.length,
    students: dummyStudents.length,
    classes: dummyClasses.length,
    totalUsers: dummyTeachers.length + dummyStudents.length,
    defaultPassword: DEFAULT_PASSWORD,
  }
}

