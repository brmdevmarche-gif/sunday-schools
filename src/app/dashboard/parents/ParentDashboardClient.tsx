"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  ChildCard,
  ChildActionSheet,
  PendingApprovalsWidget,
  NotificationsWidget,
} from "@/components/parents";
import { Users, AlertCircle, Bell } from "lucide-react";
import type {
  ParentChild,
  PendingApproval,
  Notification,
} from "@/lib/types";

interface ParentDashboardClientProps {
  parentName: string | null;
  parentAvatar: string | null;
  children: ParentChild[];
  pendingApprovals: PendingApproval[];
  notifications: Notification[];
  unreadNotificationsCount: number;
}

export function ParentDashboardClient({
  parentName,
  parentAvatar,
  children,
  pendingApprovals,
  notifications,
  unreadNotificationsCount,
}: ParentDashboardClientProps) {
  const t = useTranslations("parents");
  const [selectedChild, setSelectedChild] = useState<ParentChild | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const handleChildClick = (child: ParentChild) => {
    setSelectedChild(child);
    setIsActionSheetOpen(true);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        <OptimizedAvatar
          src={parentAvatar}
          alt={parentName || "Parent"}
          fallback={getInitials(parentName)}
          size="lg"
          className="h-16 w-16 border-2 border-primary/10"
          fallbackClassName="text-lg bg-primary/10 text-primary"
        />
        <div>
          <p className="text-muted-foreground">{t("dashboard.welcome")}</p>
          <h1 className="text-2xl font-bold">{parentName || "Parent"}</h1>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{children.length}</p>
                <p className="text-sm text-muted-foreground">
                  {t("children.title")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                <p className="text-sm text-muted-foreground">
                  {t("approvals.title")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Bell className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadNotificationsCount}</p>
                <p className="text-sm text-muted-foreground">
                  {t("notifications.unread")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Children */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("children.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">{t("dashboard.noChildren")}</p>
                  <p className="text-sm mt-1">
                    {t("dashboard.noChildrenDescription")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {children.map((child) => (
                    <ChildCard
                      key={child.id}
                      child={child}
                      onClick={handleChildClick}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Approvals & Notifications */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          <PendingApprovalsWidget approvals={pendingApprovals} compact />

          {/* Notifications */}
          <NotificationsWidget
            notifications={notifications}
            unreadCount={unreadNotificationsCount}
            compact
          />
        </div>
      </div>

      {/* Child Action Sheet */}
      <ChildActionSheet
        open={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        child={selectedChild}
      />
    </div>
  );
}
