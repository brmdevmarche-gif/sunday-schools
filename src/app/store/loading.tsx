import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreLoading() {
  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" disabled>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>

      {/* Points Display Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <Skeleton className="h-4 w-28 mx-auto mb-2" />
            <Skeleton className="h-7 w-20 mx-auto" />
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 max-w-md" />
        </div>

        {/* Store Items Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="flex flex-col pt-0">
              <Skeleton className="aspect-square rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
