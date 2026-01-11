"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ParentActionBadgeProps {
  parentName?: string;
  compact?: boolean;
  className?: string;
}

export function ParentActionBadge({
  parentName,
  compact = false,
  className,
}: ParentActionBadgeProps) {
  const t = useTranslations("common");

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        compact ? "px-1.5" : "",
        className
      )}
    >
      <Users className={cn("h-3 w-3", compact ? "" : "me-1")} />
      {!compact &&
        (parentName
          ? t("addedByParentName", { name: parentName })
          : t("addedByParent"))}
    </Badge>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            {parentName
              ? t("addedByParentName", { name: parentName })
              : t("addedByParent")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}
