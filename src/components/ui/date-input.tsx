"use client";

import * as React from "react";
import { X, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/components/ui/mobile-sheet";

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  /** The date/datetime value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Type of date input */
  type?: "date" | "datetime-local" | "time";
  /** Whether to show clear button */
  showClear?: boolean;
  /** Label for accessibility */
  label?: string;
}

/**
 * DateInput - A mobile-friendly date/time input component
 *
 * Features:
 * - Uses native date picker on mobile (triggers OS-level picker)
 * - Minimum 44px touch target height
 * - Optional clear button for resetting value
 * - Consistent styling with other form inputs
 * - RTL support
 *
 * Usage:
 * ```tsx
 * <DateInput
 *   value={date}
 *   onChange={setDate}
 *   type="date"
 *   showClear
 * />
 *
 * <DateInput
 *   value={datetime}
 *   onChange={setDatetime}
 *   type="datetime-local"
 * />
 * ```
 */
export function DateInput({
  value,
  onChange,
  type = "date",
  showClear = false,
  label,
  className,
  disabled,
  ...props
}: DateInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    inputRef.current?.focus();
  };

  const handleContainerClick = () => {
    // On mobile, clicking anywhere in the container should open the picker
    inputRef.current?.showPicker?.();
  };

  return (
    <div
      className={cn(
        "relative flex items-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center w-full rounded-md border border-input bg-background",
          "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "transition-colors",
          !disabled && "cursor-pointer"
        )}
        onClick={!disabled ? handleContainerClick : undefined}
      >
        {/* Calendar/Clock icon */}
        <div className="flex items-center justify-center ps-3 text-muted-foreground pointer-events-none">
          {type === "time" ? (
            <Clock className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
        </div>

        {/* Native date input */}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={label}
          className={cn(
            "flex-1 h-11 sm:h-10 px-3 py-2",
            "bg-transparent text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
            // Hide the default calendar icon on webkit browsers (we have our own)
            "[&::-webkit-calendar-picker-indicator]:opacity-0",
            "[&::-webkit-calendar-picker-indicator]:absolute",
            "[&::-webkit-calendar-picker-indicator]:inset-0",
            "[&::-webkit-calendar-picker-indicator]:w-full",
            "[&::-webkit-calendar-picker-indicator]:h-full",
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer"
          )}
          {...props}
        />

        {/* Clear button */}
        {showClear && value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="me-1 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label="Clear date"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export interface DateTimePickerProps {
  /** The datetime value in ISO or datetime-local format */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Label shown above the input */
  label?: string;
  /** Placeholder text when no value */
  placeholder?: string;
  /** Whether to show clear button */
  showClear?: boolean;
  /** Whether to show "Now" button */
  showNow?: boolean;
  /** Text for clear button */
  clearText?: string;
  /** Text for now button */
  nowText?: string;
  /** Text for done button (mobile) */
  doneText?: string;
  /** Title for mobile sheet */
  sheetTitle?: string;
  /** Whether disabled */
  disabled?: boolean;
  /** Locale for formatting display date */
  locale?: string;
  /** Format the display value (optional, defaults to toLocaleString) */
  formatDisplay?: (value: string, locale: string) => string;
}

/**
 * DateTimePicker - A responsive datetime picker
 *
 * Features:
 * - Mobile: Bottom sheet with native datetime input
 * - Desktop: Popover with datetime input
 * - Shows formatted date in trigger button
 * - Optional clear and "Now" quick actions
 *
 * Usage:
 * ```tsx
 * <DateTimePicker
 *   value={datetime}
 *   onChange={setDatetime}
 *   label="Publish Date"
 *   showClear
 *   showNow
 * />
 * ```
 */
export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select date and time",
  showClear = false,
  showNow = false,
  clearText = "Clear",
  nowText = "Now",
  doneText = "Done",
  sheetTitle = "Select Date & Time",
  disabled = false,
  locale = "en",
  formatDisplay,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  // Format value for datetime-local input
  const toDateTimeLocal = (isoString: string): string => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      // Format as YYYY-MM-DDTHH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  // Format display value
  const displayValue = React.useMemo(() => {
    if (!value) return placeholder;
    if (formatDisplay) return formatDisplay(value, locale);
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return placeholder;
      return date.toLocaleString(locale);
    } catch {
      return placeholder;
    }
  }, [value, placeholder, locale, formatDisplay]);

  const handleNow = () => {
    const now = new Date();
    onChange(toDateTimeLocal(now.toISOString()));
  };

  const handleClear = () => {
    onChange("");
  };

  const inputAndActions = (
    <div className="space-y-4">
      <input
        type="datetime-local"
        value={toDateTimeLocal(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full h-12 px-3 rounded-md border border-input bg-background text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <div className="flex gap-2 justify-end">
        {showClear && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled || !value}
          >
            {clearText}
          </Button>
        )}
        {showNow && (
          <Button
            type="button"
            size="sm"
            onClick={handleNow}
            disabled={disabled}
          >
            {nowText}
          </Button>
        )}
      </div>
    </div>
  );

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn(
        "w-full justify-start text-start font-normal h-11 sm:h-10",
        !value && "text-muted-foreground"
      )}
    >
      <Calendar className="me-2 h-4 w-4" />
      {displayValue}
    </Button>
  );

  // Mobile: Use bottom sheet
  if (isMobile) {
    return (
      <div className="grid gap-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <div onClick={() => !disabled && setOpen(true)}>
          {triggerButton}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] flex flex-col rounded-t-2xl"
          >
            {/* Drag handle */}
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
            <SheetHeader className="text-start">
              <SheetTitle>{sheetTitle}</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              {inputAndActions}
            </div>
            <SheetFooter>
              <Button className="w-full" onClick={() => setOpen(false)}>
                {doneText}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop: Use popover
  return (
    <div className="grid gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          {inputAndActions}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateInput;
