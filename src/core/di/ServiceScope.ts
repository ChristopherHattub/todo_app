import { ServiceToken, ServiceFactory, ServiceLifetime, IServiceContainer, IServiceScope, ServiceError, ServiceRegistration } from './types';

export class ServiceScope implements IServiceScope {
  private scopedInstances = new Map<symbol, any>();
  private scopedFactories = new Map<symbol, ServiceRegistration>();
  private isDisposed = false;
  private resolutionStack = new Set<symbol>();

  constructor(public readonly parent: IServiceContainer) {}

  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>, lifetime?: ServiceLifetime): void {
    this.ensureNotDisposed();
    // Delegate to parent as the test expects
    this.parent.register(token, factory, lifetime);
  }

  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    this.ensureNotDisposed();
    this.scopedInstances.set(token.symbol, instance);
  }

  resolve<T>(token: ServiceToken<T>): T {
    const instance = this.tryResolve(token);
    if (instance === null) {
      throw new ServiceError(`Service not registered: ${token.name}`, token);
    }
    return instance;
  }

  tryResolve<T>(token: ServiceToken<T>): T | null {
    this.ensureNotDisposed();

    // Check for circular dependency
    if (this.resolutionStack.has(token.symbol)) {
      throw new ServiceError(`Circular dependency detected: ${token.name}`, token);
    }

    try {
      this.resolutionStack.add(token.symbol);

      // Check scoped instances first
      if (this.scopedInstances.has(token.symbol)) {
        return this.scopedInstances.get(token.symbol);
      }

      // Check scoped factories
      if (this.scopedFactories.has(token.symbol)) {
        const registration = this.scopedFactories.get(token.symbol)!;
        const instance = this.createInstance(registration);
        if (registration.lifetime === ServiceLifetime.SINGLETON) {
          this.scopedInstances.set(token.symbol, instance);
        }
        return instance;
      }

      // Check if parent has a registration for this token
      const parentRegistration = this.parent.getRegistration(token);
      if (parentRegistration && this.hasScopedOverrides()) {
        // Parent has registration and we have scoped overrides
        // Create our own instance to use scoped dependencies
        const instance = this.createInstance(parentRegistration);
        if (parentRegistration.lifetime === ServiceLifetime.SINGLETON) {
          this.scopedInstances.set(token.symbol, instance);
        }
        return instance;
      }

      // No scoped overrides or no parent registration, delegate to parent
      return this.parent.tryResolve(token);
    } finally {
      this.resolutionStack.delete(token.symbol);
    }
  }

  createScope(): IServiceScope {
    return new ServiceScope(this);
  }

  isRegistered<T>(token: ServiceToken<T>): boolean {
    return this.scopedInstances.has(token.symbol) || 
           this.scopedFactories.has(token.symbol) ||
           this.parent.isRegistered(token);
  }

  hasInstance<T>(token: ServiceToken<T>): boolean {
    return this.scopedInstances.has(token.symbol) || this.parent.hasInstance(token);
  }

  getRegistration<T>(token: ServiceToken<T>): ServiceRegistration<T> | null {
    return this.scopedFactories.get(token.symbol) || this.parent.getRegistration(token);
  }

  private createInstance<T>(registration: ServiceRegistration<T>): T {
    try {
      const result = registration.factory.create(this);
      
      // Handle async factory creation - check this first before wrapping in general error
      if (result instanceof Promise) {
        throw new Error('Async service factories not supported');
      }
      
      return result;
    } catch (error) {
      // If it's the specific async error, throw it directly
      if (error instanceof Error && error.message === 'Async service factories not supported') {
        throw new ServiceError(error.message, registration.token, error);
      }
      
      throw new ServiceError(
        `Failed to create service: ${registration.token.name}`,
        registration.token,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async dispose(): Promise<void> {
    if (this.isDisposed) return;

    // Dispose scoped instances
    const instanceValues = Array.from(this.scopedInstances.values());
    for (const instance of instanceValues) {
      try {
        if (instance && typeof instance.dispose === 'function') {
          await instance.dispose();
        }
      } catch (error) {
        // Log disposal error but don't throw
        console.warn('Error disposing scoped instance:', error);
      }
    }

    this.scopedInstances.clear();
    this.scopedFactories.clear();
    this.isDisposed = true;
  }

  private isScopedService<T>(token: ServiceToken<T>): boolean {
    // Logic to determine if service should be scoped
    return false; // Default implementation
  }

  private ensureNotDisposed(): void {
    if (this.isDisposed) {
      throw new ServiceError('Cannot use disposed service scope');
    }
  }

  private hasScopedOverrides(): boolean {
    // Check if we have any scoped instances or factories that could affect dependency resolution
    return this.scopedInstances.size > 0 || this.scopedFactories.size > 0;
  }
} 