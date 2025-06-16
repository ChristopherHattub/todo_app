import { IServiceContainer, ServiceFactory } from '../../core/di';
import { IValidationService } from '../interfaces/IValidationService';
import { ValidationService } from '../ValidationService';

export class ValidationServiceFactory implements ServiceFactory<IValidationService> {
  dependencies = [];

  create(container: IServiceContainer): IValidationService {
    return new ValidationService();
  }

  dispose(instance: IValidationService): void {
    // No cleanup needed for ValidationService
  }
} 