import React from 'react';

// Base props for all presentation components
export interface PresentationComponentProps {
  className?: string;
  'data-testid'?: string;
  style?: React.CSSProperties;
  id?: string;
  children?: React.ReactNode;
}

// Base props for container components
export interface ContainerComponentProps {
  children?: React.ReactNode;
}

// Props for components with loading states
export interface LoadingComponentProps {
  isLoading?: boolean;
  loadingMessage?: string;
}

// Props for components with error states
export interface ErrorComponentProps {
  error?: Error | null;
  onErrorRetry?: () => void;
} 