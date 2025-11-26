import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  Server,
  ShieldAlert,
  FileX,
  ArrowLeft,
} from "lucide-react";
import { SimpleButton } from "@/components/ui/simple-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorDisplayProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  showBackButton?: boolean;
}

export function NetworkError({ action, secondaryAction }: ErrorDisplayProps) {
  const defaultAction = action || {
    label: "Try Again",
    onClick: () => window.location.reload(),
  };

  return (
    <ErrorCard
      icon={<Wifi className="h-6 w-6 text-destructive" />}
      title="Connection Problem"
      description="Unable to connect to the server. Please check your internet connection and try again."
      action={defaultAction}
      secondaryAction={secondaryAction}
    />
  );
}

export function ServerError({ action, secondaryAction }: ErrorDisplayProps) {
  const defaultAction = action || {
    label: "Refresh Page",
    onClick: () => window.location.reload(),
  };

  return (
    <ErrorCard
      icon={<Server className="h-6 w-6 text-destructive" />}
      title="Server Error"
      description="Our servers are having trouble processing your request. Please try again in a few moments."
      action={defaultAction}
      secondaryAction={secondaryAction}
    />
  );
}

export function UnauthorizedError({
  action,
  secondaryAction,
}: ErrorDisplayProps) {
  const defaultAction = action || {
    label: "Sign In",
    onClick: () => (window.location.href = "/login"),
  };

  return (
    <ErrorCard
      icon={<ShieldAlert className="h-6 w-6 text-destructive" />}
      title="Access Denied"
      description="You don't have permission to access this resource. Please sign in or contact an administrator."
      action={defaultAction}
      secondaryAction={secondaryAction}
    />
  );
}

export function NotFoundError({
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
  action,
  secondaryAction,
  showBackButton = true,
}: ErrorDisplayProps) {
  const defaultAction = action || {
    label: "Go Home",
    onClick: () => (window.location.href = "/"),
  };

  const defaultSecondaryAction =
    secondaryAction ||
    (showBackButton
      ? {
          label: "Go Back",
          onClick: () => window.history.back(),
        }
      : undefined);

  return (
    <ErrorCard
      icon={<FileX className="h-6 w-6 text-destructive" />}
      title={title}
      description={description}
      action={defaultAction}
      secondaryAction={defaultSecondaryAction}
    />
  );
}

export function GeneralError({
  title = "Something Went Wrong",
  description = "An unexpected error occurred. Please try again or contact support if the problem persists.",
  action,
  secondaryAction,
}: ErrorDisplayProps) {
  const defaultAction = action || {
    label: "Try Again",
    onClick: () => window.location.reload(),
  };

  return (
    <ErrorCard
      icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
      title={title}
      description={description}
      action={defaultAction}
      secondaryAction={secondaryAction}
    />
  );
}

function ErrorCard({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <SimpleButton onClick={action.onClick} className="flex-1">
              {action.label}
            </SimpleButton>
            {secondaryAction && (
              <SimpleButton
                variant="outline"
                onClick={secondaryAction.onClick}
                className="flex-1"
              >
                {secondaryAction.label}
              </SimpleButton>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to determine error type and return appropriate component
export function useErrorType(error: unknown) {
  if (!error) return null;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return "network";
    }
    if (message.includes("unauthorized") || message.includes("403")) {
      return "unauthorized";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "notFound";
    }
    if (message.includes("server") || message.includes("500")) {
      return "server";
    }
  }

  return "general";
}

export function ErrorDisplay({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const errorType = useErrorType(error);
  const action = onRetry ? { label: "Try Again", onClick: onRetry } : undefined;

  switch (errorType) {
    case "network":
      return <NetworkError action={action} />;
    case "server":
      return <ServerError action={action} />;
    case "unauthorized":
      return <UnauthorizedError action={action} />;
    case "notFound":
      return <NotFoundError action={action} />;
    default:
      return <GeneralError action={action} />;
  }
}
