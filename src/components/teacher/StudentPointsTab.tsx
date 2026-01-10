"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Star,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PointTransaction {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
  sourceType: string;
}

interface PointsData {
  availablePoints: number;
  suspendedPoints: number;
  totalEarned: number;
  transactions: PointTransaction[];
}

interface StudentPointsTabProps {
  studentId: string;
  className?: string;
}

/**
 * StudentPointsTab - Points information tab for StudentDrawer
 */
function StudentPointsTab({ studentId, className }: StudentPointsTabProps) {
  const t = useTranslations("teacher.studentDrawer");
  const [loading, setLoading] = React.useState(true);
  const [pointsData, setPointsData] = React.useState<PointsData | null>(null);

  React.useEffect(() => {
    async function fetchPoints() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/teacher/students/${studentId}/points`
        );
        if (response.ok) {
          const data = await response.json();
          setPointsData(data);
        }
      } catch (error) {
        console.error("Error fetching points:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, [studentId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  // Use placeholder data if API not available
  const data = pointsData || {
    availablePoints: 0,
    suspendedPoints: 0,
    totalEarned: 0,
    transactions: [],
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Points Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
              <Star className="h-4 w-4" aria-hidden="true" />
              <span className="text-xl font-bold">{data.availablePoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("available")}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400 mb-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="text-xl font-bold">{data.suspendedPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("suspended")}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              <span className="text-xl font-bold">{data.totalEarned}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("totalEarned")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div>
        <h4 className="text-sm font-medium mb-3">{t("recentTransactions")}</h4>
        {data.transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noTransactions")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      transaction.points > 0
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {transaction.points > 0 ? (
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {transaction.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-bold",
                      transaction.points > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {transaction.points > 0 ? "+" : ""}
                    {transaction.points}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { StudentPointsTab };
