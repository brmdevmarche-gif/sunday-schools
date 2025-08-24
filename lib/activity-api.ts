export interface Activity {
  id: string
  studentId: string
  activity: string
  date: string
  points: number
  category?: "bible_reading" | "mass" | "fast" | "other"
}

export class ActivitiesAPI {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api"

  static async fetchActivities(studentId: string): Promise<Activity[]> {
    const response = await fetch(`${this.baseUrl}/students/${studentId}/activities`)

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`)
    }

    return response.json()
  }
}
