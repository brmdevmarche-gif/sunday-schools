import { ArrowLeft } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  TeacherBottomNav,
  TeacherBottomNavSpacer,
  AnnouncementCardSkeleton,
} from "@/components/teacher";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </div>
          <Skeleton className="h-6 w-36" />
        </div>
      </header>

      <main className="container px-4 py-6 space-y-4">
        {/* Filter Chips Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>

        {/* Announcement Cards Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <AnnouncementCardSkeleton key={i} />
          ))}
        </div>
      </main>

      <TeacherBottomNav
        pendingCount={0}
        unreadAnnouncementsCount={0}
        isOrganizingTrips={false}
      />
      <TeacherBottomNavSpacer />
    </div>
  );
}
