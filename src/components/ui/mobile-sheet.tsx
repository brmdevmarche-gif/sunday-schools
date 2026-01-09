"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Hook to detect if the viewport is mobile-sized.
 * Uses matchMedia for reliable detection.
 */
function useIsMobile(breakpoint: number = 640) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}

export interface MobileSheetProps {
  /** Whether the sheet/dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Title for the sheet/dialog */
  title: string;
  /** Optional description */
  description?: string;
  /** Content to render inside */
  children: React.ReactNode;
  /** Footer content (buttons, etc.) */
  footer?: React.ReactNode;
  /** Additional className for the content container */
  className?: string;
  /** Whether to show close button (default: true) */
  showCloseButton?: boolean;
}

/**
 * MobileSheet - A responsive modal that renders as:
 * - Bottom sheet on mobile (slides up from bottom, full width)
 * - Centered dialog on desktop
 *
 * Features:
 * - Automatic mobile detection
 * - Consistent API for both modes
 * - Drag handle indicator on mobile
 * - Safe area support
 * - Scrollable content area
 *
 * Usage:
 * ```tsx
 * <MobileSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Edit Profile"
 *   description="Update your profile information"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button onClick={handleSave}>Save</Button>
 *     </>
 *   }
 * >
 *   <form>...</form>
 * </MobileSheet>
 * ```
 */
export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
}: MobileSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "max-h-[90vh] flex flex-col rounded-t-2xl",
            className
          )}
        >
          {/* Drag handle indicator */}
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />

          <SheetHeader className="text-start">
            <SheetTitle>{title}</SheetTitle>
            {description && (
              <SheetDescription>{description}</SheetDescription>
            )}
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 -mx-4">
            {children}
          </div>

          {footer && (
            <SheetFooter className="flex-row gap-2 sm:flex-row">
              {footer}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("sm:max-w-lg", className)}
        showCloseButton={showCloseButton}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {children}

        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { useIsMobile };
export default MobileSheet;
