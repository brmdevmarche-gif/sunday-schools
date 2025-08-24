export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  class?: string
  points?: number
  botl?: boolean
  status: "active" | "inactive"
  createdAt: string
}

export class AuthAPI {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api"

  static async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Include auth token from localStorage or cookies
        Authorization: `Bearer ${this.getToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user profile")
    }

    return response.json()
  }

  private static getToken(): string | null {
    // Get token from localStorage, cookies, or session storage
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }
}
