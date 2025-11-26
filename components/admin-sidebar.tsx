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
} from "lucide-react";
import { useState } from "react";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminSidebar({
  activeSection,
  onSectionChange,
}: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "management",
  ]);

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
    },
    {
      id: "management",
      label: "Management",
      icon: Settings,
      type: "group",
      children: [
        { id: "churches", label: "Churches", icon: Church },
        { id: "students", label: "Students", icon: Users },
        { id: "servants", label: "Servants", icon: UserCheck },
        { id: "activities", label: "Activities", icon: Calendar },
        { id: "lessons", label: "Lessons", icon: BookOpen },
        { id: "offers", label: "Offers", icon: Gift },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      type: "single",
    },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Church className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">Knesty</h2>
            <p className="text-xs text-sidebar-foreground/70">Admin Panel</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.type === "single" ? (
                <SimpleButton
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    activeSection === item.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                  onClick={() => onSectionChange(item.id)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </SimpleButton>
              ) : (
                <div>
                  <SimpleButton
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
                    onClick={() => toggleSection(item.id)}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {expandedSections.includes(item.id) ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </SimpleButton>
                  {expandedSections.includes(item.id) && item.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <SimpleButton
                          key={child.id}
                          variant={
                            activeSection === child.id ? "secondary" : "ghost"
                          }
                          size="sm"
                          className={cn(
                            "w-full justify-start",
                            activeSection === child.id
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                          onClick={() => onSectionChange(child.id)}
                        >
                          <child.icon className="w-4 h-4 mr-2" />
                          {child.label}
                        </SimpleButton>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
