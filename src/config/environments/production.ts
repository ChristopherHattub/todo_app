import { AppConfig } from '../../types/config';

export const productionConfig: Partial<AppConfig> = {
  animation: {
    enabled: true,
    duration: 300, // Faster for better UX
    ballColors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
    physics: {
      gravity: 0.6, // More responsive physics
      bounce: 0.7,
      damping: 0.9
    }
  },
  storage: {
    provider: 'indexedDB', // Better storage for production
    maxBackups: 3, // Fewer backups to save space
    compressionEnabled: true // Compression for performance
  },
  ui: {
    theme: 'auto', // Respect user preference
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
    enableAnalytics: true // Analytics enabled in production
  },
  performance: {
    maxTodos: 1000, // Reasonable limit for performance
    debounceDelay: 300, // Standard debounce
    animationFps: 60, // Smooth animations
    cacheSize: 100 // Optimized cache size
  }
}; 