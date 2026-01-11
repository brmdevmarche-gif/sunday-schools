import { Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalCardSkeleton } from "@/components/teacher";

export default function ActionRequiredLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Filter chips skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Cards skeleton */}
        <div className="space-y-3">
          <ApprovalCardSkeleton />
          <ApprovalCardSkeleton />
          <ApprovalCardSkeleton />
        </div>
      </main>
    </div>
  );
}
