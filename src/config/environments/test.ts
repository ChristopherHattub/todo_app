import { AppConfig } from '../../types/config';

export const testConfig: Partial<AppConfig> = {
  animation: {
    enabled: false, // Disable animations for faster tests
    duration: 0, // No animation delay in tests
    ballColors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
    physics: {
      gravity: 1.0, // Predictable physics for tests
      bounce: 0.5,
      damping: 1.0 // No damping for deterministic behavior
    }
  },
  storage: {
    provider: 'memory', // In-memory storage for tests
    maxBackups: 1, // Minimal backups for tests
    compressionEnabled: false // No compression for test simplicity
  },
  ui: {
    theme: 'light', // Consistent theme for tests
    pointColorRanges: [
      { min: 1, max: 20, color: '#10B981' },
      { min: 21, max: 50, color: '#F59E0B' },
      { min: 51, max: 100, color: '#EF4444' }
    ],
    dateFormat: 'MM/DD/YY'
  },
  features: {
    enableAnimations: false, // No animations in tests
    enableBackups: false, // No backups in tests
    enableAnalytics: false // No analytics in tests
  },
  performance: {
    maxTodos: 100, // Small limit for fast tests
    debounceDelay: 0, // No debounce delay in tests
    animationFps: 1, // Minimal FPS
    cacheSize: 10 // Small cache for tests
  }
}; 