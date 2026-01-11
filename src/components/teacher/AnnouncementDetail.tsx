"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Megaphone, BookOpen, AlertTriangle, Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { AnnouncementType } from "./AnnouncementCard";

const typeConfig: Record<
  AnnouncementType,
  { icon: typeof Megaphone; color: string; bgColor: string; label: string }
> = {
  general: {
    icon: Megaphone,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "General",
  },
  class: {
    icon: BookOpen,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Class",
  },
  urgent: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Urgent",
  },
};

export interface AnnouncementDetailData {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  sender?: {
    name: string;
    avatarUrl?: string | null;
  };
  publishedAt: string | Date;
  expiresAt?: string | Date | null;
}

export interface AnnouncementDetailProps {
  /** Announcement data */
  announcement: AnnouncementDetailData | null;
  /** Loading state */
  loading?: boolean;
  /** Called when back button is clicked */
  onBack: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * AnnouncementDetail - Displays full announcement content.
 * Shows complete content with sender info and metadata.
 *
 * @example
 * ```tsx
 * <AnnouncementDetail
 *   announcement={announcement}
 *   onBack={() => router.back()}
 * />
 * ```
 */
function AnnouncementDetail({
  announcement,
  loading = false,
  onBack,
  className,
}: AnnouncementDetailProps) {
  const t = useTranslations("teacher.announcements");

  if (loading) {
    return <AnnouncementDetailSkeleton className={className} />;
  }

  if (!announcement) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2 rtl:rotate-180" />
          {t("backToList")}
        </Button>
      </div>
    );
  }

  const config = typeConfig[announcement.type];
  const Icon = config.icon;

  const formatDate = (date: string | Date) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div data-slot="announcement-detail" className={cn("space-y-4", className)}>
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("backToList")}
      </Button>

      {/* Announcement Card */}
      <Card
        className={cn(
          announcement.type === "urgent" && "border-l-4 border-l-red-500"
        )}
      >
        <CardHeader className="pb-3">
          {/* Type Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-full", config.bgColor)}>
                <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
              </div>
              <Badge
                variant={announcement.type === "urgent" ? "destructive" : "secondary"}
              >
                {t(announcement.type)}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold">{announcement.title}</h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            {announcement.sender && (
              <div className="flex items-center gap-2">
                <OptimizedAvatar
                  src={announcement.sender.avatarUrl}
                  alt={announcement.sender.name}
                  fallback={getInitials(announcement.sender.name)}
                  size="sm"
                  className="h-8 w-8"
                />
                <div>
                  <p className="font-medium text-foreground">
                    {announcement.sender.name}
                  </p>
                  <p className="text-xs">{t("author")}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{formatDate(announcement.publishedAt)}</span>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {/* Content - supports basic HTML/markdown rendering */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          {/* Expiration notice */}
          {announcement.expiresAt && (
            <div className="mt-6 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              {t("expiresOn", { date: formatDate(announcement.expiresAt) })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * AnnouncementDetailSkeleton - Loading state for AnnouncementDetail
 */
function AnnouncementDetailSkeleton({ className }: { className?: string }) {
  return (
    <div data-slot="announcement-detail-skeleton" className={cn("space-y-4", className)}>
      <Skeleton className="h-9 w-24" />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-7 w-3/4" />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

export { AnnouncementDetail, AnnouncementDetailSkeleton };
