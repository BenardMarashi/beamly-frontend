import { featureFlags } from '../config/env';

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

class ErrorMonitor {
  private errors: ErrorInfo[] = [];
  private maxErrors = 50; // Keep last 50 errors in memory

  logError(error: Error | ErrorInfo, context?: string) {
    const errorInfo: ErrorInfo = {
      message: error instanceof Error ? error.message : error.message,
      stack: error instanceof Error ? error.stack : error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...('componentStack' in error && { componentStack: error.componentStack }),
    };

    // Log to console
    console.error(`[${context || 'Error'}]`, errorInfo);

    // Store error
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // In production, you might want to send errors to a service
    if (featureFlags.enableErrorReporting && import.meta.env.PROD) {
      this.reportError(errorInfo);
    }
  }

  private reportError(errorInfo: ErrorInfo) {
    // Implement error reporting to your preferred service
    // Example: Sentry, LogRocket, etc.
    // For now, just log that we would report it
    console.log('Would report error to monitoring service:', errorInfo);
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}

// Create singleton instance
const errorMonitor = new ErrorMonitor();

// Initialize monitoring
export function initializeMonitoring() {
  // Global error handler
  window.addEventListener('error', (event) => {
    errorMonitor.logError(
      new Error(event.message),
      'Global Error'
    );
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    errorMonitor.logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      'Promise Rejection'
    );
  });

  // Log initialization
  console.log('🔍 Error monitoring initialized');
}

// Export functions for use in components
export const logError = (error: Error | ErrorInfo, context?: string) => 
  errorMonitor.logError(error, context);

export const getErrors = () => errorMonitor.getErrors();
export const clearErrors = () => errorMonitor.clearErrors();