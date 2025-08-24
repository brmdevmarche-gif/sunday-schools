"use client"

import { useQuery } from "@tanstack/react-query"
import { ReportsAPI, type AttendanceReportParams } from "@/lib/reports-api"

// Hook to fetch attendance report with filtering
export function useAttendanceReport(classId?: string, dateRange = "last-30-days") {
  const params: AttendanceReportParams = { classId, dateRange }

  return useQuery({
    queryKey: ["reports", "attendance", classId, dateRange],
    queryFn: () => ReportsAPI.fetchAttendanceReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to fetch points leaderboard
export function usePointsLeaderboard() {
  return useQuery({
    queryKey: ["reports", "leaderboard"],
    queryFn: ReportsAPI.fetchPointsLeaderboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch activity summary
export function useActivitySummary() {
  return useQuery({
    queryKey: ["reports", "activities"],
    queryFn: ReportsAPI.fetchActivitySummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
