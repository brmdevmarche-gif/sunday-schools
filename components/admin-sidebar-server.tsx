"use client";

import Link from "next/link";
import { SidebarNavigation } from "@/components/ui/sidebar-navigation";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    iconName: "Home" as const,
    type: "single" as const,
    href: "/admin/",
  },
  {
    id: "management",
    label: "Management",
    iconName: "Settings" as const,
    type: "group" as const,
    children: [
      {
        id: "churches",
        label: "Churches",
        iconName: "Church" as const,
        href: "/admin/churches",
      },
      {
        id: "students",
        label: "Students",
        iconName: "Users" as const,
        href: "/admin/students",
      },
      {
        id: "servants",
        label: "Servants",
        iconName: "UserCheck" as const,
        href: "/admin/servants",
      },
      {
        id: "activities",
        label: "Activities",
        iconName: "Calendar" as const,
        href: "/admin/activities",
      },
      {
        id: "lessons",
        label: "Lessons",
        iconName: "BookOpen" as const,
        href: "/admin/lessons",
      },
      {
        id: "class-groups",
        label: "Class Groups",
        iconName: "GraduationCap" as const,
        href: "/admin/class-groups",
      },
      {
        id: "offers",
        label: "Offers",
        iconName: "Gift" as const,
        href: "/admin/offers",
      },
      {
        id: "stores",
        label: "Stores",
        iconName: "Store" as const,
        href: "/admin/stores",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    iconName: "BarChart3" as const,
    type: "single" as const,
    href: "/admin/reports",
  },
];

export function AdminSidebar() {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Knesty Admin
        </h2>
      </div>

      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <SidebarNavigation menuItems={menuItems} />
      </div>
    </div>
  );
}
