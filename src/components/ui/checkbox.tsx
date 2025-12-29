"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon, Loader2 } from "lucide-react"

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
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 relative",
        loading && "bg-primary/50",
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="absolute inset-0 grid place-content-center">
          <Loader2 className="size-3.5 animate-spin text-primary-foreground" />
        </div>
      ) : (
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="grid place-content-center text-current transition-none"
        >
          <CheckIcon className="size-3.5" />
        </CheckboxPrimitive.Indicator>
      )}
    </CheckboxPrimitive.Root>
  )
})

Checkbox.displayName = "Checkbox"

export { Checkbox }
