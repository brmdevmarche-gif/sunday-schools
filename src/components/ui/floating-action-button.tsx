"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const fabVariants = cva(
  // Base styles - 56px is Material Design recommended FAB size
  "fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "size-14", // 56px - standard FAB size
        sm: "size-12", // 48px - mini FAB
        lg: "size-16", // 64px - extended FAB without text
      },
      position: {
        "bottom-right": "bottom-4 end-4",
        "bottom-center": "bottom-4 start-1/2 -translate-x-1/2",
        "bottom-left": "bottom-4 start-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "bottom-right",
    },
  }
);

export interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  /** The icon to display */
  icon: React.ReactNode;
  /** Optional label for extended FAB (mobile landscape or larger screens) */
  label?: string;
  /** Safe area bottom offset (for devices with home indicators) */
  safeAreaOffset?: boolean;
  /** Only show on mobile (sm:hidden) - default true */
  mobileOnly?: boolean;
}

/**
 * FloatingActionButton (FAB) component for primary actions on mobile.
 *
 * Features:
 * - Fixed position at bottom of screen
 * - 56px touch target (Material Design standard)
 * - Proper shadow and animation
 * - Hidden on desktop by default (where header buttons are used)
 * - Safe area support for notched devices
 *
 * Usage:
 * ```tsx
 * <FloatingActionButton
 *   icon={<Plus className="size-6" />}
 *   onClick={() => setOpen(true)}
 *   aria-label="Add new item"
 * />
 * ```
 */
export function FloatingActionButton({
  className,
  variant,
  size,
  position,
  icon,
  label,
  safeAreaOffset = true,
  mobileOnly = true,
  ...props
}: FloatingActionButtonProps) {
  return (
    <button
      className={cn(
        fabVariants({ variant, size, position }),
        // Safe area for notched devices
        safeAreaOffset && "pb-safe",
        // Mobile only by default
        mobileOnly && "sm:hidden",
        // Extended FAB with label
        label && "px-4 gap-2 rounded-2xl w-auto min-w-14",
        className
      )}
      {...props}
    >
      <span className="[&>svg]:size-6">{icon}</span>
      {label && (
        <span className="font-medium text-sm whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}

export default FloatingActionButton;
