import React from 'react';
import { PresentationComponentProps, LoadingComponentProps } from '../core/ComponentTypes';

export interface LoadingSpinnerProps extends PresentationComponentProps, LoadingComponentProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className,
  'data-testid': testId,
  ...props
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className || ''}`}
      data-testid={testId}
      {...props}
    >
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`} />
      {message && (
        <p className="text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
}; 