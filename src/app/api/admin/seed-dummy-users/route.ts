import { NextRequest, NextResponse } from 'next/server'
import { seedDummyUsers } from '@/lib/utils/seed-dummy-users'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { churchId } = body

    const result = await seedDummyUsers(churchId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully created ${result.created} users`,
        ...result,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Created ${result.created} users, but ${result.failed} failed`,
          ...result,
        },
        { status: 207 } // Multi-Status
      )
    }
  } catch (error: any) {
    console.error('Error seeding dummy users:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed dummy users' },
      { status: 500 }
    )
  }
}

