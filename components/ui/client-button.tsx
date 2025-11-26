"use client";

import { Button as BaseButton, buttonVariants } from "@/components/ui/button";
import { forwardRef } from "react";

// Re-export the buttonVariants for external use
export { buttonVariants };

// Create a client-side wrapper for the Button component
export const Button = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof BaseButton>
>((props, ref) => {
  return <BaseButton ref={ref} {...props} />;
});

Button.displayName = "Button";