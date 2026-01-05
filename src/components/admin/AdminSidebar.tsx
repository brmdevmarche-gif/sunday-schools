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
  GraduationCap,
  BookOpen,
  CheckSquare,
  ClipboardList,
  PartyPopper,
  Megaphone,
  Bus,
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
  student: GraduationCap,
  book: BookOpen,
  check: CheckSquare,
  task: ClipboardList,
  activity: PartyPopper,
  announcement: Megaphone,
  trip: Bus,
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

  const isItemActive = (href: string) => {
    // Special case for dashboard: only active on exact /admin path
    if (href === "/admin") {
      return pathname === "/admin";
    }
    // Special case: don't highlight Announcements management when user is on the inbox page
    if (href === "/admin/announcements") {
      if (pathname === "/admin/announcements/inbox") return false;
      if (pathname.startsWith("/admin/announcements/inbox/")) return false;
      return pathname === href || pathname.startsWith(href + "/");
    }
    // For other routes, check if pathname starts with the href
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col ltr:border-r rtl:border-l bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header with Logo */}
      <div
        className={cn(
          "pt-6 flex items-center",
          isCollapsed ? "px-3 justify-center" : "px-6 gap-3"
        )}
      >
        <Image
          src="/Logo.png"
          alt="Knesty Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        {!isCollapsed && <h2 className="text-2xl font-bold">Knesty</h2>}

        {/* Close button for mobile */}
        {isMobile && onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ms-auto"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
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
