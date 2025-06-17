import React from 'react';
import { ErrorFallbackProps } from '../../types/errors';
import './ErrorFallback.css';

/**
 * Standardized error fallback UI component
 * Provides consistent error presentation throughout the application
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReset,
  onReport,
  context,
  showDetails = false
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const handleReport = () => {
    if (onReport) {
      onReport(error, errorInfo);
    }
  };

  const getErrorTitle = () => {
    if (context) {
      return `${context} Error`;
    }
    return 'Something went wrong';
  };

  const getErrorMessage = () => {
    // Show a user-friendly message by default
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'The application failed to load properly. This might be due to a network issue or an app update.';
    }
    
    if (error.message.includes('Network')) {
      return 'A network error occurred. Please check your internet connection and try again.';
    }

    if (error.message.includes('Storage') || error.message.includes('quota')) {
      return 'Storage is full or unavailable. Please free up some space and try again.';
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  return (
    <div className="error-fallback" role="alert">
      <div className="error-fallback__container">
        <div className="error-fallback__icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="error-fallback__content">
          <h2 className="error-fallback__title">{getErrorTitle()}</h2>
          <p className="error-fallback__message">{getErrorMessage()}</p>

          {(isDevelopment || showDetails) && (
            <details className="error-fallback__details">
              <summary>Technical Details</summary>
              <div className="error-fallback__technical">
                <div className="error-fallback__error-message">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="error-fallback__stack-trace">
                    <strong>Stack Trace:</strong>
                    <pre>{error.stack}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div className="error-fallback__component-stack">
                    <strong>Component Stack:</strong>
                    <pre>{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="error-fallback__actions">
          {onRetry && (
            <button
              type="button"
              className="error-fallback__button error-fallback__button--primary"
              onClick={onRetry}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Try Again
            </button>
          )}

          {onReset && (
            <button
              type="button"
              className="error-fallback__button error-fallback__button--secondary"
              onClick={onReset}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset
            </button>
          )}

          {onReport && (
            <button
              type="button"
              className="error-fallback__button error-fallback__button--tertiary"
              onClick={handleReport}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              Report Error
            </button>
          )}

          <button
            type="button"
            className="error-fallback__button error-fallback__button--secondary"
            onClick={() => window.location.reload()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}; 