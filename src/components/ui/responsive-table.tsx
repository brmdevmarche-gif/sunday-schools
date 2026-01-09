"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Column<T> {
  key: string;
  /** Header content - can be string or ReactNode (for sortable headers) */
  header: React.ReactNode;
  /** Plain text label used for mobile card view labels */
  mobileLabel?: string;
  cell: (item: T) => React.ReactNode;
  /** Show this column in mobile card view (default: true) */
  showOnMobile?: boolean;
  /** Use as card title on mobile (only one column should have this) */
  isTitle?: boolean;
  /** Use as card subtitle on mobile (only one column should have this) */
  isSubtitle?: boolean;
  /** Custom class for table header */
  headerClassName?: string;
  /** Custom class for table cell */
  cellClassName?: string;
  /**
   * How to handle text overflow on mobile cards (default: 'truncate')
   * - 'truncate': Single line with ellipsis
   * - 'break': Break long words (good for emails, URLs)
   * - 'wrap': Allow multiple lines
   * - 'none': No overflow handling
   */
  textOverflow?: "truncate" | "break" | "wrap" | "none";
}

export interface SortOption {
  key: string;
  label: string;
  direction: "asc" | "desc";
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  /** Function to get a unique key for each row */
  getRowKey: (item: T) => string;
  /** Called when a row is clicked */
  onRowClick?: (item: T) => void;
  /** Custom class for mobile card */
  cardClassName?: string;
  /** Custom class for table row */
  rowClassName?: string;
  /** Render custom actions for each row (displayed on both views) */
  renderActions?: (item: T) => React.ReactNode;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Mobile sort options */
  sortOptions?: SortOption[];
  /** Current sort key */
  currentSort?: string;
  /** Called when sort changes */
  onSortChange?: (sortKey: string) => void;
  /** Sort label for mobile */
  sortLabel?: string;
}

/**
 * Get CSS class for text overflow handling
 */
function getTextOverflowClass(
  overflow: Column<unknown>["textOverflow"] = "truncate"
): string {
  switch (overflow) {
    case "truncate":
      return "truncate";
    case "break":
      return "break-all";
    case "wrap":
      return "whitespace-normal";
    case "none":
      return "";
    default:
      return "truncate";
  }
}

export function ResponsiveTable<T>({
  data,
  columns,
  getRowKey,
  onRowClick,
  cardClassName,
  rowClassName,
  renderActions,
  emptyState,
  isLoading,
  sortOptions,
  currentSort,
  onSortChange,
  sortLabel = "Sort by",
}: ResponsiveTableProps<T>) {
  const titleColumn = columns.find((col) => col.isTitle);
  const subtitleColumn = columns.find((col) => col.isSubtitle);
  const mobileColumns = columns.filter(
    (col) => col.showOnMobile !== false && !col.isTitle && !col.isSubtitle
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden sm:block">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        {/* Mobile skeleton */}
        <div className="sm:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
              {renderActions && (
                <TableHead className="text-end">{/* Actions */}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={getRowKey(item)}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors",
                  rowClassName
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.cellClassName}>
                    {column.cell(item)}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell className="text-end">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex justify-end gap-1"
                    >
                      {renderActions(item)}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {/* Mobile Sort Dropdown */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{sortLabel}:</span>
            <Select value={currentSort} onValueChange={onSortChange}>
              <SelectTrigger className="w-auto min-w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {data.map((item) => (
          <Card
            key={getRowKey(item)}
            className={cn(
              onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted/70 active:scale-[0.99] transition-all",
              cardClassName
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              {/* Title & Subtitle */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  {titleColumn && (
                    <div
                      className={cn(
                        "font-semibold",
                        getTextOverflowClass(titleColumn.textOverflow)
                      )}
                    >
                      {titleColumn.cell(item)}
                    </div>
                  )}
                  {subtitleColumn && (
                    <div
                      className={cn(
                        "text-sm text-muted-foreground",
                        getTextOverflowClass(subtitleColumn.textOverflow)
                      )}
                    >
                      {subtitleColumn.cell(item)}
                    </div>
                  )}
                </div>
                {renderActions && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex gap-1 shrink-0"
                  >
                    {renderActions(item)}
                  </div>
                )}
              </div>

              {/* Other columns as key-value pairs */}
              {mobileColumns.length > 0 && (
                <div className="space-y-2 text-sm">
                  {mobileColumns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-muted-foreground shrink-0">
                        {column.mobileLabel || column.header}
                      </span>
                      <span
                        className={cn(
                          "text-end min-w-0",
                          getTextOverflowClass(column.textOverflow)
                        )}
                      >
                        {column.cell(item)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default ResponsiveTable;
