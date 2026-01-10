"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface OptimizedAvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image */
  alt: string;
  /** Fallback text (usually initials) shown when image fails or is loading */
  fallback?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Additional className */
  className?: string;
  /** Fallback className */
  fallbackClassName?: string;
}

const sizeMap = {
  xs: { container: "h-6 w-6", pixels: 24, text: "text-[10px]" },
  sm: { container: "h-8 w-8", pixels: 32, text: "text-xs" },
  md: { container: "h-10 w-10", pixels: 40, text: "text-sm" },
  lg: { container: "h-12 w-12", pixels: 48, text: "text-base" },
  xl: { container: "h-16 w-16", pixels: 64, text: "text-lg" },
};

/**
 * OptimizedAvatar - A performant avatar component using Next.js Image
 *
 * Features:
 * - Uses Next.js Image for automatic optimization
 * - Lazy loading by default (loads when near viewport)
 * - Automatic WebP/AVIF conversion
 * - Responsive sizing
 * - Fallback to initials on error
 * - Multiple size variants
 *
 * Usage:
 * ```tsx
 * <OptimizedAvatar
 *   src={user.avatar_url}
 *   alt={user.full_name}
 *   fallback={getInitials(user.full_name)}
 *   size="md"
 * />
 * ```
 */
export function OptimizedAvatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
  fallbackClassName,
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const { container, pixels, text } = sizeMap[size];

  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Generate initials from alt text if fallback not provided
  const initials = React.useMemo(() => {
    if (fallback) return fallback;
    if (!alt) return "?";
    return alt
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [alt, fallback]);

  const showFallback = !src || hasError;

  // Check if URL is external (not from our domain or Supabase)
  const isExternalUrl = React.useMemo(() => {
    if (!src) return false;
    try {
      const url = new URL(src);
      const allowedHosts = [
        'localhost',
        'knasty.org',
        'supabase.co',
        'supabase.in',
      ];
      return !allowedHosts.some(host => url.hostname.includes(host));
    } catch {
      return false;
    }
  }, [src]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        container,
        className
      )}
    >
      {/* Fallback (always rendered, visible when image not loaded) */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full bg-muted",
          text,
          "font-medium text-muted-foreground",
          // Hide fallback when image is successfully loaded
          !showFallback && !isLoading && "opacity-0",
          fallbackClassName
        )}
        aria-hidden={!showFallback}
      >
        {initials}
      </div>

      {/* Optimized image */}
      {src && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={pixels}
          height={pixels}
          className={cn(
            "aspect-square h-full w-full object-cover",
            isLoading && "opacity-0"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          // Lazy load by default - loads when image is near viewport
          loading="lazy"
          // Use responsive sizes for different screen densities
          sizes={`${pixels}px`}
          // Prioritize quality for small images
          quality={90}
          // Skip optimization for external URLs to avoid domain config issues
          unoptimized={isExternalUrl}
        />
      )}
    </div>
  );
}

/**
 * getInitials - Helper function to extract initials from a name
 *
 * Usage:
 * ```tsx
 * const initials = getInitials("John Doe"); // "JD"
 * const initials = getInitials("john.doe@example.com"); // "J"
 * ```
 */
export function getInitials(name?: string | null): string {
  if (!name) return "?";

  // If it looks like an email, use first character
  if (name.includes("@")) {
    return name[0].toUpperCase();
  }

  return name
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default OptimizedAvatar;
