"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Megaphone, BookOpen, AlertTriangle, ChevronRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export type AnnouncementType = "general" | "class" | "urgent";

const announcementCardVariants = cva(
  "transition-all hover:shadow-md cursor-pointer active:scale-[0.99]",
  {
    variants: {
      type: {
        general: "",
        class: "",
        urgent: "border-l-4 border-l-red-500",
      },
      isRead: {
        true: "opacity-80",
        false: "",
      },
    },
    defaultVariants: {
      type: "general",
      isRead: false,
    },
  }
);

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

export interface AnnouncementCardProps
  extends VariantProps<typeof announcementCardVariants> {
  /** Unique announcement ID */
  id: string;
  /** Announcement title */
  title: string;
  /** Preview/description text */
  preview?: string | null;
  /** Announcement type */
  type: AnnouncementType;
  /** Whether the announcement has been read */
  isRead: boolean;
  /** Sender information */
  sender?: {
    name: string;
    avatarUrl?: string | null;
  };
  /** Publication date */
  publishedAt: string | Date;
  /** Called when the card is clicked */
  onClick?: (id: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * AnnouncementCard - Displays an announcement in a list.
 * Shows title, preview, sender, and visual distinction for unread/urgent items.
 *
 * @example
 * ```tsx
 * <AnnouncementCard
 *   id="1"
 *   title="Important Update"
 *   preview="Please read this..."
 *   type="urgent"
 *   isRead={false}
 *   sender={{ name: "Admin", avatarUrl: "/path/to/avatar.jpg" }}
 *   publishedAt={new Date()}
 *   onClick={(id) => openAnnouncement(id)}
 * />
 * ```
 */
function AnnouncementCard({
  id,
  title,
  preview,
  type,
  isRead,
  sender,
  publishedAt,
  onClick,
  className,
}: AnnouncementCardProps) {
  const t = useTranslations("teacher.announcements");
  const config = typeConfig[type];
  const Icon = config.icon;

  const formatDate = (date: string | Date) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) return t("justNow");
      if (diffHours < 24) return t("hoursAgo", { hours: diffHours });
      if (diffDays < 7) return t("daysAgo", { days: diffDays });
      return d.toLocaleDateString();
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

  const handleClick = () => {
    onClick?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      data-slot="announcement-card"
      className={cn(announcementCardVariants({ type, isRead }), className)}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${title}${!isRead ? ` (${t("unread")})` : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Unread indicator */}
          {!isRead && (
            <div className="shrink-0 mt-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
            </div>
          )}

          {/* Type Icon */}
          <div
            className={cn(
              "shrink-0 p-2 rounded-full",
              config.bgColor
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "font-medium text-sm line-clamp-2",
                  !isRead && "font-semibold"
                )}
              >
                {title}
              </h3>
              {type === "urgent" && (
                <Badge variant="destructive" className="shrink-0 text-xs">
                  {t("urgent")}
                </Badge>
              )}
            </div>

            {/* Preview */}
            {preview && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {preview}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {sender && (
                <div className="flex items-center gap-1.5">
                  <OptimizedAvatar
                    src={sender.avatarUrl}
                    alt={sender.name}
                    fallback={getInitials(sender.name)}
                    size="xs"
                    className="h-5 w-5"
                  />
                  <span className="truncate max-w-[100px]">{sender.name}</span>
                </div>
              )}
              <span>•</span>
              <span>{formatDate(publishedAt)}</span>
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight
            className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180"
            aria-hidden="true"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AnnouncementCardSkeleton - Loading state for AnnouncementCard
 */
function AnnouncementCardSkeleton({ className }: { className?: string }) {
  return (
    <Card data-slot="announcement-card-skeleton" className={className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-5 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export { AnnouncementCard, AnnouncementCardSkeleton, announcementCardVariants, typeConfig as announcementTypeConfig };
