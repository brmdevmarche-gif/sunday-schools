import { NextResponse } from 'next/server'

interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

interface ApiErrorResponse {
  success: false
  error: string
  details?: Record<string, string[]>
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data } satisfies ApiSuccessResponse<T>,
    { status }
  )
}

export function apiError(
  error: string,
  status = 500,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    { success: false, error, details } satisfies ApiErrorResponse,
    { status }
  )
}
