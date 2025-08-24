"use client"

import { useQuery } from "@tanstack/react-query"
import { ActivitiesAPI, type Activity } from "@/lib/activity-api"
import { useMemo } from "react"

interface UseStudentPointsReturn {
  totalPoints: number
  activities: Activity[]
  isLoading: boolean
  error: Error | null
}

export function useStudentPoints(studentId: string): UseStudentPointsReturn {
  const {
    data: activities = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["activities", studentId],
    queryFn: () => ActivitiesAPI.fetchActivities(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const totalPoints = useMemo(() => {
    return activities.reduce((sum, activity) => sum + activity.points, 0)
  }, [activities])

  return {
    totalPoints,
    activities,
    isLoading,
    error,
  }
}
