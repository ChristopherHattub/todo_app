/**
 * DI (Dependency Injection) test fixtures
 * Provides mock services, test builders, and utilities for DI testing
 */

import { ServiceContainer } from '../../core/di/ServiceContainer';
import { createServiceToken, SERVICE_TOKENS } from '../../core/di/ServiceToken';
import { ServiceFactory, ServiceLifetime, ServiceToken, IServiceScope } from '../../core/di/types';
import { TestBuilders } from '../patterns/TestBuilderPattern';

/**
 * Mock service interfaces for testing
 */
export interface IMockLoggerService {
  log: jest.Mock<void, [string]>;
  error: jest.Mock<void, [string]>;
  warn: jest.Mock<void, [string]>;
}

export interface IMockConfigService {
  get: jest.Mock<string, [string]>;
  set: jest.Mock<void, [string, string]>;
  has: jest.Mock<boolean, [string]>;
}

export interface IMockDataService {
  getData: jest.Mock<Promise<any[]>, []>;
  saveData: jest.Mock<Promise<void>, [any[]]>;
  clearData: jest.Mock<Promise<void>, []>;
}

export interface IMockCacheService {
  get: jest.Mock<any, [string]>;
  set: jest.Mock<void, [string, any]>;
  delete: jest.Mock<void, [string]>;
  clear: jest.Mock<void, []>;
}

/**
 * Test service tokens
 */
export const TEST_TOKENS = {
  MOCK_LOGGER: createServiceToken<IMockLoggerService>('MockLoggerService'),
  MOCK_CONFIG: createServiceToken<IMockConfigService>('MockConfigService'),
  MOCK_DATA: createServiceToken<IMockDataService>('MockDataService'),
  MOCK_CACHE: createServiceToken<IMockCacheService>('MockCacheService'),
  
  // Test-specific tokens
  COUNTER_SERVICE: createServiceToken<{ count: number; increment(): void }>('CounterService'),
  ASYNC_SERVICE: createServiceToken<{ getValue(): Promise<string> }>('AsyncService'),
  FACTORY_SERVICE: createServiceToken<{ create(id: string): any }>('FactoryService')
} as const;

/**
 * Mock service implementations
 */
export const createMockLoggerService = (): IMockLoggerService => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
});

export const createMockConfigService = (): IMockConfigService => ({
  get: jest.fn().mockReturnValue('default-value'),
  set: jest.fn(),
  has: jest.fn().mockReturnValue(true)
});

export const createMockDataService = (): IMockDataService => ({
  getData: jest.fn().mockResolvedValue([]),
  saveData: jest.fn().mockResolvedValue(undefined),
  clearData: jest.fn().mockResolvedValue(undefined)
});

export const createMockCacheService = (): IMockCacheService => ({
  get: jest.fn().mockReturnValue(null),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn()
});

/**
 * Service factory builders for testing
 */
export class ServiceFactoryBuilder<T> {
  private factory: Partial<ServiceFactory<T>> = {};

  create(createFn: (container: any) => T): this {
    this.factory.create = createFn;
    return this;
  }

  dependencies(deps: ServiceToken[]): this {
    this.factory.dependencies = deps;
    return this;
  }

  dispose(disposeFn: (instance: T) => void | Promise<void>): this {
    this.factory.dispose = disposeFn;
    return this;
  }

  build(): ServiceFactory<T> {
    if (!this.factory.create) {
      throw new Error('Service factory must have a create function');
    }
    return this.factory as ServiceFactory<T>;
  }
}

/**
 * Test container builder for setting up complex DI scenarios
 */
export class TestContainerBuilder {
  private container = new ServiceContainer();
  private registrations: Array<() => void> = [];

  /**
   * Add a service registration
   */
  addService<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.SINGLETON
  ): this {
    this.registrations.push(() => {
      this.container.register(token, factory, lifetime);
    });
    return this;
  }

  /**
   * Add a service instance
   */
  addInstance<T>(token: ServiceToken<T>, instance: T): this {
    this.registrations.push(() => {
      this.container.registerInstance(token, instance);
    });
    return this;
  }

  /**
   * Add mock services
   */
  addMockServices(): this {
    return this
      .addInstance(TEST_TOKENS.MOCK_LOGGER, createMockLoggerService())
      .addInstance(TEST_TOKENS.MOCK_CONFIG, createMockConfigService())
      .addInstance(TEST_TOKENS.MOCK_DATA, createMockDataService())
      .addInstance(TEST_TOKENS.MOCK_CACHE, createMockCacheService());
  }

  /**
   * Add a counter service for testing stateful behavior
   */
  addCounterService(lifetime: ServiceLifetime = ServiceLifetime.SINGLETON): this {
    return this.addService(
      TEST_TOKENS.COUNTER_SERVICE,
      new ServiceFactoryBuilder<{ count: number; increment(): void }>()
        .create(() => {
          let count = 0;
          return {
            count: 0,
            increment() { 
              count++; 
              this.count = count;
            }
          };
        })
        .build(),
      lifetime
    );
  }

  /**
   * Add an async service for testing async scenarios
   */
  addAsyncService(delay: number = 100): this {
    return this.addService(
      TEST_TOKENS.ASYNC_SERVICE,
      new ServiceFactoryBuilder<{ getValue(): Promise<string> }>()
        .create(() => ({
          getValue: async () => {
            await new Promise(resolve => setTimeout(resolve, delay));
            return 'async-value';
          }
        }))
        .build()
    );
  }

  /**
   * Add a factory service for testing factory patterns
   */
  addFactoryService(): this {
    return this.addService(
      TEST_TOKENS.FACTORY_SERVICE,
      new ServiceFactoryBuilder<{ create(id: string): any }>()
        .create(() => ({
          create: (id: string) => ({ id, created: new Date() })
        }))
        .build()
    );
  }

  /**
   * Add services with dependencies
   */
  addDependentServices(): this {
    // First add the dependencies
    this.addMockServices();

    // Then add services that depend on them
    const dependentToken = createServiceToken<{
      processData(input: string): Promise<string>;
    }>('DependentService');

    return this.addService(
      dependentToken,
      new ServiceFactoryBuilder<{ processData(input: string): Promise<string> }>()
        .create((container) => {
          const logger = container.resolve(TEST_TOKENS.MOCK_LOGGER);
          const config = container.resolve(TEST_TOKENS.MOCK_CONFIG);
          const dataService = container.resolve(TEST_TOKENS.MOCK_DATA);
          
          return {
            async processData(input: string) {
              logger.log(`Processing: ${input}`);
              const prefix = config.get('prefix');
              await dataService.saveData([input]);
              return `${prefix}-${input}`;
            }
          };
        })
        .dependencies([TEST_TOKENS.MOCK_LOGGER, TEST_TOKENS.MOCK_CONFIG, TEST_TOKENS.MOCK_DATA])
        .build()
    );
  }

  /**
   * Build the container with all registrations
   */
  build(): ServiceContainer {
    // Execute all registrations
    this.registrations.forEach(register => register());
    return this.container;
  }

  /**
   * Build and return both container and a scope
   */
  buildWithScope(): { container: ServiceContainer; scope: IServiceScope } {
    const container = this.build();
    const scope = container.createScope();
    return { container, scope };
  }
}

/**
 * Predefined test scenarios
 */
export const DITestScenarios = {
  /**
   * Empty container for basic tests
   */
  empty: () => new TestContainerBuilder().build(),

  /**
   * Container with mock services
   */
  withMocks: () => new TestContainerBuilder()
    .addMockServices()
    .build(),

  /**
   * Container with various service lifetimes
   */
  withLifetimes: () => new TestContainerBuilder()
    .addCounterService(ServiceLifetime.SINGLETON)
    .addService(
      createServiceToken<{ id: number }>('TransientService'),
      new ServiceFactoryBuilder<{ id: number }>()
        .create(() => ({ id: Math.random() }))
        .build(),
      ServiceLifetime.TRANSIENT
    )
    .build(),

  /**
   * Container with async services
   */
  withAsync: () => new TestContainerBuilder()
    .addAsyncService(50)
    .addMockServices()
    .build(),

  /**
   * Container with service dependencies
   */
  withDependencies: () => new TestContainerBuilder()
    .addDependentServices()
    .build(),

  /**
   * Container for performance testing
   */
  performance: () => {
    const builder = new TestContainerBuilder();
    
    // Add many services
    for (let i = 0; i < 100; i++) {
      const token = createServiceToken<{ id: number }>(`PerformanceService${i}`);
      builder.addService(
        token,
        new ServiceFactoryBuilder<{ id: number }>()
          .create(() => ({ id: i }))
          .build()
      );
    }
    
    return builder.build();
  }
};

/**
 * Test utilities for DI testing
 */
export const DITestUtils = {
  /**
   * Create a service token for testing
   */
  createTestToken: <T>(name: string) => createServiceToken<T>(`Test${name}`),

  /**
   * Create a disposable mock service
   */
  createDisposableMock: () => {
    const disposeMock = jest.fn();
    return {
      service: { dispose: disposeMock },
      disposeMock
    };
  },

  /**
   * Create a factory that tracks creation calls
   */
  createTrackedFactory: <T>(createFn: () => T) => {
    const creationCount = { value: 0 };
    const factory: ServiceFactory<T> = {
      create: () => {
        creationCount.value++;
        return createFn();
      }
    };
    return { factory, creationCount };
  },

  /**
   * Wait for all async operations to complete
   */
  waitForAsync: () => new Promise(resolve => setImmediate(resolve)),

  /**
   * Assert that services are properly disposed
   */
  assertDisposed: async (container: ServiceContainer) => {
    await container.dispose();
    // Additional assertions can be added here
  },

  /**
   * Create a service that throws on creation
   */
  createFailingService: <T>(error: Error): ServiceFactory<T> => ({
    create: () => { throw error; }
  }),

  /**
   * Create a circular dependency scenario
   */
  createCircularDependency: (container: ServiceContainer) => {
    const tokenA = createServiceToken<{ name: string }>('CircularA');
    const tokenB = createServiceToken<{ name: string }>('CircularB');

    container.register(tokenA, {
      create: (c) => ({
        name: 'A-' + c.resolve(tokenB).name
      })
    });

    container.register(tokenB, {
      create: (c) => ({
        name: 'B-' + c.resolve(tokenA).name
      })
    });

    return { tokenA, tokenB };
  }
};

/**
 * Integration with existing test builders
 */
export class DITestBuilder extends TestBuilders {
  /**
   * Create a service container builder
   */
  static container(): TestContainerBuilder {
    return new TestContainerBuilder();
  }

  /**
   * Create a service factory builder
   */
  static factory<T>(): ServiceFactoryBuilder<T> {
    return new ServiceFactoryBuilder<T>();
  }
}

/**
 * Export all test tokens for easy access
 */
export { SERVICE_TOKENS }; 