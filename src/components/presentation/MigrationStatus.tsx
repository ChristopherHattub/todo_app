import React from 'react';
import { PresentationComponentProps } from '../core/ComponentTypes';
import { LoadingSpinner } from './LoadingSpinner';

export interface MigrationStatusProps extends PresentationComponentProps {
  isInitialized: boolean;
  initializationError: Error | null;
  onRetry?: () => void;
}

export const MigrationStatus: React.FC<MigrationStatusProps> = ({
  isInitialized,
  initializationError,
  onRetry,
  className,
  'data-testid': testId,
  ...props
}) => {
  if (initializationError) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-red-50 ${className || ''}`}
        data-testid={testId}
        {...props}
      >
        <div className="text-center max-w-md p-6">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Migration Failed</h2>
          <p className="text-red-700 mb-4">
            Failed to initialize the new application architecture
          </p>
          <p className="text-sm text-red-600 mb-6">{initializationError.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry Migration
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-blue-50 ${className || ''}`}
        data-testid={testId}
        {...props}
      >
        <div className="text-center">
          <LoadingSpinner size="large" />
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Migrating Application</h2>
            <div className="space-y-2 text-sm text-blue-700">
              <p>✓ Initializing Dependency Injection Container</p>
              <p>✓ Setting up Service Layer</p>
              <p>✓ Configuring State Management</p>
              <p>⟳ Loading Application Components...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className || ''}`}
      data-testid={testId}
      {...props}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">Migration Complete</h3>
          <div className="mt-1 text-sm text-green-700">
            <p>Application successfully migrated to new modular architecture</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 