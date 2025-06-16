import { IServiceContainer, ServiceFactory } from '../../core/di';
import { ITodoService } from '../interfaces/ITodoService';
import { TodoService } from '../TodoService';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';

export class TodoServiceFactory implements ServiceFactory<ITodoService> {
  dependencies = [SERVICE_TOKENS.STORAGE_SERVICE, SERVICE_TOKENS.VALIDATION_SERVICE];

  create(container: IServiceContainer): ITodoService {
    const storageService = container.resolve(SERVICE_TOKENS.STORAGE_SERVICE);
    const validationService = container.resolve(SERVICE_TOKENS.VALIDATION_SERVICE);
    
    return new TodoService(storageService, validationService);
  }

  dispose(instance: ITodoService): void {
    if (instance.dispose) {
      instance.dispose();
    }
  }
} 