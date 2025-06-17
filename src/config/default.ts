import { AppConfig } from '../types/config';

export const defaultConfig: AppConfig = {
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
    provider: 'localStorage',
    maxBackups: 5,
    compressionEnabled: true
  },
  ui: {
    theme: 'auto',
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
  },
  performance: {
    maxTodos: 1000,
    debounceDelay: 300,
    animationFps: 60,
    cacheSize: 100
  }
}; 