import { IServiceContainer, ServiceFactory } from '../../core/di';
import { IConfigService } from '../interfaces/IConfigService';
import { ConfigService } from '../ConfigService';
import { Environment } from '../../types/config';

export class ConfigServiceFactory implements ServiceFactory<IConfigService> {
  dependencies = [];

  create(container: IServiceContainer): IConfigService {
    const environment = this.detectEnvironment();
    return new ConfigService(environment);
  }

  dispose(instance: IConfigService): void {
    // Clean up configuration service
    if (instance instanceof ConfigService) {
      instance.dispose();
    }
    console.debug('ConfigService disposed');
  }

  private detectEnvironment(): Environment {
    // Check NODE_ENV first
    if (process.env.NODE_ENV) {
      const env = process.env.NODE_ENV.toLowerCase();
      if (env === 'production' || env === 'development' || env === 'test') {
        return env as Environment;
      }
    }

    // Check for test environment indicators
    if (typeof jest !== 'undefined' || 
        process.env.JEST_WORKER_ID !== undefined) {
      return 'test';
    }

    // Check for development indicators
    if (typeof window !== 'undefined') {
      // Browser environment detection
      const hostname = window.location?.hostname;
      
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname?.endsWith('.local') ||
          hostname?.includes('dev.') ||
          hostname?.includes('staging.')) {
        return 'development';
      }

      // Check for development build indicators
      if (window.location?.port && 
          ['3000', '3001', '8080', '8000', '5000', '5173'].includes(window.location.port)) {
        return 'development';
      }
    }

    // Check for production indicators
    if (typeof window !== 'undefined') {
      const protocol = window.location?.protocol;
      const hostname = window.location?.hostname;
      
      if (protocol === 'https:' && 
          hostname && 
          !hostname.includes('localhost') && 
          !hostname.includes('127.0.0.1') &&
          !hostname.includes('dev.') &&
          !hostname.includes('staging.')) {
        return 'production';
      }
    }

    // Default to development
    return 'development';
  }

  private isTestEnvironment(): boolean {
    return typeof jest !== 'undefined' || 
           process.env.JEST_WORKER_ID !== undefined ||
           process.env.NODE_ENV === 'test';
  }

  private isDevelopmentEnvironment(): boolean {
    if (this.isTestEnvironment()) {
      return false;
    }

    return process.env.NODE_ENV === 'development' ||
           typeof window !== 'undefined' && (
             window.location?.hostname === 'localhost' ||
             window.location?.hostname === '127.0.0.1' ||
             window.location?.hostname?.endsWith('.local')
           );
  }
} 