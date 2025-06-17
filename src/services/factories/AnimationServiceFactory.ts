import { IServiceContainer, ServiceFactory } from '../../core/di';
import { IAnimationService } from '../interfaces/IAnimationService';
import { IConfigService } from '../interfaces/IConfigService';
import { AnimationHandler } from '../AnimationHandler';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';

export class AnimationServiceFactory implements ServiceFactory<IAnimationService> {
  dependencies = [SERVICE_TOKENS.CONFIG_SERVICE];

  create(container: IServiceContainer): IAnimationService {
    // Resolve the config service dependency
    const configService = container.resolve<IConfigService>(SERVICE_TOKENS.CONFIG_SERVICE);
    
    return new AnimationHandler(configService);
  }

  dispose(instance: IAnimationService): void {
    if (instance.dispose) {
      instance.dispose();
    }
  }
} 