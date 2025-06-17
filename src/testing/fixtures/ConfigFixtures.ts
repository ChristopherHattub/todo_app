import { AppConfig } from '../../types/config';

/**
 * Default test configuration
 */
export const createTestConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  environment: 'test',
  features: {
    enableAnimations: true,
    enableNotifications: true,
    enableOfflineMode: false,
    enableDataExport: true,
    enableAdvancedValidation: false
  },
  ui: {
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h'
  },
  storage: {
    provider: 'memory',
    autoSave: true,
    compressionEnabled: false,
    encryptionEnabled: false
  },
  performance: {
    enableVirtualization: false,
    maxCacheSize: 100,
    debounceDelay: 300,
    batchSize: 50
  },
  animations: {
    enableTaskCompletionAnimation: true,
    enableProgressAnimation: true,
    enablePageTransitions: true,
    animationDuration: 300,
    easingFunction: 'ease-in-out'
  },
  physics: {
    gravity: 9.81,
    friction: 0.8,
    restitution: 0.6,
    airDensity: 1.2
  },
  ...overrides
});

/**
 * Production-like configuration
 */
export const createProductionConfig = (): AppConfig => createTestConfig({
  environment: 'production',
  features: {
    enableAnimations: true,
    enableNotifications: true,
    enableOfflineMode: true,
    enableDataExport: true,
    enableAdvancedValidation: true
  },
  storage: {
    provider: 'indexeddb',
    autoSave: true,
    compressionEnabled: true,
    encryptionEnabled: true
  },
  performance: {
    enableVirtualization: true,
    maxCacheSize: 500,
    debounceDelay: 300,
    batchSize: 100
  }
});

/**
 * Development configuration
 */
export const createDevelopmentConfig = (): AppConfig => createTestConfig({
  environment: 'development',
  features: {
    enableAnimations: false, // Faster for dev
    enableNotifications: false,
    enableOfflineMode: false,
    enableDataExport: true,
    enableAdvancedValidation: true
  },
  performance: {
    enableVirtualization: false,
    maxCacheSize: 50,
    debounceDelay: 100, // Faster feedback
    batchSize: 25
  }
});

/**
 * Minimal configuration for testing
 */
export const createMinimalConfig = (): AppConfig => createTestConfig({
  features: {
    enableAnimations: false,
    enableNotifications: false,
    enableOfflineMode: false,
    enableDataExport: false,
    enableAdvancedValidation: false
  },
  performance: {
    enableVirtualization: false,
    maxCacheSize: 10,
    debounceDelay: 0,
    batchSize: 10
  },
  animations: {
    enableTaskCompletionAnimation: false,
    enableProgressAnimation: false,
    enablePageTransitions: false,
    animationDuration: 0,
    easingFunction: 'linear'
  }
});

/**
 * Configuration with all features enabled
 */
export const createFullFeaturesConfig = (): AppConfig => createTestConfig({
  features: {
    enableAnimations: true,
    enableNotifications: true,
    enableOfflineMode: true,
    enableDataExport: true,
    enableAdvancedValidation: true
  },
  performance: {
    enableVirtualization: true,
    maxCacheSize: 1000,
    debounceDelay: 500,
    batchSize: 200
  }
});

/**
 * High performance configuration
 */
export const createHighPerformanceConfig = (): AppConfig => createTestConfig({
  features: {
    enableAnimations: false,
    enableNotifications: false,
    enableOfflineMode: true,
    enableDataExport: true,
    enableAdvancedValidation: false
  },
  performance: {
    enableVirtualization: true,
    maxCacheSize: 2000,
    debounceDelay: 100,
    batchSize: 500
  },
  animations: {
    enableTaskCompletionAnimation: false,
    enableProgressAnimation: false,
    enablePageTransitions: false,
    animationDuration: 0,
    easingFunction: 'linear'
  }
});

/**
 * Dark theme configuration
 */
export const createDarkThemeConfig = (): AppConfig => createTestConfig({
  ui: {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h'
  }
});

/**
 * European configuration
 */
export const createEuropeanConfig = (): AppConfig => createTestConfig({
  ui: {
    theme: 'light',
    language: 'en',
    timezone: 'Europe/London',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h'
  }
});

/**
 * Invalid configuration for testing validation
 */
export const createInvalidConfig = (): Partial<AppConfig> => ({
  environment: 'invalid' as any,
  ui: {
    theme: 'invalid-theme' as any,
    language: '',
    timezone: 'Invalid/Timezone',
    dateFormat: 'invalid-format',
    timeFormat: 'invalid' as any
  },
  performance: {
    enableVirtualization: true,
    maxCacheSize: -1, // Invalid negative value
    debounceDelay: -100, // Invalid negative value
    batchSize: 0 // Invalid zero value
  }
});

/**
 * Configuration change scenarios for testing
 */
export const ConfigChangeScenarios = {
  themeChange: {
    from: createTestConfig({ ui: { theme: 'light', language: 'en', timezone: 'UTC', dateFormat: 'MM/dd/yyyy', timeFormat: '12h' } }),
    to: createTestConfig({ ui: { theme: 'dark', language: 'en', timezone: 'UTC', dateFormat: 'MM/dd/yyyy', timeFormat: '12h' } })
  },
  performanceOptimization: {
    from: createTestConfig(),
    to: createHighPerformanceConfig()
  },
  featureToggle: {
    from: createMinimalConfig(),
    to: createFullFeaturesConfig()
  }
}; 