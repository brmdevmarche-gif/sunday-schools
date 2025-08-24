"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AuthAPI, type UserProfile } from "@/lib/auth-api"
import { useEffect } from "react"

interface UseAuthReturn {
  profile: UserProfile | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient()

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: AuthAPI.getProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Listen for session changes and refetch profile
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        // Token changed, refetch profile
        refetch()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page became visible, refetch to ensure fresh data
        refetch()
      }
    }

    // Listen for storage changes (token updates)
    window.addEventListener("storage", handleStorageChange)

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refetch])

  return {
    profile,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
