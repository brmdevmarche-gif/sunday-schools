export interface Trip {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  price_cash: number
  price_points: number
  max_participants?: number
  current_participants: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface CreateTripData {
  title: string
  description: string
  start_date: string
  end_date: string
  price_cash: number
  price_points: number
  max_participants?: number
}

export interface UpdateTripData {
  title?: string
  description?: string
  start_date?: string
  end_date?: string
  price_cash?: number
  price_points?: number
  max_participants?: number
  status?: "upcoming" | "ongoing" | "completed" | "cancelled"
}

export interface BookTripData {
  trip_id: string
  payment_method: "cash" | "points"
  student_id?: string // Optional if derived from auth context
}

export interface TripBooking {
  id: string
  trip_id: string
  student_id: string
  payment_method: "cash" | "points"
  amount_paid: number
  booking_date: string
  status: "confirmed" | "pending" | "cancelled"
}

export const TripAPI = {
  // Fetch all trips
  async fetchTrips(): Promise<Trip[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/trips`)
    if (!response.ok) {
      throw new Error(`Failed to fetch trips: ${response.statusText}`)
    }
    return response.json()
  },

  // Create a new trip
  async createTrip(data: CreateTripData): Promise<Trip> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create trip" }))
      throw new Error(error.message || "Failed to create trip")
    }

    return response.json()
  },

  // Update an existing trip
  async updateTrip(id: string, data: UpdateTripData): Promise<Trip> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/trips/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update trip" }))
      throw new Error(error.message || "Failed to update trip")
    }

    return response.json()
  },

  // Book a trip
  async bookTrip(data: BookTripData): Promise<TripBooking> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/trips/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to book trip" }))
      throw new Error(error.message || "Failed to book trip")
    }

    return response.json()
  },

  // Fetch trip bookings
  async fetchTripBookings(tripId: string): Promise<TripBooking[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/trips/${tripId}/bookings`)
    if (!response.ok) {
      throw new Error(`Failed to fetch trip bookings: ${response.statusText}`)
    }
    return response.json()
  },
}
