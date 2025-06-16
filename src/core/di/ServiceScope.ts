import { ServiceToken, ServiceFactory, ServiceLifetime, IServiceContainer, IServiceScope, ServiceError } from './types';

export class ServiceScope implements IServiceScope {
  private scopedInstances = new Map<symbol, any>();
  private isDisposed = false;

  constructor(public readonly parent: IServiceContainer) {}

  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>, lifetime?: ServiceLifetime): void {
    // Delegate to parent
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

    // Check scoped instances first
    if (this.scopedInstances.has(token.symbol)) {
      return this.scopedInstances.get(token.symbol);
    }

    // Try parent resolution
    const instance = this.parent.tryResolve(token);
    if (instance && this.isScopedService(token)) {
      this.scopedInstances.set(token.symbol, instance);
    }

    return instance;
  }

  createScope(): IServiceScope {
    return new ServiceScope(this);
  }

  isRegistered<T>(token: ServiceToken<T>): boolean {
    return this.scopedInstances.has(token.symbol) || this.parent.isRegistered(token);
  }

  async dispose(): Promise<void> {
    if (this.isDisposed) return;

    // Dispose scoped instances
    const instanceValues = Array.from(this.scopedInstances.values());
    for (const instance of instanceValues) {
      if (instance && typeof instance.dispose === 'function') {
        await instance.dispose();
      }
    }

    this.scopedInstances.clear();
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
} 