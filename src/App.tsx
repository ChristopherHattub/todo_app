import React from 'react';
import { AppLayout } from './components/Layout/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TodoProvider } from './contexts/TodoContext';
// Import styles
import './styles/layout.css';
import './styles/entry-form.css';

/**
 * Main application component - Integration Phase 6
 * Includes all providers and error boundaries for full application functionality
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TodoProvider>
        <AppLayout />
      </TodoProvider>
    </ErrorBoundary>
  );
};

export default App; 