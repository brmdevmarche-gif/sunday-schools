"use client";

import { useState } from "react";
import { SimpleButton } from "@/components/ui/simple-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast, useErrorToast } from "@/components/ui/toast";
import { useErrorHandler } from "@/components/ui/error-boundary";
import {
  AppError,
  NetworkError,
  ValidationError,
  retryOperation,
} from "@/lib/error-handling";
import { LoadingSpinner } from "@/components/ui/loading";

export function ErrorHandlingDemo() {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const showErrorToast = useErrorToast();
  const handleError = useErrorHandler();

  const simulateSuccess = () => {
    showSuccess(
      "Operation Successful",
      "Your data has been saved successfully."
    );
  };

  const simulateError = () => {
    showError(
      "Operation Failed",
      "Something went wrong while processing your request."
    );
  };

  const simulateWarning = () => {
    showWarning("Warning", "This action cannot be undone.");
  };

  const simulateInfo = () => {
    showInfo("Information", "Your session will expire in 5 minutes.");
  };

  const simulateNetworkError = () => {
    const error = new NetworkError();
    showErrorToast(error);
  };

  const simulateValidationError = () => {
    const error = new ValidationError("Email address is invalid", "email");
    showErrorToast(error);
  };

  const simulateAppError = () => {
    const error = new AppError(
      "Database connection failed",
      503,
      "DB_CONNECTION_ERROR",
      "The service is temporarily unavailable. Please try again in a few minutes."
    );
    showErrorToast(error);
  };

  const simulateCriticalError = () => {
    // This will be caught by the error boundary
    handleError(
      new Error(
        "Critical application error - this will trigger the error boundary"
      )
    );
  };

  const simulateAsyncOperation = async () => {
    setLoading(true);
    try {
      await retryOperation(
        async () => {
          // Simulate random failure
          if (Math.random() > 0.7) {
            throw new NetworkError("Connection failed");
          }

          // Simulate delay
          await new Promise((resolve) => setTimeout(resolve, 2000));

          return "Success!";
        },
        3,
        1000
      );

      showSuccess(
        "Async Operation Complete",
        "The operation completed successfully after retries."
      );
    } catch (error) {
      showErrorToast(error, "Failed to complete the operation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling & Toast Notifications Demo</CardTitle>
          <CardDescription>
            Test the error handling and notification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Toast Notifications</h4>
              <div className="space-y-2">
                <SimpleButton
                  onClick={simulateSuccess}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  Show Success
                </SimpleButton>
                <SimpleButton
                  onClick={simulateError}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Show Error
                </SimpleButton>
                <SimpleButton
                  onClick={simulateWarning}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Show Warning
                </SimpleButton>
                <SimpleButton
                  onClick={simulateInfo}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Show Info
                </SimpleButton>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Error Types</h4>
              <div className="space-y-2">
                <SimpleButton
                  onClick={simulateNetworkError}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Network Error
                </SimpleButton>
                <SimpleButton
                  onClick={simulateValidationError}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Validation Error
                </SimpleButton>
                <SimpleButton
                  onClick={simulateAppError}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  App Error
                </SimpleButton>
                <SimpleButton
                  onClick={simulateCriticalError}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Critical Error
                </SimpleButton>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Async Operation with Retry</h4>
            <SimpleButton
              onClick={simulateAsyncOperation}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                "Start Async Operation"
              )}
            </SimpleButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
