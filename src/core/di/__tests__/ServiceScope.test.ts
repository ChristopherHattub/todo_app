/**
 * ServiceScope test suite
 * Tests scoped service resolution, parent delegation, and lifecycle management
 */

import { ServiceContainer } from '../ServiceContainer';
import { ServiceScope } from '../ServiceScope';
import { createServiceToken } from '../ServiceToken';
import { ServiceLifetime, ServiceError, ServiceFactory } from '../types';

describe('ServiceScope', () => {
  let container: ServiceContainer;
  let scope: ServiceScope;

  beforeEach(() => {
    container = new ServiceContainer();
    scope = new ServiceScope(container);
  });

  afterEach(async () => {
    await scope.dispose();
    await container.dispose();
  });

  describe('scope creation', () => {
    it('should have reference to parent container', () => {
      expect(scope.parent).toBe(container);
    });

    it('should create nested scopes', () => {
      const nestedScope = scope.createScope();
      
      expect(nestedScope).toBeInstanceOf(ServiceScope);
      expect(nestedScope.parent).toBe(scope);
    });
  });

  describe('service registration', () => {
    it('should delegate registration to parent', () => {
      const token = createServiceToken<string>('TestService');
      const factory: ServiceFactory<string> = {
        create: () => 'test-value'
      };
      const registerSpy = jest.spyOn(container, 'register');

      scope.register(token, factory, ServiceLifetime.SINGLETON);
      
      expect(registerSpy).toHaveBeenCalledWith(token, factory, ServiceLifetime.SINGLETON);
      expect(container.isRegistered(token)).toBe(true);
    });

    it('should register scoped instance directly', () => {
      const token = createServiceToken<string>('ScopedService');
      const instance = 'scoped-instance';

      scope.registerInstance(token, instance);
      
      expect(scope.resolve(token)).toBe(instance);
    });

    it('should prioritize scoped instances over parent', () => {
      const token = createServiceToken<string>('TestService');
      const parentInstance = 'parent-instance';
      const scopedInstance = 'scoped-instance';

      container.registerInstance(token, parentInstance);
      scope.registerInstance(token, scopedInstance);
      
      expect(scope.resolve(token)).toBe(scopedInstance);
      expect(container.resolve(token)).toBe(parentInstance);
    });
  });

  describe('service resolution', () => {
    it('should resolve services from parent', () => {
      const token = createServiceToken<string>('ParentService');
      const factory: ServiceFactory<string> = {
        create: () => 'parent-value'
      };

      container.register(token, factory);
      
      const result = scope.resolve(token);
      expect(result).toBe('parent-value');
    });

    it('should resolve scoped instances first', () => {
      const token = createServiceToken<string>('TestService');
      
      container.registerInstance(token, 'parent-instance');
      scope.registerInstance(token, 'scoped-instance');
      
      expect(scope.resolve(token)).toBe('scoped-instance');
    });

    it('should return null for unregistered service with tryResolve', () => {
      const token = createServiceToken<string>('UnregisteredService');
      
      const result = scope.tryResolve(token);
      
      expect(result).toBeNull();
    });

    it('should throw error for unregistered service with resolve', () => {
      const token = createServiceToken<string>('UnregisteredService');
      
      expect(() => scope.resolve(token)).toThrow(ServiceError);
      expect(() => scope.resolve(token)).toThrow('Service not registered');
    });

    it('should cache scoped services appropriately', () => {
      const token = createServiceToken<object>('ScopedService');
      const factory: ServiceFactory<object> = {
        create: () => ({ id: Math.random() })
      };

      container.register(token, factory, ServiceLifetime.TRANSIENT);
      
      // First resolution
      const instance1 = scope.resolve(token);
      // Second resolution should be different (transient from parent)
      const instance2 = scope.resolve(token);
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('service checking', () => {
    it('should check scoped registrations', () => {
      const token = createServiceToken<string>('ScopedService');
      
      scope.registerInstance(token, 'scoped-instance');
      
      expect(scope.isRegistered(token)).toBe(true);
    });

    it('should check parent registrations', () => {
      const token = createServiceToken<string>('ParentService');
      
      container.register(token, { create: () => 'parent-value' });
      
      expect(scope.isRegistered(token)).toBe(true);
    });

    it('should return false for unregistered services', () => {
      const token = createServiceToken<string>('UnregisteredService');
      
      expect(scope.isRegistered(token)).toBe(false);
    });
  });

  describe('disposal', () => {
    it('should dispose scoped instances', async () => {
      const disposeMock = jest.fn();
      const instance = { dispose: disposeMock };
      const token = createServiceToken<typeof instance>('DisposableService');

      scope.registerInstance(token, instance);
      
      await scope.dispose();
      
      expect(disposeMock).toHaveBeenCalled();
    });

    it('should handle disposal errors gracefully', async () => {
      const instance = {
        dispose: jest.fn().mockRejectedValue(new Error('Disposal failed'))
      };
      const token = createServiceToken<typeof instance>('FailingDisposableService');

      scope.registerInstance(token, instance);
      
      // Should not throw
      await expect(scope.dispose()).resolves.not.toThrow();
    });

    it('should clear scoped instances after disposal', async () => {
      const token = createServiceToken<string>('ScopedService');
      
      scope.registerInstance(token, 'scoped-instance');
      expect(scope.isRegistered(token)).toBe(true);
      
      await scope.dispose();
      
      // Should delegate to parent only
      expect(scope.isRegistered(token)).toBe(false);
    });

    it('should prevent operations after disposal', async () => {
      const token = createServiceToken<string>('TestService');
      
      await scope.dispose();
      
      expect(() => scope.registerInstance(token, 'test')).toThrow(ServiceError);
      expect(() => scope.resolve(token)).toThrow(ServiceError);
      expect(() => scope.tryResolve(token)).toThrow(ServiceError);
    });

    it('should allow multiple dispose calls', async () => {
      await scope.dispose();
      await expect(scope.dispose()).resolves.not.toThrow();
    });
  });

  describe('nested scopes', () => {
    it('should handle multiple scope levels', () => {
      const level1Scope = container.createScope();
      const level2Scope = level1Scope.createScope();
      const level3Scope = level2Scope.createScope();
      
      const token = createServiceToken<string>('MultilevelService');
      
      container.registerInstance(token, 'container-value');
      level1Scope.registerInstance(token, 'level1-value');
      level2Scope.registerInstance(token, 'level2-value');
      
      expect(container.resolve(token)).toBe('container-value');
      expect(level1Scope.resolve(token)).toBe('level1-value');
      expect(level2Scope.resolve(token)).toBe('level2-value');
      expect(level3Scope.resolve(token)).toBe('level2-value'); // Should get from level2
    });

    it('should dispose nested scopes independently', async () => {
      const level1Scope = container.createScope();
      const level2Scope = level1Scope.createScope();
      
      const token = createServiceToken<string>('NestedService');
      level1Scope.registerInstance(token, 'level1-value');
      level2Scope.registerInstance(token, 'level2-value');
      
      await level2Scope.dispose();
      
      // Level1 should still be accessible
      expect(level1Scope.resolve(token)).toBe('level1-value');
    });
  });

  describe('scope isolation', () => {
    it('should isolate services between sibling scopes', () => {
      const scope1 = container.createScope();
      const scope2 = container.createScope();
      
      const token = createServiceToken<string>('IsolatedService');
      
      scope1.registerInstance(token, 'scope1-value');
      scope2.registerInstance(token, 'scope2-value');
      
      expect(scope1.resolve(token)).toBe('scope1-value');
      expect(scope2.resolve(token)).toBe('scope2-value');
    });

    it('should not affect parent when scope is disposed', async () => {
      const childScope = container.createScope();
      const token = createServiceToken<string>('TestService');
      
      container.registerInstance(token, 'parent-value');
      childScope.registerInstance(token, 'child-value');
      
      await childScope.dispose();
      
      // Parent should still work
      expect(container.resolve(token)).toBe('parent-value');
    });
  });

  describe('complex scenarios', () => {
    it('should handle service resolution with dependencies across scopes', () => {
      const dependencyToken = createServiceToken<string>('Dependency');
      const serviceToken = createServiceToken<{ dep: string }>('Service');
      
      // Register dependency in container
      container.register(dependencyToken, {
        create: () => 'container-dependency'
      });
      
      // Register service in scope that depends on container service
      scope.register(serviceToken, {
        create: (c) => ({ dep: c.resolve(dependencyToken) })
      });
      
      const service = scope.resolve(serviceToken);
      expect(service.dep).toBe('container-dependency');
    });

    it('should handle scoped overrides of dependencies', () => {
      const dependencyToken = createServiceToken<string>('Dependency');
      const serviceToken = createServiceToken<{ dep: string }>('Service');
      
      // Register base dependency in container
      container.register(dependencyToken, {
        create: () => 'container-dependency'
      });
      
      // Register service in container
      container.register(serviceToken, {
        create: (c) => ({ dep: c.resolve(dependencyToken) })
      });
      
      // Override dependency in scope
      scope.registerInstance(dependencyToken, 'scoped-dependency');
      
      const containerService = container.resolve(serviceToken);
      const scopedService = scope.resolve(serviceToken);
      
      expect(containerService.dep).toBe('container-dependency');
      expect(scopedService.dep).toBe('scoped-dependency');
    });
  });
}); 