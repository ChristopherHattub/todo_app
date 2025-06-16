import { IServiceContainer, ServiceLifetime } from '../di';
import { SERVICE_TOKENS } from '../di/ServiceToken';
import {
  TodoServiceFactory,
  StorageServiceFactory,
  DateServiceFactory,
  ValidationServiceFactory,
  AnimationServiceFactory,
  ConfigServiceFactory
} from '../../services/factories';

export function registerServices(container: IServiceContainer): void {
  // Configuration Service (needed first)
  container.register(
    SERVICE_TOKENS.CONFIG_SERVICE,
    new ConfigServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Storage Service
  container.register(
    SERVICE_TOKENS.STORAGE_SERVICE,
    new StorageServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Validation Service
  container.register(
    SERVICE_TOKENS.VALIDATION_SERVICE,
    new ValidationServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Date Service
  container.register(
    SERVICE_TOKENS.DATE_SERVICE,
    new DateServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Animation Service
  container.register(
    SERVICE_TOKENS.ANIMATION_SERVICE,
    new AnimationServiceFactory(),
    ServiceLifetime.SINGLETON
  );

  // Todo Service (depends on others)
  container.register(
    SERVICE_TOKENS.TODO_SERVICE,
    new TodoServiceFactory(),
    ServiceLifetime.SINGLETON
  );
} 