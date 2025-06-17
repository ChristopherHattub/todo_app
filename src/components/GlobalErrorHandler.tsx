import React, { useEffect, useCallback } from 'react';
import { AppError, ErrorType, ErrorSeverity } from '../types/errors';

// Simple notification system (could be replaced with a proper notification library)
interface NotificationService {
  addNotification: (notification: {
    id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    autoClose?: boolean;
    actions?: Array<{ label: string; action: () => void }>;
  }) => void;
}

// Global error handler configuration
const ERROR_HANDLER_CONFIG = {
  handleUnhandledRejections: true,
  handleGlobalErrors: true,
  reportErrors: true,
  showUserNotifications: true,
  logToConsole: true,
  enableErrorBoundaries: true
};

/**
 * Global error handler component
 * Catches unhandled errors and provides user-friendly error reporting
 */
export const GlobalErrorHandler: React.FC = () => {
  // Mock notification service - in real app this would come from context or props
  const notificationService: NotificationService = {
    addNotification: (notification) => {
      console.log('Notification:', notification);
      // In a real app, this would integrate with a notification system
    }
  };

  const createAppError = useCallback((
    error: Error,
    type: ErrorType = 'RUNTIME',
    severity: ErrorSeverity = 'medium',
    context?: any
  ): AppError => {
    const appError = error as AppError;
    appError.type = type;
    appError.severity = severity;
    appError.context = context;
    appError.timestamp = new Date();
    appError.recoverable = severity !== 'critical';
    appError.retryable = type !== 'VALIDATION';
    appError.retryCount = 0;
    appError.maxRetries = 3;

    return appError;
  }, []);

  const getUserFriendlyMessage = useCallback((error: AppError): string => {
    switch (error.type) {
      case 'NETWORK':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'STORAGE':
        if (error.message.includes('quota') || error.message.includes('storage')) {
          return 'Storage is full. Please free up some space and try again.';
        }
        return 'Data storage issue. Your changes may not be saved.';
      case 'VALIDATION':
        return 'Please check your input and try again.';
      case 'ANIMATION':
        return 'Animation error occurred. The app will continue to work normally.';
      case 'CONFIGURATION':
        return 'Application configuration error. Please refresh the page.';
      case 'PERMISSION':
        return 'Permission denied. Please check your browser settings.';
      case 'QUOTA_EXCEEDED':
        return 'Storage quota exceeded. Please free up some space.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }, []);

  const reportError = useCallback((error: AppError) => {
    if (!ERROR_HANDLER_CONFIG.reportErrors) return;

    const errorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: error.timestamp.toISOString(),
      type: error.type,
      severity: error.severity,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: error.context,
      recoverable: error.recoverable,
      retryable: error.retryable,
      retryCount: error.retryCount
    };

    // Log to console in development
    if (ERROR_HANDLER_CONFIG.logToConsole) {
      console.group('🚨 Global Error Report');
      console.error('Error:', error);
      console.log('Report:', errorReport);
      console.groupEnd();
    }

    // TODO: Send to error reporting service
    // Example: errorReportingService.send(errorReport);
  }, []);

  const showErrorNotification = useCallback((error: AppError) => {
    if (!ERROR_HANDLER_CONFIG.showUserNotifications) return;

    const userMessage = getUserFriendlyMessage(error);
    const notificationId = `error-${Date.now()}`;

    const actions = [];
    
    // Add retry action for retryable errors
    if (error.retryable && (error.retryCount ?? 0) < (error.maxRetries ?? 3)) {
      actions.push({
        label: 'Retry',
        action: () => {
          // Implement retry logic
          console.log('Retrying action...');
        }
      });
    }

    // Add report action for critical errors
    if (error.severity === 'critical' || error.severity === 'high') {
      actions.push({
        label: 'Report Issue',
        action: () => {
          reportError(error);
        }
      });
    }

    notificationService.addNotification({
      id: notificationId,
      type: error.severity === 'critical' ? 'error' : 'warning',
      title: `${error.type} Error`,
      message: userMessage,
      autoClose: error.severity === 'low',
      actions: actions.length > 0 ? actions : undefined
    });
  }, [getUserFriendlyMessage, reportError, notificationService]);

  const handleError = useCallback((error: Error | AppError, context?: any) => {
    let appError: AppError;

    if ('type' in error && 'severity' in error) {
      appError = error as AppError;
    } else {
      // Convert regular Error to AppError
      let errorType: ErrorType = 'RUNTIME';
      let severity: ErrorSeverity = 'medium';

      // Determine error type based on error message/properties
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorType = 'NETWORK';
      } else if (error.message.includes('storage') || error.message.includes('quota')) {
        errorType = 'STORAGE';
      } else if (error.message.includes('permission')) {
        errorType = 'PERMISSION';
      }

      // Determine severity
      if (error.name === 'ChunkLoadError' || error.message.includes('critical')) {
        severity = 'critical';
      } else if (error.message.includes('warning')) {
        severity = 'low';
      }

      appError = createAppError(error, errorType, severity, context);
    }

    // Report the error
    reportError(appError);

    // Show user notification
    showErrorNotification(appError);

    // Set up global error reporter for error boundaries
    if (!window.__ERROR_REPORTER__) {
      window.__ERROR_REPORTER__ = {
        reportError: (error: Error, context?: any) => {
          handleError(error, context);
        }
      };
    }
  }, [createAppError, reportError, showErrorNotification]);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (!ERROR_HANDLER_CONFIG.handleGlobalErrors) return;

      const error = event.error || new Error(event.message);
      handleError(error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'global'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!ERROR_HANDLER_CONFIG.handleUnhandledRejections) return;

      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      handleError(error, {
        type: 'unhandledRejection',
        promise: event.promise
      });

      // Prevent the default console error
      event.preventDefault();
    };

    // Add global error listeners
    if (ERROR_HANDLER_CONFIG.handleGlobalErrors) {
      window.addEventListener('error', handleGlobalError);
    }

    if (ERROR_HANDLER_CONFIG.handleUnhandledRejections) {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    // Set up global error reporter
    window.__ERROR_REPORTER__ = {
      reportError: handleError
    };

    // Cleanup
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      if (window.__ERROR_REPORTER__) {
        delete window.__ERROR_REPORTER__;
      }
    };
  }, [handleError]);

  // This component renders nothing, it just sets up global error handling
  return null;
}; 