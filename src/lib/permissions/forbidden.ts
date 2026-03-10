export const FORBIDDEN_PERMISSION_CODES = ['admin.forbidden'] as const

export type ForbiddenPermissionCode = (typeof FORBIDDEN_PERMISSION_CODES)[number]

export function isForbiddenPermissionCode(code: string): code is ForbiddenPermissionCode {
  return (FORBIDDEN_PERMISSION_CODES as readonly string[]).includes(code)
}

export function hasForbiddenPermission(permissionCodes: string[]): boolean {
  return permissionCodes.some((c) => isForbiddenPermissionCode(c))
}

