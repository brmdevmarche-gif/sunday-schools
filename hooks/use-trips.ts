"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { TripAPI, type Trip, type CreateTripData, type UpdateTripData, type BookTripData } from "@/lib/trip-api"
import { toast } from "@/hooks/use-toast"

// Hook to fetch all trips
export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: TripAPI.fetchTrips,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new trip
export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTripData) => TripAPI.createTrip(data),
    onSuccess: (newTrip) => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: ["trips"] })

      toast({
        title: "Trip Created",
        description: `${newTrip.title} has been added successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create trip.",
        variant: "destructive",
      })
    },
  })
}

// Hook to update an existing trip
export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripData }) => TripAPI.updateTrip(id, data),
    onSuccess: (updatedTrip) => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: ["trips"] })

      // Also invalidate individual trip if it exists
      queryClient.invalidateQueries({ queryKey: ["trips", updatedTrip.id] })

      toast({
        title: "Trip Updated",
        description: `${updatedTrip.title} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trip.",
        variant: "destructive",
      })
    },
  })
}

// Hook to book a trip
export function useBookTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BookTripData) => TripAPI.bookTrip(data),
    onSuccess: (booking) => {
      // Invalidate trips list to update participant counts
      queryClient.invalidateQueries({ queryKey: ["trips"] })

      // Invalidate specific trip data
      queryClient.invalidateQueries({ queryKey: ["trips", booking.trip_id] })

      // Invalidate trip bookings
      queryClient.invalidateQueries({ queryKey: ["trip-bookings", booking.trip_id] })

      // Invalidate user's bookings if applicable
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] })

      toast({
        title: "Trip Booked",
        description: `Your trip booking has been confirmed! Payment method: ${booking.payment_method}.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book trip. Please try again.",
        variant: "destructive",
      })
    },
  })
}

// Hook to fetch a single trip by ID
export function useTrip(id: string) {
  return useQuery({
    queryKey: ["trips", id],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/trips/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch trip: ${response.statusText}`)
      }
      return response.json() as Promise<Trip>
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch trip bookings
export function useTripBookings(tripId: string) {
  return useQuery({
    queryKey: ["trip-bookings", tripId],
    queryFn: () => TripAPI.fetchTripBookings(tripId),
    enabled: !!tripId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}
