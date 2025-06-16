import { IServiceContainer, ServiceFactory } from '../../core/di';
import { IConfigService } from '../interfaces/IConfigService';

class ConfigService implements IConfigService {
  private config = {
    animation: {
      enabled: true,
      duration: 400,
      ballColors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
      physics: {
        gravity: 0.5,
        bounce: 0.7,
        damping: 0.9
      }
    },
    storage: {
      provider: 'localStorage' as const,
      maxBackups: 5,
      compressionEnabled: true
    },
    ui: {
      theme: 'auto' as const,
      pointColorRanges: [
        { min: 1, max: 20, color: '#10B981' },
        { min: 21, max: 50, color: '#F59E0B' },
        { min: 51, max: 100, color: '#EF4444' }
      ],
      dateFormat: 'MM/DD/YY'
    },
    features: {
      enableAnimations: true,
      enableBackups: true,
      enableAnalytics: false
    }
  };

  getConfig() {
    return this.config;
  }

  getConfigValue<T>(path: string): T {
    const keys = path.split('.');
    let current: any = this.config;
    for (const key of keys) {
      current = current[key];
      if (current === undefined) break;
    }
    return current as T;
  }

  setConfigValue<T>(path: string, value: T): void {
    const keys = path.split('.');
    let current: any = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  getEnvironment(): 'development' | 'production' | 'test' {
    return (process.env.NODE_ENV as any) || 'development';
  }

  isFeatureEnabled(feature: string): boolean {
    return this.getConfigValue<boolean>(`features.${feature}`) || false;
  }

  async saveConfig(): Promise<void> {
    // For now, just store in localStorage
    localStorage.setItem('app_config', JSON.stringify(this.config));
  }

  async resetToDefaults(): Promise<void> {
    localStorage.removeItem('app_config');
    // Reset config to defaults (would reload from defaults)
  }

  onConfigChange(callback: (path: string, newValue: any, oldValue: any) => void): () => void {
    // For now, return a no-op unsubscribe function
    return () => {};
  }
}

export class ConfigServiceFactory implements ServiceFactory<IConfigService> {
  dependencies = [];

  create(container: IServiceContainer): IConfigService {
    const environment = process.env.NODE_ENV || 'development';
    return new ConfigService();
  }

  dispose(instance: IConfigService): void {
    // No cleanup needed for ConfigService
  }
} 