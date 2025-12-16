'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface CreateStudentInput {
  email: string
  password: string
  full_name: string
  diocese_id: string
  church_id: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  phone?: string
  address?: string
}

export interface UpdateStudentInput {
  full_name?: string
  diocese_id?: string
  church_id?: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  phone?: string
  address?: string
  is_active?: boolean
}

export interface AssignToClassInput {
  student_id: string
  class_id: string
}

export async function createStudentAction(input: CreateStudentInput) {
  // Use admin client for admin operations
  const adminClient = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })

  if (authError) {
    throw new Error(`Failed to create student account: ${authError.message}`)
  }

  // Wait a moment for the trigger to create the profile
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Update user profile
  const { error: updateError } = await adminClient
    .from('users')
    .update({
      full_name: input.full_name,
      role: 'student',
      diocese_id: input.diocese_id,
      church_id: input.church_id,
      date_of_birth: input.date_of_birth || null,
      gender: input.gender || null,
      phone: input.phone || null,
      address: input.address || null,
      is_active: true,
    })
    .eq('id', authData.user.id)

  if (updateError) {
    throw new Error(`Failed to update student profile: ${updateError.message}`)
  }

  revalidatePath('/admin/students')
  return { success: true, userId: authData.user.id }
}

export async function updateStudentAction(studentId: string, input: UpdateStudentInput) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update(input)
    .eq('id', studentId)

  if (error) {
    throw new Error(`Failed to update student: ${error.message}`)
  }

  revalidatePath('/admin/students')
  return { success: true }
}

export async function deleteStudentAction(studentId: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.admin.deleteUser(studentId)

  if (error) {
    throw new Error(`Failed to delete student: ${error.message}`)
  }

  revalidatePath('/admin/students')
  return { success: true }
}

export async function assignToClassAction(input: AssignToClassInput) {
  // Use admin client to bypass RLS for class assignments
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('class_assignments')
    .insert({
      class_id: input.class_id,
      user_id: input.student_id,
      assignment_type: 'student',
      is_active: true,
    })

  if (error) {
    throw new Error(`Failed to assign student to class: ${error.message}`)
  }

  revalidatePath('/admin/students')
  return { success: true }
}

export async function removeFromClassAction(studentId: string, classId: string) {
  // Use admin client to bypass RLS for class assignments
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('class_assignments')
    .delete()
    .eq('user_id', studentId)
    .eq('class_id', classId)
    .eq('assignment_type', 'student')

  if (error) {
    throw new Error(`Failed to remove student from class: ${error.message}`)
  }

  revalidatePath('/admin/students')
  return { success: true }
}
