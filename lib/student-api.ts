export interface Student {
  id: string
  name: string
  class: string
  points: number
  botl: boolean
  status: "active" | "inactive"
  createdAt: string
}

export interface CreateStudentData {
  name: string
  class: string
  points?: number
  botl?: boolean
  status?: "active" | "inactive"
}

export interface UpdateStudentData {
  name?: string
  class?: string
  points?: number
  botl?: boolean
  status?: "active" | "inactive"
}

export class StudentAPI {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api"

  static async fetchStudents(): Promise<Student[]> {
    const response = await fetch(`${this.baseUrl}/students`)

    if (!response.ok) {
      throw new Error(`Failed to fetch students: ${response.statusText}`)
    }

    return response.json()
  }

  static async createStudent(data: CreateStudentData): Promise<Student> {
    const response = await fetch(`${this.baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create student: ${response.statusText}`)
    }

    return response.json()
  }

  static async updateStudent(id: string, data: UpdateStudentData): Promise<Student> {
    const response = await fetch(`${this.baseUrl}/students/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update student: ${response.statusText}`)
    }

    return response.json()
  }
}
