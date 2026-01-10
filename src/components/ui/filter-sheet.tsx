"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  /** Title for the filter sheet */
  title?: string;
  /** Filter content to render */
  children: React.ReactNode;
  /** Custom trigger button (defaults to Filter icon button) */
  trigger?: React.ReactNode;
  /** Show filter count badge */
  activeFilterCount?: number;
  /** Called when filters are applied */
  onApply?: () => void;
  /** Called when filters are cleared */
  onClear?: () => void;
  /** Apply button text */
  applyText?: string;
  /** Clear button text */
  clearText?: string;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function FilterSheet({
  title = "Filters",
  children,
  trigger,
  activeFilterCount = 0,
  onApply,
  onClear,
  applyText = "Apply Filters",
  clearText = "Clear All",
  open,
  onOpenChange,
}: FilterSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const handleApply = () => {
    onApply?.();
    setIsOpen?.(false);
  };

  const handleClear = () => {
    onClear?.();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 me-2" />
            {title}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {title}
            {activeFilterCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({activeFilterCount} active)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="space-y-4">
            {children}
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          {onClear && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
            >
              {clearText}
            </Button>
          )}
          {onApply && (
            <Button onClick={handleApply} className="flex-1">
              {applyText}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Wrapper component that shows children inline on desktop
 * and in a FilterSheet on mobile
 */
interface ResponsiveFiltersProps {
  /** Title for the mobile filter sheet */
  title?: string;
  /** Filter content */
  children: React.ReactNode;
  /** Number of active filters */
  activeFilterCount?: number;
  /** Apply button text */
  applyText?: string;
  /** Clear button text */
  clearText?: string;
  /** Called when filters are applied (mobile only) */
  onApply?: () => void;
  /** Called when filters are cleared */
  onClear?: () => void;
  /** Custom className for desktop container */
  className?: string;
}

export function ResponsiveFilters({
  title = "Filters",
  children,
  activeFilterCount = 0,
  applyText,
  clearText,
  onApply,
  onClear,
  className,
}: ResponsiveFiltersProps) {
  return (
    <>
      {/* Mobile: Show filter button that opens sheet */}
      <div className="sm:hidden">
        <FilterSheet
          title={title}
          activeFilterCount={activeFilterCount}
          onApply={onApply}
          onClear={onClear}
          applyText={applyText}
          clearText={clearText}
        >
          {children}
        </FilterSheet>
      </div>

      {/* Desktop: Show filters inline */}
      <div className={cn("hidden sm:block", className)}>
        {children}
      </div>
    </>
  );
}

export default FilterSheet;
