export interface PhysicsConfig {
  gravity: number;
  bounce: number;
  damping: number;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  ballColors: string[];
  physics: PhysicsConfig;
}

export interface StorageConfig {
  provider: 'localStorage' | 'indexedDB' | 'memory';
  maxBackups: number;
  compressionEnabled: boolean;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  pointColorRanges: Array<{
    min: number;
    max: number;
    color: string;
  }>;
  dateFormat: string;
}

export interface FeatureFlags {
  enableAnimations: boolean;
  enableBackups: boolean;
  enableAnalytics: boolean;
}

export interface PerformanceConfig {
  maxTodos: number;
  debounceDelay: number;
  animationFps: number;
  cacheSize: number;
}

export interface AppConfig {
  animation: AnimationConfig;
  storage: StorageConfig;
  ui: UIConfig;
  features: FeatureFlags;
  performance: PerformanceConfig;
}

// Environment-specific config types
export type Environment = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  name: Environment;
  config: Partial<AppConfig>;
}

// Configuration change event types
export type ConfigChangeCallback = (path: string, newValue: any, oldValue: any) => void;

export interface ConfigChangeEvent {
  path: string;
  newValue: any;
  oldValue: any;
  timestamp: number;
}

// Validation schemas type
export interface ConfigValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    min?: number;
    max?: number;
    enum?: any[];
    pattern?: RegExp;
  };
} 