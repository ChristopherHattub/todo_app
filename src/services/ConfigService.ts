import { IConfigService, AppConfig } from './interfaces/IConfigService';
import { Environment, ConfigChangeCallback, ConfigChangeEvent } from '../types/config';
import { defaultConfig } from '../config/default';
import { developmentConfig } from '../config/environments/development';
import { productionConfig } from '../config/environments/production';
import { testConfig } from '../config/environments/test';

export class ConfigService implements IConfigService {
  private config: AppConfig;
  private environment: Environment;
  private changeListeners: Map<string, Array<ConfigChangeCallback>> = new Map();
  private userPreferences: Partial<AppConfig> = {};

  constructor(environment: Environment = 'development') {
    this.environment = environment;
    this.config = this.loadConfiguration();
    this.loadUserPreferences();
  }

  private loadConfiguration(): AppConfig {
    // Start with default configuration
    let config = { ...defaultConfig };

    // Apply environment-specific overrides
    const envConfig = this.getEnvironmentConfig();
    config = this.mergeConfig(config, envConfig);

    return config;
  }

  private getEnvironmentConfig(): Partial<AppConfig> {
    switch (this.environment) {
      case 'development':
        return developmentConfig;
      case 'production':
        return productionConfig;
      case 'test':
        return testConfig;
      default:
        return {};
    }
  }

  private mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    const merged = { ...base };
    
    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          merged[key as keyof AppConfig] = {
            ...merged[key as keyof AppConfig],
            ...value
          } as any;
        } else {
          merged[key as keyof AppConfig] = value as any;
        }
      }
    }
    
    return merged;
  }

  private loadUserPreferences(): void {
    try {
      const saved = localStorage.getItem('app_user_preferences');
      if (saved) {
        this.userPreferences = JSON.parse(saved);
        this.config = this.mergeConfig(this.config, this.userPreferences);
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      localStorage.setItem('app_user_preferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  getConfigValue<T>(path: string): T {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined as T;
      }
      current = current[key];
    }
    
    return current as T;
  }

  setConfigValue<T>(path: string, value: T): void {
    const keys = path.split('.');
    const oldValue = this.getConfigValue<T>(path);
    
    // Update the config
    let current: any = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;

    // Update user preferences if this is a preference-level change
    this.updateUserPreference(path, value);

    // Notify listeners
    this.notifyConfigChange(path, value, oldValue);
  }

  private updateUserPreference<T>(path: string, value: T): void {
    const keys = path.split('.');
    let current: any = this.userPreferences;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    
    this.saveUserPreferences();
  }

  private notifyConfigChange<T>(path: string, newValue: T, oldValue: T): void {
    // Notify exact path listeners
    const exactListeners = this.changeListeners.get(path);
    if (exactListeners) {
      exactListeners.forEach(callback => {
        try {
          callback(path, newValue, oldValue);
        } catch (error) {
          console.error('Error in config change listener:', error);
        }
      });
    }

    // Notify wildcard listeners (for parent paths)
    const pathParts = path.split('.');
    for (let i = 0; i < pathParts.length; i++) {
      const parentPath = pathParts.slice(0, i + 1).join('.');
      const wildcardPath = parentPath + '.*';
      const wildcardListeners = this.changeListeners.get(wildcardPath);
      
      if (wildcardListeners) {
        wildcardListeners.forEach(callback => {
          try {
            callback(path, newValue, oldValue);
          } catch (error) {
            console.error('Error in config change listener:', error);
          }
        });
      }
    }
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  isFeatureEnabled(feature: string): boolean {
    return this.getConfigValue<boolean>(`features.${feature}`) || false;
  }

  async saveConfig(): Promise<void> {
    try {
      localStorage.setItem('app_config', JSON.stringify(this.config));
      this.saveUserPreferences();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Configuration save failed');
    }
  }

  async resetToDefaults(): Promise<void> {
    try {
      // Clear user preferences
      localStorage.removeItem('app_user_preferences');
      localStorage.removeItem('app_config');
      
      // Reset to default configuration
      this.userPreferences = {};
      const oldConfig = { ...this.config };
      this.config = this.loadConfiguration();
      
      // Notify all listeners about the reset
      this.notifyAllListenersOfReset(oldConfig, this.config);
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      throw new Error('Configuration reset failed');
    }
  }

  private notifyAllListenersOfReset(oldConfig: AppConfig, newConfig: AppConfig): void {
    // Recursively notify about all changed values
    this.notifyConfigChangesRecursive('', oldConfig, newConfig);
  }

  private notifyConfigChangesRecursive(basePath: string, oldObj: any, newObj: any): void {
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
    
    for (const key of allKeys) {
      const path = basePath ? `${basePath}.${key}` : key;
      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];
      
      if (typeof oldValue === 'object' && typeof newValue === 'object' && 
          !Array.isArray(oldValue) && !Array.isArray(newValue) &&
          oldValue !== null && newValue !== null) {
        // Recurse into nested objects
        this.notifyConfigChangesRecursive(path, oldValue, newValue);
      } else if (oldValue !== newValue) {
        // Notify about the change
        this.notifyConfigChange(path, newValue, oldValue);
      }
    }
  }

  onConfigChange(callback: ConfigChangeCallback): () => void {
    // Default to listening to all changes
    return this.onConfigChangeForPath('*', callback);
  }

  onConfigChangeForPath(path: string, callback: ConfigChangeCallback): () => void {
    if (!this.changeListeners.has(path)) {
      this.changeListeners.set(path, []);
    }
    
    const listeners = this.changeListeners.get(path)!;
    listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      // Clean up empty listener arrays
      if (listeners.length === 0) {
        this.changeListeners.delete(path);
      }
    };
  }

  dispose(): void {
    this.changeListeners.clear();
  }
} 