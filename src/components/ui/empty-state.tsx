"use client";

import {
  type LucideIcon,
  Inbox,
  PartyPopper,
  Megaphone,
  Filter,
  Users,
  Bus,
  UserCog,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Search,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

// Icon map for serialization from server components
const iconMap: Record<string, LucideIcon> = {
  Inbox,
  PartyPopper,
  Megaphone,
  Filter,
  Users,
  Bus,
  UserCog,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Search,
};

export type EmptyStateIconName = keyof typeof iconMap;

interface EmptyStateProps {
  /** Icon name (string) for server components or LucideIcon for client components */
  icon?: EmptyStateIconName | LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = "Inbox",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  // Support both string icon names (for server components) and icon components (for client components)
  const Icon = typeof icon === "string" ? (iconMap[icon] || Inbox) : icon;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
