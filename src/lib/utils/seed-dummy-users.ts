/**
 * Seed Dummy Users for Testing
 * 
 * This script creates dummy students and teachers for testing the classes module.
 * Run this from the admin panel or via API endpoint.
 */

import { createUser } from '../sunday-school/users'
import { getChurches } from '../sunday-school/churches'

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

const DEFAULT_PASSWORD = 'Test123456' // Default password for all dummy users

export interface SeedResult {
  success: boolean
  created: number
  failed: number
  errors: string[]
  users: Array<{ email: string; role: string; name: string }>
}

/**
 * Seed dummy teachers and students
 */
export async function seedDummyUsers(churchId?: string): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    created: 0,
    failed: 0,
    errors: [],
    users: [],
  }

  try {
    // Get churches if churchId not provided
    let targetChurchId = churchId
    if (!targetChurchId) {
      const churches = await getChurches()
      if (churches.length === 0) {
        throw new Error('No churches found. Please create a church first.')
      }
      // Use the first church
      targetChurchId = churches[0].id
    }

    // Create teachers
    for (const teacher of dummyTeachers) {
      try {
        const user = await createUser({
          email: teacher.email,
          password: DEFAULT_PASSWORD,
          role: 'teacher',
          username: teacher.username,
          full_name: teacher.full_name,
          church_id: targetChurchId,
        })
        result.created++
        result.users.push({
          email: user.email,
          role: 'teacher',
          name: user.full_name || user.email,
        })
      } catch (error: any) {
        result.failed++
        result.errors.push(`Failed to create teacher ${teacher.email}: ${error.message}`)
        console.error(`Error creating teacher ${teacher.email}:`, error)
      }
    }

    // Create students
    for (const student of dummyStudents) {
      try {
        const user = await createUser({
          email: student.email,
          password: DEFAULT_PASSWORD,
          role: 'student',
          username: student.username,
          full_name: student.full_name,
          church_id: targetChurchId,
        })
        result.created++
        result.users.push({
          email: user.email,
          role: 'student',
          name: user.full_name || user.email,
        })
      } catch (error: any) {
        result.failed++
        result.errors.push(`Failed to create student ${student.email}: ${error.message}`)
        console.error(`Error creating student ${student.email}:`, error)
      }
    }

    if (result.failed > 0) {
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
 * Get seed data info (for display purposes)
 */
export function getSeedDataInfo() {
  return {
    teachers: dummyTeachers.length,
    students: dummyStudents.length,
    total: dummyTeachers.length + dummyStudents.length,
    defaultPassword: DEFAULT_PASSWORD,
    teachersList: dummyTeachers,
    studentsList: dummyStudents,
  }
}

