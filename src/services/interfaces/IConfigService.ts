export interface AppConfig {
  animation: {
    enabled: boolean;
    duration: number;
    ballColors: string[];
    physics: {
      gravity: number;
      bounce: number;
      damping: number;
    };
  };
  storage: {
    provider: 'localStorage' | 'indexedDB' | 'memory';
    maxBackups: number;
    compressionEnabled: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    pointColorRanges: Array<{
      min: number;
      max: number;
      color: string;
    }>;
    dateFormat: string;
  };
  features: {
    enableAnimations: boolean;
    enableBackups: boolean;
    enableAnalytics: boolean;
  };
}

export interface IConfigService {
  // Configuration Access
  getConfig(): AppConfig;
  getConfigValue<T>(path: string): T;
  setConfigValue<T>(path: string, value: T): void;

  // Environment
  getEnvironment(): 'development' | 'production' | 'test';
  isFeatureEnabled(feature: string): boolean;

  // Persistence
  saveConfig(): Promise<void>;
  resetToDefaults(): Promise<void>;

  // Events
  onConfigChange(callback: (path: string, newValue: any, oldValue: any) => void): () => void;
} 