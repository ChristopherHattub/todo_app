import { IServiceContainer, ServiceFactory } from '../../core/di';
import { IAnimationService } from '../interfaces/IAnimationService';
import { AnimationHandler } from '../AnimationHandler';

export class AnimationServiceFactory implements ServiceFactory<IAnimationService> {
  dependencies = [];

  create(container: IServiceContainer): IAnimationService {
    return new AnimationHandler();
  }

  dispose(instance: IAnimationService): void {
    if (instance.dispose) {
      instance.dispose();
    }
  }
} 