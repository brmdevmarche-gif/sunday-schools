// Utility functions for error handling throughout the application

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly userMessage: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "UNKNOWN_ERROR",
    userMessage?: string
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage = userMessage || this.getDefaultUserMessage(statusCode);
  }

  private getDefaultUserMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return "The request was invalid. Please check your input and try again.";
      case 401:
        return "You need to sign in to access this resource.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This action conflicts with existing data.";
      case 422:
        return "The provided data is invalid.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "An internal server error occurred. Please try again.";
      case 502:
      case 503:
      case 504:
        return "The service is temporarily unavailable. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }
}

// Network error handling
export class NetworkError extends AppError {
  constructor(message: string = "Network connection failed") {
    super(
      message,
      0,
      "NETWORK_ERROR",
      "Unable to connect to the server. Please check your internet connection and try again."
    );
  }
}

// Validation error handling
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(
      message,
      422,
      "VALIDATION_ERROR",
      "Please check your input and try again."
    );
    this.field = field;
  }
}

// API response error handler
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let userMessage: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      userMessage = errorData.userMessage;
    } catch {
      // If we can't parse the error response, use the default message
    }

    throw new AppError(
      errorMessage,
      response.status,
      `HTTP_${response.status}`,
      userMessage
    );
  }

  return response.json();
}

// Fetch wrapper with error handling
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return await handleApiResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError();
    }
    throw error;
  }
}

// Error logging utility
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : "";

  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr}Error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error(`${timestamp} ${contextStr}Unknown error:`, error);
  }

  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
}

// Safe async operation wrapper
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

// Form validation helper
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || value === "") {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please enter a valid email address", "email");
  }
}

export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): void {
  if (value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters long`,
      fieldName
    );
  }
}

// Generic retry mechanism
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on client errors (4xx)
      if (
        error instanceof AppError &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}
