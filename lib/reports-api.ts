export interface AttendanceRecord {
  id: string
  name: string
  class: string
  totalDays: number
  presentDays: number
  attendanceRate: number
}

export interface LeaderboardEntry {
  id: string
  name: string
  class: string
  points: number
  rank: number
}

export interface ActivitySummary {
  type: string
  count: number
  color: string
}

export interface AttendanceReportParams {
  classId?: string
  dateRange: string
}

export class ReportsAPI {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api"

  static async fetchAttendanceReport(params: AttendanceReportParams): Promise<AttendanceRecord[]> {
    const searchParams = new URLSearchParams()
    if (params.classId && params.classId !== "all") {
      searchParams.append("classId", params.classId)
    }
    searchParams.append("dateRange", params.dateRange)

    const response = await fetch(`${this.baseUrl}/reports/attendance?${searchParams}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance report: ${response.statusText}`)
    }

    return response.json()
  }

  static async fetchPointsLeaderboard(): Promise<LeaderboardEntry[]> {
    const response = await fetch(`${this.baseUrl}/reports/leaderboard`)

    if (!response.ok) {
      throw new Error(`Failed to fetch points leaderboard: ${response.statusText}`)
    }

    return response.json()
  }

  static async fetchActivitySummary(): Promise<ActivitySummary[]> {
    const response = await fetch(`${this.baseUrl}/reports/activities`)

    if (!response.ok) {
      throw new Error(`Failed to fetch activity summary: ${response.statusText}`)
    }

    return response.json()
  }
}
