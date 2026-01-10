"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  User,
  ShoppingBag,
  Bus,
  Calendar,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useLocale } from "next-intl";
import type { ParentChild } from "@/lib/types/modules/parents";

interface ChildActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ParentChild | null;
}

export function ChildActionSheet({
  open,
  onOpenChange,
  child,
}: ChildActionSheetProps) {
  const router = useRouter();
  const t = useTranslations("parents");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isRTL = locale === "ar";

  if (!child) return null;

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const actions = [
    {
      icon: User,
      label: t("actions.viewProfile"),
      href: `/dashboard/children/${child.id}`,
      color: "text-blue-500",
    },
    {
      icon: ShoppingBag,
      label: t("actions.orderFromStore"),
      href: `/store?for=${child.id}`,
      color: "text-green-500",
    },
    {
      icon: Bus,
      label: t("actions.bookTrip"),
      href: `/trips?for=${child.id}`,
      color: "text-blue-500",
    },
    {
      icon: Calendar,
      label: t("actions.viewAttendance"),
      href: `/dashboard/children/${child.id}?tab=attendance`,
      color: "text-purple-500",
    },
  ];

  const handleAction = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const content = (
    <div className="flex flex-col items-center py-4">
      <OptimizedAvatar
        src={child.avatar_url}
        alt={child.full_name}
        size="xl"
      />
      <h3 className="mt-3 text-lg font-bold">{child.full_name}</h3>
      <p className="text-sm text-muted-foreground text-center">
        {[child.class_name, child.church_name].filter(Boolean).join(" • ")}
        {child.points_balance !== undefined && (
          <span className="text-amber-600 font-medium">
            {" "}
            • {child.points_balance} {t("points")}
          </span>
        )}
      </p>

      <div className="mt-6 w-full space-y-2">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant="ghost"
            className="w-full justify-between h-12 px-4"
            onClick={() => handleAction(action.href)}
          >
            <span className="flex items-center gap-3">
              <action.icon className={`h-5 w-5 ${action.color}`} />
              {action.label}
            </span>
            <ChevronIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={() => onOpenChange(false)}
      >
        {tCommon("cancel")}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">{t("actions.title")}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="sr-only">{t("actions.title")}</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
