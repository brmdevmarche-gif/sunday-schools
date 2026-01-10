"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronRight, AlertCircle, GraduationCap } from "lucide-react";
import type { ParentChild } from "@/lib/types";

interface ChildCardProps {
  child: ParentChild;
  /** Optional click handler - if provided, renders as button instead of link */
  onClick?: (child: ParentChild) => void;
}

export function ChildCard({ child, onClick }: ChildCardProps) {
  const t = useTranslations("parents.children");

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const cardContent = (
    <Card className="h-full transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <OptimizedAvatar
              src={child.avatar_url}
              alt={child.full_name || "Child"}
              fallback={getInitials(child.full_name)}
              size="lg"
              className="h-16 w-16 border-2 border-primary/10"
              fallbackClassName="text-lg bg-primary/10 text-primary"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-lg truncate">
                  {child.full_name || "Unnamed"}
                </h3>
                {child.pending_approvals_count > 0 && (
                  <Badge variant="destructive" className="shrink-0">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {child.pending_approvals_count}
                  </Badge>
                )}
              </div>

              {/* Class & Church */}
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                {child.class_name ? (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {child.class_name}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60">
                    {t("noClass")}
                  </span>
                )}
                {child.church_name && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{child.church_name}</span>
                  </>
                )}
              </div>

              {/* Points */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{child.points_balance}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("points")}
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
          </div>
        </CardContent>
      </Card>
  );

  // If onClick is provided, render as button (for action sheet)
  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(child)}
        className="w-full text-start"
      >
        {cardContent}
      </button>
    );
  }

  // Default: render as link to child profile
  return (
    <Link href={`/dashboard/parents/children/${child.id}`}>
      {cardContent}
    </Link>
  );
}
