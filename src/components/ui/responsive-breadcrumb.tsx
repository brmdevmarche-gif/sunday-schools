"use client";

import * as React from "react";
import { ChevronRight, MoreHorizontal, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  /** The label to display. Can be a string or ReactNode (e.g., icon) */
  label: React.ReactNode;
  /** The href for the link. If not provided, item is treated as the current page */
  href?: string;
}

interface ResponsiveBreadcrumbProps {
  items: BreadcrumbItem[];
  /** Custom className for the nav element */
  className?: string;
  /** Whether to show home icon for the first item if it's "/" or "/admin" */
  showHomeIcon?: boolean;
}

/**
 * A responsive breadcrumb component that:
 * - Shows all items on desktop (sm and up)
 * - On mobile, shows: first item > ... > last item (if more than 2 items)
 * - Automatically handles RTL separator rotation
 */
export function ResponsiveBreadcrumb({
  items,
  className,
  showHomeIcon = true,
}: ResponsiveBreadcrumbProps) {
  if (items.length === 0) return null;

  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  const middleItems = items.slice(1, -1);
  const hasMiddleItems = middleItems.length > 0;

  const renderSeparator = (key: string) => (
    <li
      key={key}
      role="presentation"
      aria-hidden="true"
      className="[&>svg]:size-3.5"
    >
      <ChevronRight className="rtl:rotate-180" />
    </li>
  );

  const renderItem = (
    item: BreadcrumbItem,
    isCurrentPage: boolean,
    className?: string
  ) => {
    if (isCurrentPage || !item.href) {
      return (
        <span
          role="link"
          aria-disabled="true"
          aria-current="page"
          className={cn("text-foreground font-normal truncate max-w-[200px] sm:max-w-none", className)}
        >
          {item.label}
        </span>
      );
    }

    const isHomeLink = item.href === "/" || item.href === "/admin";
    const showIcon = showHomeIcon && isHomeLink && typeof item.label === "string";

    return (
      <Link
        href={item.href}
        className={cn("hover:text-foreground transition-colors", className)}
      >
        {showIcon ? <Home className="h-4 w-4" /> : item.label}
      </Link>
    );
  };

  return (
    <nav aria-label="breadcrumb" className={className}>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5">
        {/* First Item - Always visible */}
        <li className="inline-flex items-center gap-1.5">
          {renderItem(firstItem, items.length === 1)}
        </li>

        {/* Mobile: Ellipsis when there are hidden middle items */}
        {hasMiddleItems && (
          <>
            {renderSeparator("mobile-sep-1")}
            <li className="inline-flex items-center gap-1.5 sm:hidden">
              <span
                role="presentation"
                aria-hidden="true"
                className="flex size-9 items-center justify-center"
              >
                <MoreHorizontal className="size-4" />
              </span>
            </li>
          </>
        )}

        {/* Desktop: All middle items */}
        {middleItems.map((item, index) => (
          <React.Fragment key={`middle-${index}`}>
            {/* Separator before middle item (hidden on mobile for first middle item since we show ellipsis) */}
            <li
              role="presentation"
              aria-hidden="true"
              className={cn(
                "[&>svg]:size-3.5",
                index === 0 ? "hidden sm:block" : ""
              )}
            >
              <ChevronRight className="rtl:rotate-180" />
            </li>
            {/* Middle item - hidden on mobile */}
            <li className="hidden sm:inline-flex items-center gap-1.5">
              {renderItem(item, false)}
            </li>
          </React.Fragment>
        ))}

        {/* Last Item - Always visible (if different from first) */}
        {items.length > 1 && (
          <>
            {renderSeparator("last-sep")}
            <li className="inline-flex items-center gap-1.5">
              {renderItem(lastItem, true)}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

export default ResponsiveBreadcrumb;
