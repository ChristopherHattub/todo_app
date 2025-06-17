import * as React from 'react';
import { ServiceToken, IServiceContainer } from './types';

const ServiceContainerContext = React.createContext<IServiceContainer | null>(null);

export interface ServiceProviderProps {
  container: IServiceContainer;
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ container, children }) => {
  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      container.dispose();
    };
  }, [container]);

  return (
    <ServiceContainerContext.Provider value={container}>
      {children}
    </ServiceContainerContext.Provider>
  );
};

export function useServiceContainer(): IServiceContainer {
  const container = React.useContext(ServiceContainerContext);
  if (!container) {
    throw new Error('useServiceContainer must be used within a ServiceProvider');
  }
  return container;
}

export function useService<T>(token: ServiceToken<T>): T {
  const container = useServiceContainer();
  const [service, setService] = React.useState<T>(() => container.resolve(token));

  React.useEffect(() => {
    // Re-resolve if container changes (shouldn't happen often)
    setService(container.resolve(token));
  }, [container, token]);

  return service;
}

export function useOptionalService<T>(token: ServiceToken<T>): T | null {
  const container = useServiceContainer();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Use a ref to store the current service value
  const serviceRef = React.useRef<T | null>(null);
  
  // Update the service value on each render
  serviceRef.current = container.tryResolve(token);

  React.useEffect(() => {
    // Force update when container or token changes
    forceUpdate();
  }, [container, token]);

  return serviceRef.current;
}

// Higher-order component for service injection
export function withServices<TProps extends object>(
  serviceMap: { [K in keyof TProps]?: ServiceToken<TProps[K]> }
) {
  return function <TComponent extends React.ComponentType<TProps>>(
    Component: TComponent
  ): React.FC<Omit<TProps, keyof typeof serviceMap>> {
    return function ServiceInjectedComponent(props) {
      const container = useServiceContainer();
      
      const services = Object.entries(serviceMap).reduce((acc, [key, token]) => {
        acc[key] = container.resolve(token as ServiceToken);
        return acc;
      }, {} as any);

      return <Component {...(props as TProps)} {...services} />;
    };
  };
} 