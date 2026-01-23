"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon, Loader2, MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  loading?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, loading, disabled, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      disabled={disabled || loading}
      className={cn(
        // Base styles
        "group peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 relative",
        // Active state for touch feedback
        "active:scale-90",
        // Mobile touch target: 44px minimum (invisible pseudo-element extends touch area)
        "before:absolute before:-inset-3.5 before:content-[''] sm:before:-inset-2",
        loading && "bg-primary/50",
        className
      )}
      {...props}
    >
      {/* 
        Avoid Radix <CheckboxPrimitive.Indicator/> because it uses Presence + ref-driven state updates,
        which can trigger "Maximum update depth exceeded" in some dev setups.
        We render icons purely via data-state styles instead (no Presence).
      */}
      <div className="absolute inset-0 grid place-content-center">
        {loading ? (
          <Loader2 className="size-3.5 animate-spin text-primary-foreground" />
        ) : (
          <>
            <CheckIcon className="size-3.5 hidden text-current group-data-[state=checked]:block" />
            <MinusIcon className="size-3.5 hidden text-current group-data-[state=indeterminate]:block" />
          </>
        )}
      </div>
    </CheckboxPrimitive.Root>
  )
})

Checkbox.displayName = "Checkbox"

export { Checkbox }
