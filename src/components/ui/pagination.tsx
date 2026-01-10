"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of items per page (optional, for display) */
  pageSize?: number;
  /** Total number of items (optional, for display) */
  totalItems?: number;
  /** Callback when page size changes (optional) */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Text labels */
  labels?: {
    previous?: string;
    next?: string;
    page?: string;
    of?: string;
    items?: string;
    itemsPerPage?: string;
  };
  /** Whether to show page size selector */
  showPageSize?: boolean;
  /** Whether to show item count */
  showItemCount?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Pagination - A mobile-friendly pagination component
 *
 * Features:
 * - Mobile: Compact view with prev/next and current page
 * - Desktop: Full view with page numbers
 * - Optional page size selector
 * - Optional item count display
 * - Touch-friendly buttons (44px targets)
 *
 * Usage:
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={Math.ceil(total / pageSize)}
 *   onPageChange={setPage}
 *   totalItems={total}
 *   pageSize={pageSize}
 *   onPageSizeChange={setPageSize}
 *   showPageSize
 *   showItemCount
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  labels = {},
  showPageSize = false,
  showItemCount = false,
  className,
}: PaginationProps) {
  const {
    previous = "Previous",
    next = "Next",
    page = "Page",
    of = "of",
    items = "items",
    itemsPerPage = "per page",
  } = labels;

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Generate page numbers to show
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5; // Max visible page numbers on desktop

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calculate item range for display
  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4",
        className
      )}
    >
      {/* Left side: Item count and page size */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {showItemCount && totalItems !== undefined && startItem && endItem && (
          <span>
            {startItem}-{endItem} {of} {totalItems} {items}
          </span>
        )}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-9 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="hidden sm:inline">{itemsPerPage}</span>
          </div>
        )}
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          aria-label={previous}
          className="h-10 w-10 sm:h-9 sm:w-9"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>

        {/* Mobile: Simple page indicator */}
        <div className="flex sm:hidden items-center gap-2 px-2 text-sm">
          <span>
            {page} {currentPage} {of} {totalPages}
          </span>
        </div>

        {/* Desktop: Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNum, idx) =>
            pageNum === "ellipsis" ? (
              <div
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center w-9 h-9"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(pageNum)}
                className="h-9 w-9"
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label={next}
          className="h-10 w-10 sm:h-9 sm:w-9"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

/**
 * usePagination - Hook for managing pagination state
 *
 * Usage:
 * ```tsx
 * const { paginatedData, ...paginationProps } = usePagination({
 *   data: allItems,
 *   initialPageSize: 20,
 * });
 *
 * return (
 *   <>
 *     <ItemList items={paginatedData} />
 *     <Pagination {...paginationProps} />
 *   </>
 * );
 * ```
 */
export function usePagination<T>({
  data,
  initialPage = 1,
  initialPageSize = 20,
}: {
  data: T[];
  initialPage?: number;
  initialPageSize?: number;
}) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    // Paginated data
    paginatedData,
    // Pagination props
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange: setCurrentPage,
    onPageSizeChange: handlePageSizeChange,
  };
}

export default Pagination;
