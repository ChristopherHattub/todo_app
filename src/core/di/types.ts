export interface ServiceToken<T = any> {
  readonly symbol: symbol;
  readonly name: string;
  readonly description?: string;
}

export interface ServiceFactory<T = any> {
  create(container: IServiceContainer): T | Promise<T>;
  dependencies?: ServiceToken[];
  dispose?(instance: T): Promise<void> | void;
}

export interface ServiceRegistration<T = any> {
  token: ServiceToken<T>;
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

export enum ServiceLifetime {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient', 
  SCOPED = 'scoped'
}

export interface IServiceContainer {
  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>, lifetime?: ServiceLifetime): void;
  registerInstance<T>(token: ServiceToken<T>, instance: T): void;
  resolve<T>(token: ServiceToken<T>): T;
  tryResolve<T>(token: ServiceToken<T>): T | null;
  createScope(): IServiceScope;
  isRegistered<T>(token: ServiceToken<T>): boolean;
  dispose(): Promise<void>;
}

export interface IServiceScope extends IServiceContainer {
  readonly parent: IServiceContainer;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly token?: ServiceToken,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
} 