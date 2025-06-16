import { IServiceContainer, ServiceFactory } from '../../core/di';
import { IDateService } from '../interfaces/IDateService';
import { DateService } from '../DateService';

export class DateServiceFactory implements ServiceFactory<IDateService> {
  dependencies = [];

  create(container: IServiceContainer): IDateService {
    return new DateService();
  }

  dispose(instance: IDateService): void {
    // No cleanup needed for DateService
  }
} 