'use server'

import { revalidatePath } from 'next/cache'
import {
  createRole,
  updateRole,
  deleteRole,
} from '@/lib/sunday-school/roles'
import type { CreateRoleInput, UpdateRoleInput } from '@/lib/types/modules/permissions'

export async function createRoleAction(input: CreateRoleInput) {
  try {
    const role = await createRole(input)
    revalidatePath('/admin/roles')
    return { success: true, data: role }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateRoleAction(
  id: string,
  input: UpdateRoleInput
) {
  try {
    const role = await updateRole(id, input)
    revalidatePath('/admin/roles')
    revalidatePath(`/admin/roles/${id}`)
    return { success: true, data: role }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteRoleAction(id: string) {
  try {
    await deleteRole(id)
    revalidatePath('/admin/roles')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
