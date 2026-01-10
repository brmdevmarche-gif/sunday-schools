import { Skeleton } from "@/components/ui/skeleton";
import {
  StatCardSkeleton,
  QuickAttendanceButtonSkeleton,
  ActionRequiredCardSkeleton,
} from "@/components/teacher";

export default function TeacherDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <Skeleton className="h-6 w-24" />
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Welcome Banner Skeleton */}
        <div className="rounded-xl bg-muted/50 p-6 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Quick Attendance Button Skeleton */}
        <QuickAttendanceButtonSkeleton />

        {/* Action Required Section Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-2">
            <ActionRequiredCardSkeleton />
            <ActionRequiredCardSkeleton />
          </div>
        </div>
      </main>

      {/* Bottom Nav Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="flex h-16 items-center justify-around px-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
