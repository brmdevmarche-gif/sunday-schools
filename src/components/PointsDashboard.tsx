"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coins,
  Clock,
  ShoppingBag,
  Trophy,
  Calendar,
  Bus,
  UserCheck,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { getStudentPointsSummaryAction } from "@/app/admin/points/actions";
import type { StudentPointsSummary, PointsTransaction } from "@/lib/types";

interface PointsDashboardProps {
  userId: string;
}

export default function PointsDashboard({ userId }: PointsDashboardProps) {
  const t = useTranslations();
  const [summary, setSummary] = useState<StudentPointsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPoints() {
      try {
        const data = await getStudentPointsSummaryAction(userId);
        setSummary(data);
      } catch (err) {
        console.error("Failed to fetch points:", err);
        setError("Failed to load points");
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return null; // Don't show anything if points system isn't set up
  }

  const balance = summary.balance;

  function getTransactionIcon(type: string) {
    switch (type) {
      case "activity_completion":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "attendance":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "trip_participation":
        return <Bus className="h-4 w-4 text-blue-500" />;
      case "teacher_adjustment":
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case "store_order_pending":
      case "store_order_approved":
        return <ShoppingBag className="h-4 w-4 text-orange-500" />;
      case "store_order_cancelled":
      case "store_order_rejected":
        return <ShoppingBag className="h-4 w-4 text-gray-500" />;
      default:
        return <Coins className="h-4 w-4 text-gray-500" />;
    }
  }

  function getTransactionLabel(type: string): string {
    switch (type) {
      case "activity_completion":
        return t("points.activityCompletion");
      case "activity_revocation":
        return t("points.activityRevocation");
      case "attendance":
        return t("points.attendance");
      case "trip_participation":
        return t("points.tripParticipation");
      case "teacher_adjustment":
        return t("points.teacherAdjustment");
      case "store_order_pending":
        return t("points.orderPending");
      case "store_order_approved":
        return t("points.orderApproved");
      case "store_order_cancelled":
        return t("points.orderCancelled");
      case "store_order_rejected":
        return t("points.orderRejected");
      default:
        return type;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          {t("points.myPoints")}
        </CardTitle>
        <CardDescription>{t("points.pointsOverview")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {t("points.available")}
              </span>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {balance?.available_points || 0}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                {t("points.suspended")}
              </span>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {balance?.suspended_points || 0}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {t("points.used")}
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {balance?.used_points || 0}
            </p>
          </div>
        </div>

        {/* Points by Source */}
        <div>
          <h4 className="text-sm font-medium mb-3">{t("points.earnedFrom")}</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              {t("points.activities")}: {summary.points_by_type.activity}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3 text-green-500" />
              {t("points.attendanceLabel")}: {summary.points_by_type.attendance}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Bus className="h-3 w-3 text-blue-500" />
              {t("points.trips")}: {summary.points_by_type.trips}
            </Badge>
            {summary.points_by_type.adjustments !== 0 && (
              <Badge variant="outline" className="gap-1">
                <UserCheck className="h-3 w-3 text-purple-500" />
                {t("points.adjustments")}: {summary.points_by_type.adjustments}
              </Badge>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        {summary.recent_transactions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">{t("points.recentTransactions")}</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {summary.recent_transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <p className="text-sm font-medium">
                        {getTransactionLabel(tx.transaction_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.created_at)}
                        {tx.notes && ` - ${tx.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {tx.points > 0 ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    ) : tx.points < 0 ? (
                      <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span
                      className={`font-semibold ${
                        tx.points > 0
                          ? "text-green-600"
                          : tx.points < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {tx.points > 0 ? "+" : ""}
                      {tx.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Stats */}
        <div className="pt-4 border-t flex justify-between text-sm text-muted-foreground">
          <span>
            {t("points.totalEarned")}: <strong>{balance?.total_earned || 0}</strong>
          </span>
          <span>
            {t("points.totalDeducted")}: <strong>{balance?.total_deducted || 0}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
