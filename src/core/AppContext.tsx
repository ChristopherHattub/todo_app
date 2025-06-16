import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApplicationBootstrap } from './ApplicationBootstrap';

interface AppContextValue {
  bootstrap: ApplicationBootstrap;
  isInitialized: boolean;
  initializationError: Error | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [bootstrap] = useState(() => new ApplicationBootstrap());
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await bootstrap.initialize();
        setIsInitialized(true);
      } catch (error) {
        setInitializationError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    initializeApp();

    return () => {
      bootstrap.dispose();
    };
  }, [bootstrap]);

  const contextValue: AppContextValue = {
    bootstrap,
    isInitialized,
    initializationError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 