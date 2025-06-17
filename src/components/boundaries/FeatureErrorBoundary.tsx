import React, { Component } from 'react';
import { FeatureErrorBoundaryProps, ErrorBoundaryState } from '../../types/errors';
import { ErrorFallback } from '../presentation/ErrorFallback';

/**
 * Feature-specific error boundary component
 * Isolates errors to prevent full application crashes
 */
export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Feature "${this.props.featureName}" error boundary caught an error:`, error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Call the optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to global error handler if needed
    if (window.__ERROR_REPORTER__) {
      window.__ERROR_REPORTER__.reportError(error, {
        feature: this.props.featureName,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      console.warn(`Feature "${this.props.featureName}" has exceeded maximum retry attempts`);
      return;
    }

    console.log(`Retrying feature "${this.props.featureName}" (attempt ${retryCount + 1}/${maxRetries})`);

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: retryCount + 1
    });
  };

  handleReset = () => {
    console.log(`Resetting feature "${this.props.featureName}"`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    });
  };

  handleReport = (error: Error, errorInfo?: React.ErrorInfo) => {
    console.log(`Reporting error for feature "${this.props.featureName}"`);
    
    // Create a detailed error report
    const errorReport = {
      feature: this.props.featureName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: errorInfo ? {
        componentStack: errorInfo.componentStack
      } : this.state.errorInfo ? {
        componentStack: this.state.errorInfo.componentStack
      } : null,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // Log to console for development
    console.error('Error Report:', errorReport);

    // TODO: Send to error reporting service
    // Example: errorReportingService.report(errorReport);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback component if provided
      const FallbackComponent = this.props.fallbackComponent || ErrorFallback;
      
      return (
        <div className="feature-error-boundary" data-feature={this.props.featureName}>
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo || undefined}
            onRetry={this.handleRetry}
            onReset={this.handleReset}
            onReport={this.handleReport}
            context={this.props.featureName}
            showDetails={process.env.NODE_ENV === 'development'}
          />
          
          {!this.props.isolateFailure && (
            <div className="feature-error-boundary__isolation-warning">
              <p>
                <strong>Note:</strong> This error has been isolated to the "{this.props.featureName}" feature.
                Other parts of the application should continue to work normally.
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withFeatureErrorBoundary<P extends object>(
  featureName: string,
  fallbackComponent?: React.ComponentType<any>
) {
  return function (WrappedComponent: React.ComponentType<P>) {
    const WithFeatureErrorBoundary: React.FC<P> = (props) => (
      <FeatureErrorBoundary
        featureName={featureName}
        fallbackComponent={fallbackComponent}
      >
        <WrappedComponent {...props} />
      </FeatureErrorBoundary>
    );

    WithFeatureErrorBoundary.displayName = `withFeatureErrorBoundary(${featureName})(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithFeatureErrorBoundary;
  };
}

// Declare global error reporter interface
declare global {
  interface Window {
    __ERROR_REPORTER__?: {
      reportError: (error: Error, context?: any) => void;
    };
  }
} 