/**
 * ServiceContainer test suite
 * Tests service registration, resolution, lifecycle management, and error handling
 */

import { ServiceContainer } from '../ServiceContainer';
import { createServiceToken } from '../ServiceToken';
import { ServiceLifetime, ServiceError, ServiceFactory } from '../types';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(async () => {
    await container.dispose();
  });

  describe('service registration', () => {
    it('should register a singleton service', () => {
      const token = createServiceToken<string>('TestService');
      const factory: ServiceFactory<string> = {
        create: () => 'test-value'
      };

      container.register(token, factory, ServiceLifetime.SINGLETON);
      
      expect(container.isRegistered(token)).toBe(true);
    });

    it('should register a transient service', () => {
      const token = createServiceToken<string>('TestService');
      const factory: ServiceFactory<string> = {
        create: () => 'test-value'
      };

      container.register(token, factory, ServiceLifetime.TRANSIENT);
      
      expect(container.isRegistered(token)).toBe(true);
    });

    it('should register a scoped service', () => {
      const token = createServiceToken<string>('TestService');
      const factory: ServiceFactory<string> = {
        create: () => 'test-value'
      };

      container.register(token, factory, ServiceLifetime.SCOPED);
      
      expect(container.isRegistered(token)).toBe(true);
    });

    it('should default to singleton lifetime', () => {
      const token = createServiceToken<string>('TestService');
      const factory: ServiceFactory<string> = {
        create: () => 'test-value'
      };

      container.register(token, factory);
      
      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);
      
      expect(instance1).toBe(instance2);
    });

    it('should allow overriding existing registrations', () => {
      const token = createServiceToken<string>('TestService');
      const factory1: ServiceFactory<string> = {
        create: () => 'value1'
      };
      const factory2: ServiceFactory<string> = {
        create: () => 'value2'
      };

      container.register(token, factory1);
      container.register(token, factory2);
      
      const instance = container.resolve(token);
      expect(instance).toBe('value2');
    });

    it('should register instance directly', () => {
      const token = createServiceToken<string>('TestService');
      const instance = 'direct-instance';

      container.registerInstance(token, instance);
      
      expect(container.isRegistered(token)).toBe(true);
      expect(container.resolve(token)).toBe(instance);
    });
  });

  describe('service resolution', () => {
    it('should resolve singleton services as same instance', () => {
      const token = createServiceToken<object>('TestService');
      const factory: ServiceFactory<object> = {
        create: () => ({ id: Math.random() })
      };

      container.register(token, factory, ServiceLifetime.SINGLETON);
      
      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);
      
      expect(instance1).toBe(instance2);
    });

    it('should resolve transient services as different instances', () => {
      const token = createServiceToken<object>('TestService');
      const factory: ServiceFactory<object> = {
        create: () => ({ id: Math.random() })
      };

      container.register(token, factory, ServiceLifetime.TRANSIENT);
      
      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);
      
      expect(instance1).not.toBe(instance2);
    });

    it('should throw error for scoped services resolved from container', () => {
      const token = createServiceToken<string>('TestService');
      const factory: ServiceFactory<string> = {
        create: () => 'test-value'
      };

      container.register(token, factory, ServiceLifetime.SCOPED);
      
      expect(() => container.resolve(token)).toThrow(ServiceError);
    });

    it('should throw error for unregistered service', () => {
      const token = createServiceToken<string>('UnregisteredService');
      
      expect(() => container.resolve(token)).toThrow(ServiceError);
      expect(() => container.resolve(token)).toThrow('Service not registered');
    });

    it('should return null for unregistered service with tryResolve', () => {
      const token = createServiceToken<string>('UnregisteredService');
      
      const result = container.tryResolve(token);
      
      expect(result).toBeNull();
    });

    it('should resolve dependencies', () => {
      const dependencyToken = createServiceToken<string>('Dependency');
      const serviceToken = createServiceToken<{ dep: string }>('Service');
      
      container.register(dependencyToken, {
        create: () => 'dependency-value'
      });
      
      container.register(serviceToken, {
        create: (c) => ({ dep: c.resolve(dependencyToken) }),
        dependencies: [dependencyToken]
      });
      
      const service = container.resolve(serviceToken);
      expect(service.dep).toBe('dependency-value');
    });
  });

  describe('error handling', () => {
    it('should handle factory creation errors', () => {
      const token = createServiceToken<string>('FailingService');
      const factory: ServiceFactory<string> = {
        create: () => {
          throw new Error('Factory failed');
        }
      };

      container.register(token, factory);
      
      expect(() => container.resolve(token)).toThrow(ServiceError);
      expect(() => container.resolve(token)).toThrow('Failed to create service');
    });

    it('should reject async factories in synchronous resolve', () => {
      const token = createServiceToken<string>('AsyncService');
      const factory: ServiceFactory<string> = {
        create: async () => 'async-value'
      };

      container.register(token, factory);
      
      expect(() => container.resolve(token)).toThrow(ServiceError);
      expect(() => container.resolve(token)).toThrow('Async service factories not supported');
    });

    it('should throw error when using disposed container', async () => {
      const token = createServiceToken<string>('TestService');
      
      await container.dispose();
      
      expect(() => container.register(token, { create: () => 'test' })).toThrow(ServiceError);
      expect(() => container.resolve(token)).toThrow(ServiceError);
      expect(() => container.tryResolve(token)).toThrow(ServiceError);
      expect(() => container.createScope()).toThrow(ServiceError);
    });
  });

  describe('scope management', () => {
    it('should create scopes', () => {
      const scope = container.createScope();
      
      expect(scope).toBeDefined();
      expect(scope.parent).toBe(container);
    });

    it('should dispose scopes when container is disposed', async () => {
      const scope = container.createScope();
      const disposeSpy = jest.spyOn(scope, 'dispose');
      
      await container.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
    });
  });

  describe('lifecycle management', () => {
    it('should dispose singleton instances', async () => {
      const token = createServiceToken<{ dispose: jest.Mock }>('DisposableService');
      const disposeMock = jest.fn();
      const factory: ServiceFactory<{ dispose: jest.Mock }> = {
        create: () => ({ dispose: disposeMock }),
        dispose: (instance) => instance.dispose()
      };

      container.register(token, factory, ServiceLifetime.SINGLETON);
      
      // Force creation of singleton
      container.resolve(token);
      
      await container.dispose();
      
      expect(disposeMock).toHaveBeenCalled();
    });

    it('should handle disposal errors gracefully', async () => {
      const token = createServiceToken<object>('FailingDisposableService');
      const factory: ServiceFactory<object> = {
        create: () => ({}),
        dispose: async () => {
          throw new Error('Disposal failed');
        }
      };

      container.register(token, factory, ServiceLifetime.SINGLETON);
      container.resolve(token);
      
      // Should not throw
      await expect(container.dispose()).resolves.not.toThrow();
    });

    it('should clear all data after disposal', async () => {
      const token = createServiceToken<string>('TestService');
      container.register(token, { create: () => 'test' });
      container.resolve(token);
      
      await container.dispose();
      
      expect(container.isRegistered(token)).toBe(false);
    });

    it('should allow multiple dispose calls', async () => {
      await container.dispose();
      await expect(container.dispose()).resolves.not.toThrow();
    });
  });

  describe('complex scenarios', () => {
    it('should handle circular dependencies gracefully', () => {
      const tokenA = createServiceToken<{ b?: any }>('ServiceA');
      const tokenB = createServiceToken<{ a?: any }>('ServiceB');
      
      container.register(tokenA, {
        create: (c) => {
          const serviceA: { b?: any } = { b: undefined };
          serviceA.b = c.resolve(tokenB);
          return serviceA;
        }
      });
      
      container.register(tokenB, {
        create: (c) => {
          const serviceB: { a?: any } = { a: undefined };
          serviceB.a = c.resolve(tokenA);
          return serviceB;
        }
      });
      
      // This should eventually throw or handle gracefully
      expect(() => container.resolve(tokenA)).toThrow();
    });

    it('should handle deep dependency chains', () => {
      const tokenA = createServiceToken<{ value: string }>('ServiceA');
      const tokenB = createServiceToken<{ a: any }>('ServiceB');
      const tokenC = createServiceToken<{ b: any }>('ServiceC');
      
      container.register(tokenA, {
        create: () => ({ value: 'A' })
      });
      
      container.register(tokenB, {
        create: (c) => ({ a: c.resolve(tokenA) })
      });
      
      container.register(tokenC, {
        create: (c) => ({ b: c.resolve(tokenB) })
      });
      
      const serviceC = container.resolve(tokenC);
      expect(serviceC.b.a.value).toBe('A');
    });

    it('should handle mixed service lifetimes', () => {
      const singletonToken = createServiceToken<{ id: number }>('SingletonService');
      const transientToken = createServiceToken<{ singleton: any, id: number }>('TransientService');
      
      container.register(singletonToken, {
        create: () => ({ id: Math.random() })
      }, ServiceLifetime.SINGLETON);
      
      container.register(transientToken, {
        create: (c) => ({
          singleton: c.resolve(singletonToken),
          id: Math.random()
        })
      }, ServiceLifetime.TRANSIENT);
      
      const instance1 = container.resolve(transientToken);
      const instance2 = container.resolve(transientToken);
      
      // Different transient instances
      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
      
      // Same singleton dependency
      expect(instance1.singleton).toBe(instance2.singleton);
    });
  });
}); 