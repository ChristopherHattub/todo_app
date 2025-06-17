import { AppConfig } from '../../types/config';

export const developmentConfig: Partial<AppConfig> = {
  animation: {
    enabled: true,
    duration: 1200, // Slower for debugging
    ballColors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
    physics: {
      gravity: 0.3, // Gentler physics for debugging
      bounce: 0.8,
      damping: 0.95
    }
  },
  storage: {
    provider: 'localStorage', // Simple storage for dev
    maxBackups: 10, // More backups in dev
    compressionEnabled: false // Easier debugging without compression
  },
  ui: {
    theme: 'light', // Consistent theme for dev
    pointColorRanges: [
      { min: 1, max: 20, color: '#10B981' },
      { min: 21, max: 50, color: '#F59E0B' },
      { min: 51, max: 100, color: '#EF4444' }
    ],
    dateFormat: 'MM/DD/YY HH:mm' // More detailed timestamp in dev
  },
  features: {
    enableAnimations: true,
    enableBackups: true,
    enableAnalytics: false // No tracking in dev
  },
  performance: {
    maxTodos: 10000, // Higher limits for testing
    debounceDelay: 100, // Faster response in dev
    animationFps: 30, // Lower FPS to save resources during dev
    cacheSize: 50 // Smaller cache for memory debugging
  }
}; 