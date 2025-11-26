"use client";

import { SimpleButton } from "@/components/ui/simple-button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface NotificationButtonProps {
  notificationCount?: number;
}

export function NotificationButton({
  notificationCount = 0,
}: NotificationButtonProps) {
  return (
    <SimpleButton variant="ghost" size="icon" className="relative">
      <Bell className="w-4 h-4" />
      {notificationCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
        >
          {notificationCount}
        </Badge>
      )}
    </SimpleButton>
  );
}
