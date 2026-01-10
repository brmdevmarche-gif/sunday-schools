import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      {/* Header - stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Filters Card - hidden on mobile (filters collapse to sheet) */}
      <Card className="hidden sm:block">
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Filter button skeleton */}
      <div className="sm:hidden">
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Users by Role Accordion */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
                <div className="border-t p-4">
                  <div className="space-y-3">
                    {/* Desktop: Row layout */}
                    <div className="hidden sm:block space-y-3">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="flex items-center gap-4 p-3 border rounded-lg"
                        >
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-40 flex-1" />
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <div className="flex gap-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Mobile: Card layout */}
                    <div className="sm:hidden space-y-3">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="space-y-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                          <div className="flex gap-2 pt-2 border-t">
                            <Skeleton className="h-9 w-9" />
                            <Skeleton className="h-9 w-9" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
