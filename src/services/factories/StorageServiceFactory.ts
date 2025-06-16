import { IServiceContainer, ServiceFactory } from '../../core/di';
import { IStorageService } from '../interfaces/IStorageService';
import { LocalStorageService } from '../LocalStorageService';

export class StorageServiceFactory implements ServiceFactory<IStorageService> {
  dependencies = [];

  create(container: IServiceContainer): IStorageService {
    // For now, default to localStorage - will be enhanced with config service later
    return new LocalStorageService();
  }

  dispose(instance: IStorageService): void {
    if (instance.dispose) {
      instance.dispose();
    }
  }
} 