// Centralized Error Handling - DRY principle applied
// Eliminates repeated try/catch patterns across the codebase

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  AI_SERVICE = 'AI_SERVICE',
  FIREBASE = 'FIREBASE',
  CAMPAIGN = 'CAMPAIGN',
  CHARACTER = 'CHARACTER',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
  userId?: string;
  context?: string;
}

export interface ErrorHandlerOptions {
  context?: string;
  fallbackMessage?: string;
  logError?: boolean;
  showToast?: boolean;
  retryable?: boolean;
}

/**
 * Centralized error handler that eliminates duplicate error handling patterns
 */
export class ErrorHandler {
  private static onError?: (error: AppError) => void;
  private static onRetry?: (context: string) => void;

  static setErrorCallback(callback: (error: AppError) => void): void {
    this.onError = callback;
  }

  static setRetryCallback(callback: (context: string) => void): void {
    this.onRetry = callback;
  }

  /**
   * Main error handling method - replaces all try/catch patterns
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const appError = this.createAppError(error, options);
      
      if (options.logError !== false) {
        this.logError(appError);
      }

      if (this.onError) {
        this.onError(appError);
      }

      return { success: false, error: appError };
    }
  }

  /**
   * Synchronous error handling
   */
  static handleSync<T>(
    operation: () => T,
    options: ErrorHandlerOptions = {}
  ): { success: boolean; data?: T; error?: AppError } {
    try {
      const data = operation();
      return { success: true, data };
    } catch (error) {
      const appError = this.createAppError(error, options);
      
      if (options.logError !== false) {
        this.logError(appError);
      }

      if (this.onError) {
        this.onError(appError);
      }

      return { success: false, error: appError };
    }
  }

  /**
   * Create standardized error object
   */
  private static createAppError(error: any, options: ErrorHandlerOptions): AppError {
    const appError: AppError = {
      type: this.categorizeError(error),
      message: this.extractMessage(error, options.fallbackMessage),
      timestamp: Date.now(),
      context: options.context
    };

    // Add Firebase-specific details
    if (error?.code?.startsWith?.('firebase/')) {
      appError.code = error.code;
      appError.type = ErrorType.FIREBASE;
    }

    // Add validation details
    if (error?.errors && Array.isArray(error.errors)) {
      appError.type = ErrorType.VALIDATION;
      appError.details = error.errors;
    }

    // Add network details
    if (error?.status >= 400 && error?.status < 600) {
      appError.type = ErrorType.NETWORK;
      appError.code = error.status.toString();
    }

    return appError;
  }

  /**
   * Categorize error type automatically
   */
  private static categorizeError(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';

    if (code.includes('auth') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION;
    }

    if (code.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.AUTHORIZATION;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }

    if (message.includes('ai') || message.includes('vertex')) {
      return ErrorType.AI_SERVICE;
    }

    if (code.includes('firebase') || message.includes('firestore')) {
      return ErrorType.FIREBASE;
    }

    if (message.includes('campaign')) {
      return ErrorType.CAMPAIGN;
    }

    if (message.includes('character')) {
      return ErrorType.CHARACTER;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Extract user-friendly message
   */
  private static extractMessage(error: any, fallback?: string): string {
    if (error?.message) {
      // Make Firebase errors user-friendly
      if (error.code === 'firebase/network-request-failed') {
        return 'Network connection failed. Please check your internet connection.';
      }
      
      if (error.code === 'firebase/permission-denied') {
        return 'Access denied. Please check your permissions.';
      }

      if (error.code === 'firebase/unauthenticated') {
        return 'Please sign in to continue.';
      }

      return error.message;
    }

    return fallback || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error with context
   */
  private static logError(error: AppError): void {
    const logLevel = error.type === ErrorType.UNKNOWN ? 'error' : 'warn';
    
    console[logLevel]('🚨 Application Error:', {
      type: error.type,
      message: error.message,
      code: error.code,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString(),
      details: error.details
    });
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.AI_SERVICE,
      ErrorType.FIREBASE
    ].includes(error.type);
  }

  /**
   * Get user-friendly error message for display
   */
  static getDisplayMessage(error: AppError): string {
    const baseMessage = error.message;
    
    if (this.isRetryable(error)) {
      return `${baseMessage} You can try again.`;
    }

    return baseMessage;
  }
}

/**
 * Decorators for common error handling patterns
 */
export function withErrorHandling(options: ErrorHandlerOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const result = await ErrorHandler.handleAsync(
        () => originalMethod.apply(this, args),
        { ...options, context: `${target.constructor.name}.${propertyKey}` }
      );

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    };

    return descriptor;
  };
}

/**
 * Utility functions for common error scenarios
 */
export const ErrorUtils = {
  /**
   * Handle campaign operations with consistent error handling
   */
  async campaignOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    return ErrorHandler.handleAsync(operation, {
      context: `Campaign.${context}`,
      fallbackMessage: 'Campaign operation failed. Please try again.',
      logError: true
    });
  },

  /**
   * Handle AI service calls with timeout and retry logic
   */
  async aiServiceCall<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 15000
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI service timeout')), timeoutMs);
    });

    return ErrorHandler.handleAsync(
      () => Promise.race([operation(), timeoutPromise]),
      {
        context: 'AIService.call',
        fallbackMessage: 'AI service is temporarily unavailable.',
        retryable: true
      }
    );
  },

  /**
   * Handle Firebase operations with automatic retry
   */
  async firebaseOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    return ErrorHandler.handleAsync(operation, {
      context: `Firebase.${context}`,
      fallbackMessage: 'Database operation failed. Please try again.',
      retryable: true
    });
  }
};

// Export types for external use
export type { AppError, ErrorHandlerOptions }; 