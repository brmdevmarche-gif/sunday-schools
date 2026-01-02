"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Bus,
  Store,
  Settings,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeft,
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
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
  trip: Bus,
  store: Store,
  settings: Settings,
};

export default function AdminSidebar({
  items,
  userRole,
  userName,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onClose,
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
    // For other routes, check if pathname starts with the href
    return pathname === href || pathname.startsWith(href + "/");
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
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
            className="ml-auto"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Collapse toggle for desktop */}
      {!isMobile && onToggleCollapse && (
        <div className={cn("px-2 pt-4", isCollapsed ? "flex justify-center" : "flex justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* User Info */}
      {userName && !isCollapsed && (
        <>
          <div className="p-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole?.replace("_", " ")}
              </p>
            </div>
          </div>
        </>
      )}
      <Separator />

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            const isActive = isItemActive(item.href);

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-colors",
                  isCollapsed
                    ? "justify-center p-3"
                    : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>
      </TooltipProvider>

      <Separator />

      {/* Footer Actions */}
      <TooltipProvider delayDuration={0}>
        <div className={cn("p-2 space-y-1", isCollapsed && "flex flex-col items-center")}>
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin/settings" onClick={isMobile ? onClose : undefined}>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
              {onLogout && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={onLogout}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Link href="/admin/settings" onClick={isMobile ? onClose : undefined}>
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
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  );

  return sidebarContent;
}
