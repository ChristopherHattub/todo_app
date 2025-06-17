import { ServiceContainer } from '../../core/di/ServiceContainer';
import { ServiceToken, ServiceFactory, ServiceLifetime, ServiceRegistration } from '../../core/di/types';
import { createMockServiceFactories } from '../mocks/ServiceMocks';

export class ServiceTestContainer extends ServiceContainer {
  private originalServices = new Map<symbol, any>();
  private mockedTokens = new Set<symbol>();
  private mockFactories = createMockServiceFactories();

  constructor() {
    super();
    this.setupDefaultMocks();
  }

  /**
   * Mock a specific service with a custom implementation
   */
  mockService<T>(tokenName: string, mockImplementation: T): void {
    const token = this.findTokenByName(tokenName);
    if (!token) {
      throw new Error(`Service token not found: ${tokenName}`);
    }

    // Store original service if not already stored
    if (!this.originalServices.has(token.symbol)) {
      const original = this.tryResolve(token);
      if (original) {
        this.originalServices.set(token.symbol, original);
      }
    }

    // Register mock implementation
    this.registerInstance(token, mockImplementation);
    this.mockedTokens.add(token.symbol);
  }

  /**
   * Mock a service using its token directly
   */
  mockServiceByToken<T>(token: ServiceToken<T>, mockImplementation: T): void {
    // Store original service if not already stored
    if (!this.originalServices.has(token.symbol)) {
      const original = this.tryResolve(token);
      if (original) {
        this.originalServices.set(token.symbol, original);
      }
    }

    this.registerInstance(token, mockImplementation);
    this.mockedTokens.add(token.symbol);
  }

  /**
   * Restore a specific service to its original implementation
   */
  restoreService<T>(tokenName: string): void {
    const token = this.findTokenByName(tokenName);
    if (!token) {
      throw new Error(`Service token not found: ${tokenName}`);
    }

    this.restoreServiceByToken(token);
  }

  /**
   * Restore a service using its token
   */
  restoreServiceByToken<T>(token: ServiceToken<T>): void {
    if (this.originalServices.has(token.symbol)) {
      const original = this.originalServices.get(token.symbol);
      this.registerInstance(token, original);
      this.originalServices.delete(token.symbol);
      this.mockedTokens.delete(token.symbol);
    }
  }

  /**
   * Restore all mocked services to their original implementations
   */
  restoreAllServices(): void {
    for (const [symbol, original] of this.originalServices) {
      const token = this.findTokenBySymbol(symbol);
      if (token) {
        this.registerInstance(token, original);
      }
    }
    
    this.originalServices.clear();
    this.mockedTokens.clear();
  }

  /**
   * Get a list of all mocked service tokens
   */
  getMockedServices(): string[] {
    return Array.from(this.mockedTokens).map(symbol => {
      const token = this.findTokenBySymbol(symbol);
      return token ? token.name : 'unknown';
    });
  }

  /**
   * Check if a service is currently mocked
   */
  isServiceMocked(tokenName: string): boolean {
    const token = this.findTokenByName(tokenName);
    return token ? this.mockedTokens.has(token.symbol) : false;
  }

  /**
   * Reset the container to a clean state for the next test
   */
  resetForTest(): void {
    this.restoreAllServices();
    this.setupDefaultMocks();
  }

  /**
   * Create a spy on a service method
   */
  spyOnService<T, K extends keyof T>(
    tokenName: string, 
    methodName: K
  ): jest.SpyInstance<any, any> {
    const service = this.resolveByName<T>(tokenName);
    if (!service || typeof service[methodName] !== 'function') {
      throw new Error(`Method ${String(methodName)} not found on service ${tokenName}`);
    }

    return jest.spyOn(service, methodName as any);
  }

  /**
   * Setup default mock implementations for all services
   */
  private setupDefaultMocks(): void {
    // Register default mocks for all known services
    Object.entries(this.mockFactories).forEach(([tokenName, factory]) => {
      try {
        const mockInstance = factory();
        this.registerMockByName(tokenName, mockInstance);
      } catch (error) {
        console.warn(`Failed to setup mock for ${tokenName}:`, error);
      }
    });
  }

  /**
   * Register a mock service by token name
   */
  private registerMockByName(tokenName: string, mockInstance: any): void {
    const token = this.findTokenByName(tokenName);
    if (token) {
      this.registerInstance(token, mockInstance);
    }
  }

  /**
   * Resolve a service by its token name
   */
  private resolveByName<T>(tokenName: string): T | null {
    const token = this.findTokenByName(tokenName);
    return token ? this.tryResolve(token) : null;
  }

  /**
   * Find a service token by its name
   */
  private findTokenByName(name: string): ServiceToken | null {
    // This would need to be implemented based on your token registry
    // For now, we'll use a simple approach
    const tokenMap = this.getTokenRegistry();
    return tokenMap.get(name) || null;
  }

  /**
   * Find a service token by its symbol
   */
  private findTokenBySymbol(symbol: symbol): ServiceToken | null {
    const tokenMap = this.getTokenRegistry();
    for (const [name, token] of tokenMap) {
      if (token.symbol === symbol) {
        return token;
      }
    }
    return null;
  }

  /**
   * Get the token registry (this would be populated by your service registration)
   */
  private getTokenRegistry(): Map<string, ServiceToken> {
    // This is a placeholder - in a real implementation, you'd maintain
    // a registry of all registered tokens
    const registry = new Map<string, ServiceToken>();
    
    // Add your actual service tokens here
    // registry.set('ITodoService', todoServiceToken);
    // registry.set('IStorageService', storageServiceToken);
    // etc.
    
    return registry;
  }

  /**
   * Dispose of the container and clean up all mocks
   */
  async dispose(): Promise<void> {
    this.restoreAllServices();
    await super.dispose();
  }
} 