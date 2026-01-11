"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Bus,
  Trophy,
  Activity,
  Check,
  X,
  Loader2,
  UserCircle,
  Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export type ApprovalType = "trip" | "competition" | "activity";

export interface ApprovalCardProps {
  /** Unique ID for the approval request */
  id: string;
  /** Type of approval */
  type: ApprovalType;
  /** Student information */
  student: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  /** Title of the request (e.g., trip name, competition name) */
  title: string;
  /** Optional subtitle (e.g., date, category) */
  subtitle?: string;
  /** When the request was made */
  requestedAt: string | Date;
  /** Whether the request was initiated by a parent */
  parentInitiated?: boolean;
  /** Called when approve button is clicked */
  onApprove: () => Promise<void>;
  /** Called when reject button is clicked, with optional reason */
  onReject: (reason?: string) => Promise<void>;
  /** Called when student info is clicked */
  onStudentClick?: () => void;
  /** Additional class names */
  className?: string;
}

const typeConfig = {
  trip: {
    icon: Bus,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  competition: {
    icon: Trophy,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  activity: {
    icon: Activity,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
};

/**
 * ApprovalCard - Displays a pending approval request with action buttons.
 * Used in the Action Required queue for teachers.
 */
function ApprovalCard({
  id,
  type,
  student,
  title,
  subtitle,
  requestedAt,
  parentInitiated = false,
  onApprove,
  onReject,
  onStudentClick,
  className,
}: ApprovalCardProps) {
  const t = useTranslations("teacher.actionRequired");
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [actionResult, setActionResult] = React.useState<"approved" | "rejected" | null>(null);

  const config = typeConfig[type];
  const Icon = config.icon;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | Date) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return "just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
      setActionResult("approved");
    } catch (error) {
      console.error("Error approving:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
      setActionResult("rejected");
    } catch (error) {
      console.error("Error rejecting:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const isProcessing = isApproving || isRejecting;

  // If action completed, show success state briefly then hide
  if (actionResult) {
    return (
      <Card
        data-slot="approval-card"
        className={cn(
          "transition-all duration-300 opacity-50",
          actionResult === "approved" && "bg-green-50 dark:bg-green-900/20",
          actionResult === "rejected" && "bg-red-50 dark:bg-red-900/20",
          className
        )}
      >
        <CardContent className="flex items-center justify-center gap-2 p-4">
          {actionResult === "approved" ? (
            <>
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-medium">{t("approved")}</span>
            </>
          ) : (
            <>
              <X className="h-5 w-5 text-red-600" />
              <span className="text-red-600 font-medium">{t("rejected")}</span>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-slot="approval-card"
      className={cn(
        "transition-all hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Student Avatar */}
          <button
            type="button"
            onClick={onStudentClick}
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            aria-label={`${t("viewStudent")}: ${student.name}`}
          >
            <OptimizedAvatar
              src={student.avatarUrl}
              alt={student.name}
              fallback={getInitials(student.name)}
              size="md"
              className="h-12 w-12"
            />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={onStudentClick}
                  className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:underline truncate block text-left"
                >
                  {student.name}
                </button>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={cn("flex items-center gap-1", config.color)}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="text-sm">{title}</span>
                  </div>
                </div>
              </div>

              {/* Type badge */}
              <div className={cn("p-1.5 rounded-full shrink-0", config.bgColor)}>
                <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
              </div>
            </div>

            {/* Subtitle and meta */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
              {subtitle && <span>{subtitle}</span>}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatDate(requestedAt)}
              </span>
              {parentInitiated && (
                <Badge variant="secondary" className="text-xs">
                  <UserCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                  {t("parentRequested")}
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                onClick={handleApprove}
                disabled={isProcessing}
                className="min-h-10 flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" aria-hidden="true" />
                    {t("approve")}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={isProcessing}
                className="min-h-10 flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" aria-hidden="true" />
                    {t("reject")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ApprovalCardSkeleton - Loading state for ApprovalCard
 */
function ApprovalCardSkeleton({ className }: { className?: string }) {
  return (
    <Card data-slot="approval-card-skeleton" className={className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2 mt-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ApprovalCard, ApprovalCardSkeleton, typeConfig as approvalTypeConfig };
