import { NextRequest, NextResponse } from 'next/server'
import { seedAllDummyData } from '@/lib/utils/seed-all-dummy-data'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dioceseId, churchId, createDiocese, createChurch } = body

    const result = await seedAllDummyData({
      dioceseId,
      churchId,
      createDiocese: createDiocese !== false, // Default to true
      createChurch: createChurch !== false, // Default to true
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully seeded complete dummy data!`,
        ...result,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Seeded data with some errors`,
          ...result,
        },
        { status: 207 } // Multi-Status
      )
    }
  } catch (error: any) {
    console.error('Error seeding all dummy data:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed dummy data' },
      { status: 500 }
    )
  }
}

