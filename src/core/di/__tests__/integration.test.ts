/**
 * DI System integration test suite
 * Tests end-to-end scenarios, service factories, and real-world usage patterns
 */

import { ServiceContainer } from '../ServiceContainer';
import { ServiceScope } from '../ServiceScope';
import { createServiceToken, SERVICE_TOKENS } from '../ServiceToken';
import { ServiceLifetime, ServiceFactory, ServiceError } from '../types';

describe('DI System Integration', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(async () => {
    await container.dispose();
  });

  describe('complete service registration and resolution', () => {
    it('should handle complex service dependency graph', () => {
      // Service interfaces
      interface ILoggerService {
        log(message: string): void;
      }

      interface IConfigService {
        getConfig(key: string): string;
      }

      interface IDataService {
        getData(): string[];
      }

      interface IBusinessService {
        processData(): string;
      }

      // Service tokens
      const loggerToken = createServiceToken<ILoggerService>('ILoggerService');
      const configToken = createServiceToken<IConfigService>('IConfigService');
      const dataToken = createServiceToken<IDataService>('IDataService');
      const businessToken = createServiceToken<IBusinessService>('IBusinessService');

      // Mock implementations
      const loggerService: ILoggerService = {
        log: jest.fn()
      };

      const configService: IConfigService = {
        getConfig: jest.fn().mockReturnValue('test-config-value')
      };

      // Register services with dependencies
      container.registerInstance(loggerToken, loggerService);
      container.registerInstance(configToken, configService);

      container.register(dataToken, {
        create: (c) => {
          const logger = c.resolve(loggerToken);
          const config = c.resolve(configToken);
          logger.log('Creating data service');
          
          return {
            getData: () => [config.getConfig('data1'), config.getConfig('data2')]
          };
        }
      });

      container.register(businessToken, {
        create: (c) => {
          const dataService = c.resolve(dataToken);
          const logger = c.resolve(loggerToken);
          
          return {
            processData: () => {
              const data = dataService.getData();
              logger.log('Processing data');
              return data.join(', ');
            }
          };
        }
      });

      // Test the complete service resolution
      const businessService = container.resolve(businessToken);
      const result = businessService.processData();

      expect(result).toBe('test-config-value, test-config-value');
      expect(loggerService.log).toHaveBeenCalledWith('Creating data service');
      expect(loggerService.log).toHaveBeenCalledWith('Processing data');
    });

    it('should handle async service initialization', async () => {
      interface IAsyncService {
        getValue(): Promise<string>;
      }

      const asyncToken = createServiceToken<IAsyncService>('IAsyncService');

      // Create a promise that we can control
      let resolveInit: ((value: string) => void) | undefined;
      const initPromise = new Promise<string>((resolve) => {
        resolveInit = resolve;
      });

      const asyncService: IAsyncService = {
        getValue: () => initPromise
      };

      container.registerInstance(asyncToken, asyncService);

      const service = container.resolve(asyncToken);
      
      // Start the async operation
      const valuePromise = service.getValue();
      
      // Resolve the initialization
      resolveInit!('async-value');
      
      const value = await valuePromise;
      expect(value).toBe('async-value');
    });
  });

  describe('service lifecycle management', () => {
    it('should handle service creation and disposal lifecycle', async () => {
      interface ILifecycleService {
        initialize(): void;
        dispose(): Promise<void>;
        getStatus(): string;
      }

      const lifecycleToken = createServiceToken<ILifecycleService>('ILifecycleService');
      
      let status = 'created';
      const initMock = jest.fn(() => { status = 'initialized'; });
      const disposeMock = jest.fn(async () => { status = 'disposed'; });

      const factory: ServiceFactory<ILifecycleService> = {
        create: () => {
          const service: ILifecycleService = {
            initialize: initMock,
            dispose: disposeMock,
            getStatus: () => status
          };
          service.initialize();
          return service;
        },
        dispose: (instance) => instance.dispose()
      };

      container.register(lifecycleToken, factory, ServiceLifetime.SINGLETON);

      // Create and use the service
      const service = container.resolve(lifecycleToken);
      expect(service.getStatus()).toBe('initialized');
      expect(initMock).toHaveBeenCalled();

      // Dispose the container
      await container.dispose();
      
      expect(disposeMock).toHaveBeenCalled();
      expect(status).toBe('disposed');
    });

    it('should handle multiple service lifetimes correctly', () => {
      interface ICounterService {
        getCount(): number;
        increment(): void;
      }

      const singletonToken = createServiceToken<ICounterService>('SingletonCounter');
      const transientToken = createServiceToken<ICounterService>('TransientCounter');

      const createCounter = (): ICounterService => {
        let count = 0;
        return {
          getCount: () => count,
          increment: () => { count++; }
        };
      };

      container.register(singletonToken, { create: createCounter }, ServiceLifetime.SINGLETON);
      container.register(transientToken, { create: createCounter }, ServiceLifetime.TRANSIENT);

      // Test singleton behavior
      const singleton1 = container.resolve(singletonToken);
      const singleton2 = container.resolve(singletonToken);
      
      singleton1.increment();
      expect(singleton1.getCount()).toBe(1);
      expect(singleton2.getCount()).toBe(1); // Same instance
      expect(singleton1).toBe(singleton2);

      // Test transient behavior
      const transient1 = container.resolve(transientToken);
      const transient2 = container.resolve(transientToken);
      
      transient1.increment();
      expect(transient1.getCount()).toBe(1);
      expect(transient2.getCount()).toBe(0); // Different instance
      expect(transient1).not.toBe(transient2);
    });
  });

  describe('scoped service resolution', () => {
    it('should isolate scoped services correctly', () => {
      interface IScopedService {
        getId(): string;
        setData(data: string): void;
        getData(): string;
      }

      const scopedToken = createServiceToken<IScopedService>('IScopedService');
      
      let idCounter = 0;
      container.register(scopedToken, {
        create: () => {
          const id = (++idCounter).toString();
          let data = '';
          
          return {
            getId: () => id,
            setData: (newData: string) => { data = newData; },
            getData: () => data
          };
        }
      }, ServiceLifetime.TRANSIENT);

      // Create two scopes
      const scope1 = container.createScope();
      const scope2 = container.createScope();

      // Register scoped instances
      const scopedService1 = container.resolve(scopedToken);
      const scopedService2 = container.resolve(scopedToken);
      
      scope1.registerInstance(scopedToken, scopedService1);
      scope2.registerInstance(scopedToken, scopedService2);

      // Set different data in each scope
      scopedService1.setData('scope1-data');
      scopedService2.setData('scope2-data');

      // Verify isolation
      expect(scope1.resolve(scopedToken).getData()).toBe('scope1-data');
      expect(scope2.resolve(scopedToken).getData()).toBe('scope2-data');
      expect(scope1.resolve(scopedToken).getId()).not.toBe(scope2.resolve(scopedToken).getId());
    });

    it('should handle nested scope inheritance', () => {
      interface IInheritedService {
        getLevel(): string;
      }

      const inheritedToken = createServiceToken<IInheritedService>('IInheritedService');

      // Register in container
      container.registerInstance(inheritedToken, { getLevel: () => 'container' });

      // Create nested scopes
      const scope1 = container.createScope();
      const scope2 = scope1.createScope();
      const scope3 = scope2.createScope();

      // Override at different levels
      scope1.registerInstance(inheritedToken, { getLevel: () => 'scope1' });
      scope3.registerInstance(inheritedToken, { getLevel: () => 'scope3' });

      // Test resolution at different levels
      expect(container.resolve(inheritedToken).getLevel()).toBe('container');
      expect(scope1.resolve(inheritedToken).getLevel()).toBe('scope1');
      expect(scope2.resolve(inheritedToken).getLevel()).toBe('scope1'); // Inherits from scope1
      expect(scope3.resolve(inheritedToken).getLevel()).toBe('scope3');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle circular dependency detection', () => {
      interface IServiceA {
        getName(): string;
        serviceB: IServiceB;
      }

      interface IServiceB {
        getName(): string;
        serviceA: IServiceA;
      }

      const tokenA = createServiceToken<IServiceA>('ServiceA');
      const tokenB = createServiceToken<IServiceB>('ServiceB');

      container.register(tokenA, {
        create: (c) => {
          const serviceA = {
            getName: () => 'ServiceA',
            serviceB: c.resolve(tokenB)
          };
          return serviceA;
        }
      });

      container.register(tokenB, {
        create: (c) => {
          const serviceB = {
            getName: () => 'ServiceB',
            serviceA: c.resolve(tokenA)
          };
          return serviceB;
        }
      });

      // This should throw due to circular dependency
      expect(() => container.resolve(tokenA)).toThrow();
    });

    it('should handle service factory errors gracefully', () => {
      const errorToken = createServiceToken<string>('ErrorService');
      
      container.register(errorToken, {
        create: () => {
          throw new Error('Service creation failed');
        }
      });

      expect(() => container.resolve(errorToken)).toThrow(ServiceError);
      expect(() => container.resolve(errorToken)).toThrow('Failed to create service');
    });

    it('should handle deep dependency chains', () => {
      const depth = 10;
      const tokens = Array.from({ length: depth }, (_, i) => 
        createServiceToken<{ value: number }>(`Service${i}`)
      );

      // Register chain of dependencies
      for (let i = 0; i < depth; i++) {
        if (i === 0) {
          container.register(tokens[i], {
            create: () => ({ value: i })
          });
        } else {
          container.register(tokens[i], {
            create: (c) => {
              const prev = c.resolve(tokens[i - 1]);
              return { value: prev.value + i };
            }
          });
        }
      }

      const finalService = container.resolve(tokens[depth - 1]);
      const expectedValue = Array.from({ length: depth }, (_, i) => i).reduce((a, b) => a + b, 0);
      
      expect(finalService.value).toBe(expectedValue);
    });
  });

  describe('performance and memory management', () => {
    it('should not leak memory with transient services', () => {
      interface ITransientService {
        id: number;
      }

      const transientToken = createServiceToken<ITransientService>('TransientService');
      let instanceCount = 0;

      container.register(transientToken, {
        create: () => ({
          id: ++instanceCount
        })
      }, ServiceLifetime.TRANSIENT);

      // Create many transient instances
      const instances = Array.from({ length: 100 }, () => container.resolve(transientToken));

      // Each should be unique
      const uniqueIds = new Set(instances.map(i => i.id));
      expect(uniqueIds.size).toBe(100);
      expect(instanceCount).toBe(100);
    });

    it('should handle large numbers of service registrations', () => {
      const serviceCount = 1000;
      const tokens = Array.from({ length: serviceCount }, (_, i) => 
        createServiceToken<{ id: number }>(`Service${i}`)
      );

      // Register all services
      tokens.forEach((token, i) => {
        container.register(token, {
          create: () => ({ id: i })
        });
      });

      // Verify all can be resolved
      const services = tokens.map(token => container.resolve(token));
      expect(services).toHaveLength(serviceCount);
      
      services.forEach((service, i) => {
        expect(service.id).toBe(i);
      });
    });
  });

  describe('real-world usage patterns', () => {
    it('should support factory pattern with parameters', () => {
      interface IApiClient {
        baseUrl: string;
        makeRequest(endpoint: string): Promise<string>;
      }

      interface IApiClientFactory {
        create(baseUrl: string): IApiClient;
      }

      const factoryToken = createServiceToken<IApiClientFactory>('IApiClientFactory');

      container.register(factoryToken, {
        create: () => ({
          create: (baseUrl: string) => ({
            baseUrl,
            makeRequest: async (endpoint: string) => `${baseUrl}/${endpoint}`
          })
        })
      });

      const factory = container.resolve(factoryToken);
      const client1 = factory.create('https://api1.example.com');
      const client2 = factory.create('https://api2.example.com');

      expect(client1.baseUrl).toBe('https://api1.example.com');
      expect(client2.baseUrl).toBe('https://api2.example.com');
    });

    it('should support decorator pattern with service composition', () => {
      interface IDataService {
        getData(): string;
      }

      interface ILoggingService {
        log(message: string): void;
      }

      const dataToken = createServiceToken<IDataService>('IDataService');
      const loggingToken = createServiceToken<ILoggingService>('ILoggingService');
      const decoratedDataToken = createServiceToken<IDataService>('DecoratedDataService');

      // Base services
      container.register(dataToken, {
        create: () => ({
          getData: () => 'base-data'
        })
      });

      container.register(loggingToken, {
        create: () => ({
          log: jest.fn()
        })
      });

      // Decorated service
      container.register(decoratedDataToken, {
        create: (c) => {
          const baseService = c.resolve(dataToken);
          const logger = c.resolve(loggingToken);
          
          return {
            getData: () => {
              logger.log('Getting data');
              const data = baseService.getData();
              logger.log('Data retrieved');
              return data;
            }
          };
        }
      });

      const decoratedService = container.resolve(decoratedDataToken);
      const logger = container.resolve(loggingToken);
      
      const result = decoratedService.getData();
      
      expect(result).toBe('base-data');
      expect(logger.log).toHaveBeenCalledWith('Getting data');
      expect(logger.log).toHaveBeenCalledWith('Data retrieved');
    });
  });
}); 