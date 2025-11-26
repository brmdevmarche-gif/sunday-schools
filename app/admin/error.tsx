"use client";

import { useEffect } from "react";
import { GeneralError } from "@/components/ui/error-display";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error caught:", error);

    // You can add error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }, [error]);

  return (
    <GeneralError
      title="Application Error"
      description="Something went wrong with the application. Please try refreshing the page or contact support if the problem persists."
      action={{
        label: "Try Again",
        onClick: () => window.location.reload(),
      }}
      secondaryAction={{
        label: "Go to Home",
        onClick: () => (window.location.href = "/admin"),
      }}
      showBackButton={true}
    />
  );
}
