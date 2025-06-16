import React from 'react';
import { AppProvider } from '../../core/AppContext';
import { ServiceProvider } from '../../core/di/react';
import { StateProvider } from '../../state/StateProvider';
import { ApplicationBootstrap } from '../../core/ApplicationBootstrap';
import { withErrorBoundary } from '../hoc/withErrorBoundary';
import { LoadingSpinner } from '../presentation/LoadingSpinner';
import { TodoAppContent } from './TodoAppContent';

const bootstrap = new ApplicationBootstrap();

const TodoAppWithProviders: React.FC = () => {
  return (
    <AppProvider>
      <TodoAppContentWithServices />
    </AppProvider>
  );
};

const TodoAppContentWithServices: React.FC = () => {
  return (
    <ServiceProvider container={bootstrap.getServiceContainer()}>
      <StateProvider stateManager={bootstrap.getStateManager()}>
        <TodoAppWithLoading />
      </StateProvider>
    </ServiceProvider>
  );
};

const TodoAppWithLoading: React.FC = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        await bootstrap.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize application'));
      }
    };

    initializeApp();

    return () => {
      bootstrap.dispose();
    };
  }, []);

  if (error) {
    throw error; // Let error boundary handle this
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="large" 
          message="Initializing application..." 
          data-testid="app-loading"
        />
      </div>
    );
  }

  return <TodoAppContent />;
};

export const TodoApp = withErrorBoundary()(TodoAppWithProviders); 