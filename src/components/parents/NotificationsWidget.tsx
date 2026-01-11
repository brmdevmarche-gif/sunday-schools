"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Bus,
  Award,
  Star,
  Calendar,
  Megaphone,
  Clock,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from "@/app/dashboard/parents/actions";
import type { Notification, NotificationType } from "@/lib/types";

interface NotificationsWidgetProps {
  notifications: Notification[];
  unreadCount: number;
  compact?: boolean;
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  trip_approval_needed: Bus,
  trip_status_changed: Bus,
  payment_reminder: Calendar,
  announcement: Megaphone,
  attendance_marked: Calendar,
  badge_earned: Award,
  points_awarded: Star,
  activity_reminder: Clock,
  general: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  trip_approval_needed: "text-orange-500",
  trip_status_changed: "text-blue-500",
  payment_reminder: "text-red-500",
  announcement: "text-purple-500",
  attendance_marked: "text-green-500",
  badge_earned: "text-amber-500",
  points_awarded: "text-amber-500",
  activity_reminder: "text-blue-500",
  general: "text-gray-500",
};

export function NotificationsWidget({
  notifications,
  unreadCount,
  compact = false,
}: NotificationsWidgetProps) {
  const t = useTranslations("parents.notifications");
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    return t("daysAgo", { count: diffDays });
  };

  const handleMarkRead = async (notificationId: string) => {
    setProcessingId(notificationId);
    const result = await markNotificationReadAction(notificationId);
    if (result.success) {
      router.refresh();
    }
    setProcessingId(null);
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    const result = await markAllNotificationsReadAction();
    if (result.success) {
      toast.success(t("markAllRead"));
      router.refresh();
    }
    setMarkingAllRead(false);
  };

  const handleDelete = async (notificationId: string) => {
    setProcessingId(notificationId);
    const result = await deleteNotificationAction(notificationId);
    if (result.success) {
      router.refresh();
    }
    setProcessingId(null);
  };

  const displayNotifications = compact
    ? notifications.slice(0, 5)
    : notifications;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("title")}
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t("markAllRead")}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">{t("noNotifications")}</p>
            <p className="text-sm mt-1">{t("noNotificationsDescription")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const colorClass =
                notificationColors[notification.type] || "text-gray-500";
              const isUnread = !notification.read_at;

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isUnread
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-full bg-background shrink-0 ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        isUnread ? "font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMarkRead(notification.id)}
                        disabled={processingId === notification.id}
                      >
                        {processingId === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(notification.id)}
                      disabled={processingId === notification.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {compact && notifications.length > 5 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/dashboard/parents/notifications")}
              >
                {t("viewDetails")} ({notifications.length - 5} more)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
