"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/components/ui/mobile-sheet";

export interface SearchableSelectOption {
  /** Unique value for the option */
  value: string;
  /** Display label for the option */
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface SearchableSelectProps {
  /** The currently selected value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Array of options to display */
  options: SearchableSelectOption[];
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Text to show in search input */
  searchPlaceholder?: string;
  /** Text to show when no results found */
  emptyText?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional className for the trigger button */
  className?: string;
  /** Title for the mobile sheet */
  sheetTitle?: string;
  /** Whether to show a "clear" option at the top (for filters) */
  showClearOption?: boolean;
  /** Label for the clear option */
  clearOptionLabel?: string;
  /** Value for the clear option (defaults to "all") */
  clearOptionValue?: string;
}

/**
 * SearchableSelect - A mobile-friendly searchable dropdown
 *
 * Features:
 * - Popover with search on desktop
 * - Bottom sheet with search on mobile
 * - Keyboard navigation support
 * - Touch-friendly (44px+ touch targets)
 * - Optional "clear" option for filter use cases
 *
 * Usage:
 * ```tsx
 * <SearchableSelect
 *   value={selectedDiocese}
 *   onValueChange={setSelectedDiocese}
 *   options={dioceses.map(d => ({ value: d.id, label: d.name }))}
 *   placeholder="Select diocese..."
 *   searchPlaceholder="Search dioceses..."
 *   emptyText="No dioceses found"
 *   sheetTitle="Select Diocese"
 * />
 * ```
 */
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  disabled = false,
  className,
  sheetTitle = "Select",
  showClearOption = false,
  clearOptionLabel = "All",
  clearOptionValue = "all",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const isMobile = useIsMobile();

  // Get the display label for the current value
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = value === clearOptionValue
    ? clearOptionLabel
    : selectedOption?.label || placeholder;

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearch("");
  };

  // Reset search when closing
  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Shared option rendering
  const renderOptions = () => (
    <CommandList className="max-h-[300px] sm:max-h-[240px]">
      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </CommandEmpty>
      <CommandGroup>
        {showClearOption && (
          <CommandItem
            value={clearOptionValue}
            onSelect={() => handleSelect(clearOptionValue)}
            className="min-h-[44px] py-3 cursor-pointer"
          >
            <Check
              className={cn(
                "me-2 h-4 w-4 shrink-0",
                value === clearOptionValue ? "opacity-100" : "opacity-0"
              )}
            />
            <span>{clearOptionLabel}</span>
          </CommandItem>
        )}
        {filteredOptions.map((option) => (
          <CommandItem
            key={option.value}
            value={option.label}
            onSelect={() => handleSelect(option.value)}
            disabled={option.disabled}
            className="min-h-[44px] py-3 cursor-pointer"
          >
            <Check
              className={cn(
                "me-2 h-4 w-4 shrink-0",
                value === option.value ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="flex flex-col gap-0.5">
              <span>{option.label}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  );

  // Mobile: Use bottom sheet
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            "w-full justify-between font-normal h-10",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] flex flex-col rounded-t-2xl p-0"
          >
            {/* Drag handle */}
            <div className="pt-3 pb-1">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20" />
            </div>

            <SheetHeader className="px-4 pb-2">
              <SheetTitle>{sheetTitle}</SheetTitle>
            </SheetHeader>

            <Command className="rounded-none border-none" shouldFilter={false}>
              <div className="border-b px-3">
                <div className="flex items-center gap-2 py-2">
                  <Search className="h-4 w-4 shrink-0 opacity-50" />
                  <input
                    className="flex h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-safe">
                {renderOptions()}
              </div>
            </Command>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Use popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          {renderOptions()}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
