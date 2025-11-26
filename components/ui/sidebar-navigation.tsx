"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  Users,
  UserCheck,
  Calendar,
  BookOpen,
  Gift,
  BarChart3,
  Settings,
  GraduationCap,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useErrorHandler } from "@/components/ui/error-boundary";

// Icon mapping to avoid passing functions from server to client
const iconMap = {
  Home,
  Church: Building2, // Use Building2 for churches
  Users,
  UserCheck,
  Calendar,
  BookOpen,
  Gift,
  BarChart3,
  Settings,
  GraduationCap,
  Store,
};

interface MenuItem {
  id: string;
  label: string;
  iconName: keyof typeof iconMap;
  type: "single" | "group";
  href?: string;
  children?: {
    id: string;
    label: string;
    iconName: keyof typeof iconMap;
    href: string;
  }[];
}

interface SidebarNavigationProps {
  menuItems: MenuItem[];
}

export function SidebarNavigation({ menuItems }: SidebarNavigationProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["management"])
  );
  const pathname = usePathname();
  const handleError = useErrorHandler();

  const toggleGroup = useCallback(
    (groupId: string) => {
      try {
        setExpandedGroups((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(groupId)) {
            newSet.delete(groupId);
          } else {
            newSet.add(groupId);
          }
          return newSet;
        });
      } catch (error) {
        console.error("Error toggling group:", error);
        handleError(new Error("Failed to toggle navigation group"));
      }
    },
    [handleError]
  );

  const isActive = useCallback(
    (href: string) => {
      try {
        if (href === "/") {
          return pathname === "/";
        }
        return pathname.startsWith(href);
      } catch (error) {
        console.error("Error checking active state:", error);
        return false;
      }
    },
    [pathname]
  );

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        try {
          if (item.type === "single") {
            const Icon = iconMap[item.iconName];
            if (!Icon) {
              console.warn(`Icon not found for: ${item.iconName}`);
              return null;
            }
            return (
              <Link
                key={item.id}
                href={item.href!}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive(item.href!)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Link>
            );
          }

          if (item.type === "group") {
            const Icon = iconMap[item.iconName];
            if (!Icon) {
              console.warn(`Icon not found for group: ${item.iconName}`);
              return null;
            }
            const isExpanded = expandedGroups.has(item.id);

            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleGroup(item.id)}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                >
                  <Icon className="mr-3 h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isExpanded && item.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = iconMap[child.iconName];
                      if (!ChildIcon) {
                        console.warn(
                          `Icon not found for child: ${child.iconName}`
                        );
                        return null;
                      }
                      return (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                            isActive(child.href)
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <ChildIcon className="mr-3 h-4 w-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        } catch (error) {
          console.error(`Error rendering menu item ${item.id}:`, error);
          return null;
        }
      })}
    </nav>
  );
}
