/**
 * React DI integration test suite
 * Tests service provider, hooks, and higher-order components
 */

import React from 'react';
import { render, screen, renderHook } from '@testing-library/react';
import { ServiceProvider, useServiceContainer, useService, useOptionalService, withServices } from '../react';
import { ServiceContainer } from '../ServiceContainer';
import { createServiceToken } from '../ServiceToken';
import { ServiceFactory } from '../types';

describe('React DI Integration', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(async () => {
    await container.dispose();
  });

  describe('ServiceProvider', () => {
    it('should provide service container to children', () => {
      const TestComponent: React.FC = () => {
        const serviceContainer = useServiceContainer();
        return <div data-testid="container-available">{serviceContainer ? 'Available' : 'Not Available'}</div>;
      };

      render(
        <ServiceProvider container={container}>
          <TestComponent />
        </ServiceProvider>
      );

      expect(screen.getByTestId('container-available')).toHaveTextContent('Available');
    });

    it('should dispose container on unmount', async () => {
      const disposeSpy = jest.spyOn(container, 'dispose');
      
      const { unmount } = render(
        <ServiceProvider container={container}>
          <div>Test</div>
        </ServiceProvider>
      );

      unmount();

      // Wait for effect cleanup
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should handle multiple providers', () => {
      const container1 = new ServiceContainer();
      const container2 = new ServiceContainer();
      
      const TestComponent: React.FC = () => {
        const serviceContainer = useServiceContainer();
        return <div data-testid="inner-container">{serviceContainer === container2 ? 'Inner' : 'Outer'}</div>;
      };

      render(
        <ServiceProvider container={container1}>
          <ServiceProvider container={container2}>
            <TestComponent />
          </ServiceProvider>
        </ServiceProvider>
      );

      expect(screen.getByTestId('inner-container')).toHaveTextContent('Inner');
    });
  });

  describe('useServiceContainer', () => {
    it('should return service container when inside provider', () => {
      const { result } = renderHook(() => useServiceContainer(), {
        wrapper: ({ children }) => (
          <ServiceProvider container={container}>
            {children}
          </ServiceProvider>
        )
      });

      expect(result.current).toBe(container);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        renderHook(() => useServiceContainer());
      } catch (error) {
        expect(error).toEqual(
          expect.objectContaining({
            message: expect.stringContaining('useServiceContainer must be used within a ServiceProvider')
          })
        );
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('useService', () => {
    it('should resolve service from container', () => {
      const token = createServiceToken<string>('TestService');
      const testValue = 'test-service-value';
      
      container.registerInstance(token, testValue);

      const { result } = renderHook(() => useService(token), {
        wrapper: ({ children }) => (
          <ServiceProvider container={container}>
            {children}
          </ServiceProvider>
        )
      });

      expect(result.current).toBe(testValue);
    });

    it('should re-resolve when container changes', () => {
      const token = createServiceToken<string>('TestService');
      const container1 = new ServiceContainer();
      const container2 = new ServiceContainer();
      
      container1.registerInstance(token, 'value1');
      container2.registerInstance(token, 'value2');

      let currentContainer = container1;
      
      const { result, rerender } = renderHook(() => useService(token), {
        wrapper: ({ children }) => (
          <ServiceProvider container={currentContainer}>
            {children}
          </ServiceProvider>
        )
      });

      expect(result.current).toBe('value1');

      // Change container
      currentContainer = container2;
      rerender();

      expect(result.current).toBe('value2');
    });

    it('should throw error for unregistered service', () => {
      const token = createServiceToken<string>('UnregisteredService');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        renderHook(() => useService(token), {
          wrapper: ({ children }) => (
            <ServiceProvider container={container}>
              {children}
            </ServiceProvider>
          )
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleSpy.mockRestore();
    });
  });

  describe('useOptionalService', () => {
    it('should resolve service when available', () => {
      const token = createServiceToken<string>('TestService');
      const testValue = 'optional-service-value';
      
      container.registerInstance(token, testValue);

      const { result } = renderHook(() => useOptionalService(token), {
        wrapper: ({ children }) => (
          <ServiceProvider container={container}>
            {children}
          </ServiceProvider>
        )
      });

      expect(result.current).toBe(testValue);
    });

    it('should return null for unregistered service', () => {
      const token = createServiceToken<string>('UnregisteredService');

      const { result } = renderHook(() => useOptionalService(token), {
        wrapper: ({ children }) => (
          <ServiceProvider container={container}>
            {children}
          </ServiceProvider>
        )
      });

      expect(result.current).toBeNull();
    });

    it('should handle service registration after hook creation', () => {
      const token = createServiceToken<string>('DynamicService');

      const { result, rerender } = renderHook(() => useOptionalService(token), {
        wrapper: ({ children }) => (
          <ServiceProvider container={container}>
            {children}
          </ServiceProvider>
        )
      });

      expect(result.current).toBeNull();

      // Register service
      container.registerInstance(token, 'dynamic-value');
      rerender();

      expect(result.current).toBe('dynamic-value');
    });
  });

  describe('withServices HOC', () => {
    interface TestProps {
      testService?: string;
      optionalService?: string;
      regularProp: string;
    }

    it('should inject services as props', () => {
      const testToken = createServiceToken<string>('TestService');
      const optionalToken = createServiceToken<string>('OptionalService');
      
      container.registerInstance(testToken, 'injected-value');
      container.registerInstance(optionalToken, 'optional-value');

      const TestComponent: React.FC<TestProps> = ({ testService, optionalService, regularProp }) => (
        <div>
          <span data-testid="test-service">{testService}</span>
          <span data-testid="optional-service">{optionalService}</span>
          <span data-testid="regular-prop">{regularProp}</span>
        </div>
      );

      const InjectedComponent = withServices({
        testService: testToken,
        optionalService: optionalToken
      })(TestComponent);

      render(
        <ServiceProvider container={container}>
          <InjectedComponent regularProp="regular-value" />
        </ServiceProvider>
      );

      expect(screen.getByTestId('test-service')).toHaveTextContent('injected-value');
      expect(screen.getByTestId('optional-service')).toHaveTextContent('optional-value');
      expect(screen.getByTestId('regular-prop')).toHaveTextContent('regular-value');
    });

    it('should handle partial service injection', () => {
      const testToken = createServiceToken<string>('TestService');
      
      container.registerInstance(testToken, 'partial-injection');

      const TestComponent: React.FC<TestProps> = ({ testService, regularProp }) => (
        <div>
          <span data-testid="test-service">{testService || 'no-service'}</span>
          <span data-testid="regular-prop">{regularProp}</span>
        </div>
      );

      const InjectedComponent = withServices({
        testService: testToken
      })(TestComponent);

      render(
        <ServiceProvider container={container}>
          <InjectedComponent regularProp="regular-value" />
        </ServiceProvider>
      );

      expect(screen.getByTestId('test-service')).toHaveTextContent('partial-injection');
      expect(screen.getByTestId('regular-prop')).toHaveTextContent('regular-value');
    });

    it('should preserve original component props', () => {
      const testToken = createServiceToken<string>('TestService');
      container.registerInstance(testToken, 'hoc-service');

      const TestComponent: React.FC<TestProps> = (props) => (
        <div data-testid="props-count">{Object.keys(props).length}</div>
      );

      const InjectedComponent = withServices({
        testService: testToken
      })(TestComponent);

      render(
        <ServiceProvider container={container}>
          <InjectedComponent regularProp="test" />
        </ServiceProvider>
      );

      // Should have both injected service and regular prop
      expect(screen.getByTestId('props-count')).toHaveTextContent('2');
    });
  });

  describe('error scenarios', () => {
    it('should handle service resolution errors gracefully', () => {
      const token = createServiceToken<string>('FailingService');
      const factory: ServiceFactory<string> = {
        create: () => {
          throw new Error('Service creation failed');
        }
      };

      container.register(token, factory);

      const TestComponent: React.FC = () => {
        try {
          const service = useService(token);
          return <div data-testid="service-result">{service}</div>;
        } catch (error) {
          return <div data-testid="service-error">Error occurred</div>;
        }
      };

      render(
        <ServiceProvider container={container}>
          <TestComponent />
        </ServiceProvider>
      );

      expect(screen.getByTestId('service-error')).toHaveTextContent('Error occurred');
    });

    it('should handle container disposal during component lifecycle', async () => {
      const token = createServiceToken<string>('TestService');
      container.registerInstance(token, 'test-value');

      const TestComponent: React.FC = () => {
        const service = useOptionalService(token);
        return <div data-testid="service-status">{service ? 'Available' : 'Not Available'}</div>;
      };

      const { unmount } = render(
        <ServiceProvider container={container}>
          <TestComponent />
        </ServiceProvider>
      );

      expect(screen.getByTestId('service-status')).toHaveTextContent('Available');

      unmount();
      
      // Container should be disposed
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  describe('performance considerations', () => {
    it('should not cause unnecessary re-renders', () => {
      const token = createServiceToken<{ value: string }>('StableService');
      const stableService = { value: 'stable' };
      
      container.registerInstance(token, stableService);

      let renderCount = 0;
      
      const TestComponent: React.FC = () => {
        renderCount++;
        const service = useService(token);
        return <div data-testid="render-count">{renderCount}</div>;
      };

      const { rerender } = render(
        <ServiceProvider container={container}>
          <TestComponent />
        </ServiceProvider>
      );

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Force re-render
      rerender(
        <ServiceProvider container={container}>
          <TestComponent />
        </ServiceProvider>
      );

      // Should only render twice (initial + rerender), not more
      expect(screen.getByTestId('render-count')).toHaveTextContent('2');
    });
  });
}); 