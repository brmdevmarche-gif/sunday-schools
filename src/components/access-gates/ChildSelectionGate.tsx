"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Star, ChevronRight, ChevronLeft } from "lucide-react";
import type { ParentChild } from "@/lib/types";

interface ChildSelectionGateProps {
  /** All children for the parent */
  children: ParentChild[];
  /** The base path to navigate to with child selected (e.g., "/store") */
  basePath: string;
  /** Title for the selection card */
  title: string;
  /** Description for the selection card */
  description?: string;
  /** Icon to display (from lucide-react) */
  icon?: React.ReactNode;
}

/**
 * ChildSelectionGate - Requires parent to select a child before proceeding.
 * Shows a card with all children to select from.
 */
export function ChildSelectionGate({
  children,
  basePath,
  title,
  description,
  icon,
}: ChildSelectionGateProps) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChildSelect = (childId: string) => {
    router.push(`${basePath}?for=${childId}`);
  };

  if (children.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <EmptyState
          icon="Users"
          title={t("parents.dashboard.noChildren")}
          description={t("parents.dashboard.noChildrenDescription")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          {icon && (
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {icon}
            </div>
          )}
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleChildSelect(child.id)}
              className="flex items-center justify-between w-full p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <OptimizedAvatar
                  src={child.avatar_url}
                  alt={child.full_name}
                  fallback={getInitials(child.full_name)}
                  size="md"
                  className="h-12 w-12"
                />
                <div className="text-start">
                  <p className="font-medium">{child.full_name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {child.class_name && <span>{child.class_name}</span>}
                    <span className="flex items-center gap-1 text-amber-600">
                      <Star className="h-3 w-3 fill-current" />
                      {child.points_balance} {t("common.pts")}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
