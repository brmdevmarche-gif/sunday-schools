import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

interface ButtonLoadingProps {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function ButtonLoading({
  children,
  loading,
  className,
}: ButtonLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </div>
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="space-y-3 p-6 border rounded-lg">
      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      <div className="h-20 bg-muted rounded animate-pulse" />
    </div>
  );
}

interface FullPageLoadingProps {
  message?: string;
  showLogo?: boolean;
}

export function FullPageLoading({
  message = "Loading application...",
  showLogo = true,
}: FullPageLoadingProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        {showLogo && (
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">
              K
            </span>
          </div>
        )}
        <div className="space-y-4">
          <LoadingSpinner size="lg" className="mx-auto text-primary" />
          <div className="space-y-2">
            <p className="text-lg font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we set things up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
