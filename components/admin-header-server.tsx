"use client";

import { SearchComponent } from "@/components/ui/search-component";
import { NotificationButton } from "@/components/ui/notification-button";
import { UserMenu } from "@/components/ui/user-menu";

export function AdminHeader() {
  return (
    <header className="border-b border-border bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <SearchComponent />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <NotificationButton notificationCount={3} />
          <UserMenu
            user={{
              name: "Admin User",
              role: "Diocese Administrator",
              avatar: "/admin-avatar.png",
            }}
          />
        </div>
      </div>
    </header>
  );
}
