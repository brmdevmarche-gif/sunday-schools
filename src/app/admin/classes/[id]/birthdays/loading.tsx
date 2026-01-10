import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BirthdaysLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 me-2" />
            <Skeleton className="h-4 w-12" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-9 w-32" />
            </div>
            <Skeleton className="h-5 w-48 mt-2" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-7 w-12 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Months Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
