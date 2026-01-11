"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Check, Search, ChevronDown, Star } from "lucide-react";
import type { ParentChild } from "@/lib/types/modules/parents";

interface ChildContextBannerProps {
  child: ParentChild;
  allChildren: ParentChild[];
  onChildChange: (childId: string) => void;
  /** Context type for automatic label (store, trips, etc.) */
  contextType?: "store" | "trips" | "custom";
  /** Custom label if contextType is "custom" */
  contextLabel?: string;
}

/**
 * Compact child selector that integrates into the page header
 * Shows child avatar with name, tapping opens a bottom sheet to switch children
 */
export function ChildContextBanner({
  child,
  allChildren,
  onChildChange,
}: ChildContextBannerProps) {
  const t = useTranslations("parents");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChildren = allChildren.filter((c) =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (childId: string) => {
    onChildChange(childId);
    setSwitcherOpen(false);
    setSearchQuery("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Compact clickable child indicator */}
      <button
        onClick={() => setSwitcherOpen(true)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <OptimizedAvatar
          src={child.avatar_url}
          alt={child.full_name}
          fallback={getInitials(child.full_name)}
          size="sm"
          className="h-7 w-7 border border-primary/20"
          fallbackClassName="text-xs bg-primary/20 text-primary"
        />
        <div className="flex items-center gap-1 max-w-[120px]">
          {allChildren.length > 1 && (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {/* Bottom sheet for child selection */}
      <Sheet open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>{t("selectChild")}</SheetTitle>
          </SheetHeader>

          {allChildren.length > 5 && (
            <div className="relative mt-4">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchChildren")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
          )}

          <div className="mt-4 space-y-2 overflow-y-auto max-h-[50vh]">
            {filteredChildren.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noChildrenFound")}
              </p>
            ) : (
              filteredChildren.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <OptimizedAvatar
                      src={c.avatar_url}
                      alt={c.full_name}
                      fallback={getInitials(c.full_name)}
                      size="md"
                      className="h-10 w-10"
                    />
                    <div className="text-start">
                      <p className="font-medium">{c.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {c.class_name && <span>{c.class_name}</span>}
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star className="h-3 w-3 fill-current" />
                          {c.points_balance}
                        </span>
                      </div>
                    </div>
                  </div>
                  {c.id === child.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
