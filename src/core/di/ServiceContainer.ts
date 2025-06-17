import { ServiceToken, ServiceFactory, ServiceRegistration, ServiceLifetime, IServiceContainer, IServiceScope, ServiceError } from './types';
import { ServiceScope } from './ServiceScope';

export class ServiceContainer implements IServiceContainer {
  private registrations = new Map<symbol, ServiceRegistration>();
  private singletonInstances = new Map<symbol, any>();
  private scopes = new Set<ServiceScope>();
  private isDisposed = false;
  private resolutionStack = new Set<symbol>();

  register<T>(
    token: ServiceToken<T>, 
    factory: ServiceFactory<T>, 
    lifetime: ServiceLifetime = ServiceLifetime.SINGLETON
  ): void {
    this.ensureNotDisposed();
    
    this.registrations.set(token.symbol, {
      token,
      factory,
      lifetime
    });
  }

  registerInstance<T>(token: ServiceToken<T>, instance: T): void {
    this.ensureNotDisposed();
    this.singletonInstances.set(token.symbol, instance);
  }

  resolve<T>(token: ServiceToken<T>): T {
    this.ensureNotDisposed();
    
    const instance = this.tryResolve(token);
    if (instance === null) {
      throw new ServiceError(`Service not registered: ${token.name}`, token);
    }
    return instance;
  }

  tryResolve<T>(token: ServiceToken<T>): T | null {
    this.ensureNotDisposed();

    // Check for direct instance registration
    if (this.singletonInstances.has(token.symbol)) {
      return this.singletonInstances.get(token.symbol);
    }

    // Get registration
    const registration = this.registrations.get(token.symbol);
    if (!registration) {
      return null;
    }

    // Check for circular dependency
    if (this.resolutionStack.has(token.symbol)) {
      throw new ServiceError(`Circular dependency detected: ${token.name}`, token);
    }

    try {
      this.resolutionStack.add(token.symbol);
      return this.createInstance(registration);
    } finally {
      this.resolutionStack.delete(token.symbol);
    }
  }

  createScope(): IServiceScope {
    this.ensureNotDisposed();
    const scope = new ServiceScope(this);
    this.scopes.add(scope);
    return scope;
  }

  isRegistered<T>(token: ServiceToken<T>): boolean {
    return this.singletonInstances.has(token.symbol) || 
           this.registrations.has(token.symbol);
  }

  hasInstance<T>(token: ServiceToken<T>): boolean {
    return this.singletonInstances.has(token.symbol);
  }

  getRegistration<T>(token: ServiceToken<T>): ServiceRegistration<T> | null {
    return this.registrations.get(token.symbol) || null;
  }

  async dispose(): Promise<void> {
    if (this.isDisposed) return;

    // Dispose all scopes
    const scopePromises = Array.from(this.scopes).map(async scope => {
      try {
        await scope.dispose();
      } catch (error) {
        // Log disposal error but don't throw
        console.warn('Error disposing scope:', error);
      }
    });
    await Promise.all(scopePromises);
    this.scopes.clear();

    // Dispose singleton instances
    const singletonEntries = Array.from(this.singletonInstances.entries());
    for (const [symbol, instance] of singletonEntries) {
      try {
        const registration = this.registrations.get(symbol);
        if (registration?.factory.dispose) {
          await registration.factory.dispose(instance);
        }
      } catch (error) {
        // Log disposal error but don't throw
        console.warn('Error disposing singleton instance:', error);
      }
    }

    this.singletonInstances.clear();
    this.registrations.clear();
    this.isDisposed = true;
  }

  private createInstance<T>(registration: ServiceRegistration<T>): T {
    switch (registration.lifetime) {
      case ServiceLifetime.SINGLETON:
        return this.getSingletonInstance(registration);
      
      case ServiceLifetime.TRANSIENT:
        return this.createTransientInstance(registration);
      
      case ServiceLifetime.SCOPED:
        throw new ServiceError('Scoped services can only be resolved from a scope', registration.token);
      
      default:
        throw new ServiceError(`Unknown service lifetime: ${registration.lifetime}`, registration.token);
    }
  }

  private getSingletonInstance<T>(registration: ServiceRegistration<T>): T {
    if (this.singletonInstances.has(registration.token.symbol)) {
      return this.singletonInstances.get(registration.token.symbol);
    }

    const instance = this.createTransientInstance(registration);
    this.singletonInstances.set(registration.token.symbol, instance);
    return instance;
  }

  private createTransientInstance<T>(registration: ServiceRegistration<T>): T {
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

  private ensureNotDisposed(): void {
    if (this.isDisposed) {
      throw new ServiceError('Cannot use disposed service container');
    }
  }
} 