"use client";

import { cn } from "@/lib/utils";
import { SimpleButton } from "@/components/ui/simple-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Church,
  Users,
  UserCheck,
  Calendar,
  BookOpen,
  Gift,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "management",
  ]);
  const pathname = usePathname();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      type: "single",
      href: "/",
    },
    {
      id: "management",
      label: "Management",
      icon: Settings,
      type: "group",
      children: [
        { id: "churches", label: "Churches", icon: Church, href: "/churches" },
        { id: "students", label: "Students", icon: Users, href: "/students" },
        {
          id: "servants",
          label: "Servants",
          icon: UserCheck,
          href: "/servants",
        },
        {
          id: "activities",
          label: "Activities",
          icon: Calendar,
          href: "/activities",
        },
        { id: "lessons", label: "Lessons", icon: BookOpen, href: "/lessons" },
        {
          id: "class-groups",
          label: "Class Groups",
          icon: GraduationCap,
          href: "/class-groups",
        },
        { id: "offers", label: "Offers", icon: Gift, href: "/offers" },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      type: "single",
      href: "/reports",
    },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Knesty Admin
        </h2>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.type === "single" ? (
                <Link href={item.href!}>
                  <SimpleButton
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      pathname === item.href &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </SimpleButton>
                </Link>
              ) : (
                <div>
                  <SimpleButton
                    variant="ghost"
                    onClick={() => toggleSection(item.id)}
                    className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </div>
                    {expandedSections.includes(item.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </SimpleButton>
                  {expandedSections.includes(item.id) && item.children && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.id} href={child.href!}>
                          <SimpleButton
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              pathname === child.href &&
                                "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
                          >
                            <child.icon className="mr-2 h-4 w-4" />
                            {child.label}
                          </SimpleButton>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
