/**
 * Error handling type definitions for the ToDo List Tracker application
 */

import React from 'react';

/**
 * Application error types
 */
export type ErrorType = 
  | 'VALIDATION'
  | 'STORAGE'
  | 'NETWORK'
  | 'ANIMATION'
  | 'RUNTIME'
  | 'CONFIGURATION'
  | 'PERMISSION'
  | 'QUOTA_EXCEEDED';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Structured application error
 */
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: Date;
  recoverable: boolean;
  userMessage?: string;
  technicalMessage?: string;
  errorCode?: string;
  retryable?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onRetry?: () => void;
  onReset?: () => void;
  onReport?: (error: Error, errorInfo?: React.ErrorInfo) => void;
  context?: string;
  showDetails?: boolean;
}

/**
 * Error recovery strategies
 */
export interface ErrorRecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<boolean>;
  getRecoveryMessage: (error: AppError) => string;
}

/**
 * Error reporting configuration
 */
export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  includeStackTrace: boolean;
  includeUserAgent: boolean;
  includeContext: boolean;
  batchReports: boolean;
  batchSize: number;
  retryFailedReports: boolean;
}

/**
 * Global error handler configuration
 */
export interface GlobalErrorHandlerConfig {
  handleUnhandledRejections: boolean;
  handleGlobalErrors: boolean;
  reportErrors: boolean;
  showUserNotifications: boolean;
  logToConsole: boolean;
  enableErrorBoundaries: boolean;
}

/**
 * Error notification
 */
export interface ErrorNotification {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  actions?: ErrorNotificationAction[];
  autoClose?: boolean;
  autoCloseDelay?: number;
  persistent?: boolean;
}

/**
 * Error notification action
 */
export interface ErrorNotificationAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
  destructive?: boolean;
}

/**
 * Error factory for creating standardized errors
 */
export interface ErrorFactory {
  createValidationError: (message: string, context?: any) => AppError;
  createStorageError: (message: string, context?: any) => AppError;
  createNetworkError: (message: string, context?: any) => AppError;
  createAnimationError: (message: string, context?: any) => AppError;
  createRuntimeError: (message: string, context?: any) => AppError;
  createConfigurationError: (message: string, context?: any) => AppError;
  createPermissionError: (message: string, context?: any) => AppError;
  createQuotaExceededError: (message: string, context?: any) => AppError;
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  handleError: (error: Error | AppError, context?: any) => void;
  reportError: (error: Error | AppError, context?: any) => Promise<void>;
  isRetryable: (error: Error | AppError) => boolean;
  getRecoveryStrategy: (error: Error | AppError) => ErrorRecoveryStrategy | null;
}

/**
 * Feature error boundary props
 */
export interface FeatureErrorBoundaryProps {
  featureName: string;
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolateFailure?: boolean;
  children: React.ReactNode;
}

/**
 * Error context value
 */
export interface ErrorContextValue {
  reportError: (error: Error | AppError, context?: any) => void;
  clearError: (errorId: string) => void;
  retryLastAction: () => Promise<void>;
  errors: AppError[];
  hasErrors: boolean;
}

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid format',
    TOO_LONG: 'Value is too long',
    TOO_SHORT: 'Value is too short',
    INVALID_NUMBER: 'Must be a valid number',
    OUT_OF_RANGE: 'Value is out of allowed range',
    CONTAINS_XSS: 'Contains potentially harmful content'
  },
  STORAGE: {
    QUOTA_EXCEEDED: 'Storage quota exceeded',
    ACCESS_DENIED: 'Storage access denied',
    CORRUPTED_DATA: 'Data appears to be corrupted',
    MIGRATION_FAILED: 'Data migration failed'
  },
  NETWORK: {
    CONNECTION_LOST: 'Network connection lost',
    TIMEOUT: 'Request timed out',
    SERVER_ERROR: 'Server error occurred',
    FORBIDDEN: 'Access forbidden'
  },
  ANIMATION: {
    WEBGL_NOT_SUPPORTED: 'WebGL not supported',
    CANVAS_CONTEXT_LOST: 'Canvas context lost',
    ANIMATION_FAILED: 'Animation failed to play'
  },
  RUNTIME: {
    UNEXPECTED_ERROR: 'An unexpected error occurred',
    COMPONENT_CRASHED: 'Component crashed',
    STATE_CORRUPTION: 'Application state corrupted'
  },
  CONFIGURATION: {
    INVALID_CONFIG: 'Invalid configuration',
    MISSING_REQUIRED_CONFIG: 'Missing required configuration',
    CONFIG_LOAD_FAILED: 'Failed to load configuration'
  }
} as const; 