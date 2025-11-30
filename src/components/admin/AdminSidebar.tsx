"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Building2,
  Church,
  School,
  Users,
  BookOpen,
  CheckSquare,
  ClipboardList,
  PartyPopper,
  Plane,
  Store,
  Settings,
  LogOut,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface AdminSidebarProps {
  items: NavItem[];
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
}

const iconMap = {
  dashboard: LayoutDashboard,
  building: Building2,
  church: Church,
  school: School,
  users: Users,
  book: BookOpen,
  check: CheckSquare,
  task: ClipboardList,
  activity: PartyPopper,
  trip: Plane,
  store: Store,
  settings: Settings,
};

export default function AdminSidebar({
  items,
  userRole,
  userName,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap] || LayoutDashboard;
    return Icon;
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="px-6 pt-6">
        <h2 className="text-2xl font-bold">Knesty</h2>
        {/* <p className="text-sm text-muted-foreground mt-1">Admin Panel</p> */}
      </div>

      {/* User Info */}
      {userName && (
        <>
          <div className="p-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole?.replace("_", " ")}
              </p>
            </div>
          </div>
          {/* <Separator /> */}
        </>
      )}
      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer Actions */}
      <div className="p-4 space-y-2">
        <Link href="/admin/settings">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        {onLogout && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            size="sm"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
