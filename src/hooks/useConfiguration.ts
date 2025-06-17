import { useState, useEffect, useCallback, useMemo } from 'react';
import { useService } from '../core/di/react';
import { SERVICE_TOKENS } from '../core/di/ServiceToken';
import { IConfigService, AppConfig } from '../services/interfaces/IConfigService';
import { ConfigChangeCallback } from '../types/config';

export interface UseConfigurationOptions {
  // Subscribe to changes for specific config paths
  watchPaths?: string[];
  // Whether to enable automatic persistence of changes
  autoPersist?: boolean;
}

export interface UseConfigurationReturn {
  config: AppConfig;
  updateConfig: <T>(path: string, value: T) => void;
  resetConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  isFeatureEnabled: (feature: string) => boolean;
  getConfigValue: <T>(path: string) => T;
  isLoading: boolean;
  error: string | null;
}

export function useConfiguration(options: UseConfigurationOptions = {}): UseConfigurationReturn {
  const { watchPaths = ['*'], autoPersist = true } = options;
  
  const configService = useService(SERVICE_TOKENS.CONFIG_SERVICE);
  const [config, setConfig] = useState<AppConfig>(() => configService.getConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to configuration changes
  useEffect(() => {
    const unsubscribeFunctions: Array<() => void> = [];

    const handleConfigChange: ConfigChangeCallback = (path, newValue, oldValue) => {
      // Update local state with the latest config
      setConfig(configService.getConfig());
      
      // Clear any previous errors
      setError(null);
    };

    // Subscribe to each watch path
    for (const watchPath of watchPaths) {
      if (watchPath === '*') {
        // Subscribe to all changes
        const unsubscribe = configService.onConfigChange(handleConfigChange);
        unsubscribeFunctions.push(unsubscribe);
      } else {
        // Subscribe to specific path changes
        const unsubscribe = (configService as any).onConfigChangeForPath?.(watchPath, handleConfigChange) || 
                           configService.onConfigChange(handleConfigChange);
        unsubscribeFunctions.push(unsubscribe);
      }
    }

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [configService, watchPaths]);

  const updateConfig = useCallback(<T>(path: string, value: T) => {
    try {
      setError(null);
      configService.setConfigValue(path, value);
      
      // Auto-persist if enabled
      if (autoPersist) {
        configService.saveConfig().catch(err => {
          console.error('Failed to auto-persist config:', err);
          setError('Failed to save configuration');
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(errorMessage);
      console.error('Failed to update config:', err);
    }
  }, [configService, autoPersist]);

  const resetConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await configService.resetToDefaults();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset configuration';
      setError(errorMessage);
      console.error('Failed to reset config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [configService]);

  const saveConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await configService.saveConfig();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      console.error('Failed to save config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [configService]);

  const isFeatureEnabled = useCallback((feature: string): boolean => {
    return configService.isFeatureEnabled(feature);
  }, [configService]);

  const getConfigValue = useCallback(<T>(path: string): T => {
    return configService.getConfigValue<T>(path);
  }, [configService]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    config,
    updateConfig,
    resetConfig,
    saveConfig,
    isFeatureEnabled,
    getConfigValue,
    isLoading,
    error
  }), [config, updateConfig, resetConfig, saveConfig, isFeatureEnabled, getConfigValue, isLoading, error]);
}

// Specialized hooks for common use cases
export function useAnimationConfig() {
  const { config, updateConfig, isFeatureEnabled } = useConfiguration({
    watchPaths: ['animation.*', 'features.enableAnimations']
  });

  return {
    animationConfig: config.animation,
    updateAnimationConfig: (path: string, value: any) => updateConfig(`animation.${path}`, value),
    isAnimationEnabled: isFeatureEnabled('enableAnimations')
  };
}

export function useThemeConfig() {
  const { config, updateConfig } = useConfiguration({
    watchPaths: ['ui.theme']
  });

  return {
    theme: config.ui.theme,
    setTheme: (theme: 'light' | 'dark' | 'auto') => updateConfig('ui.theme', theme)
  };
}

export function useFeatureFlags() {
  const { config, updateConfig, isFeatureEnabled } = useConfiguration({
    watchPaths: ['features.*']
  });

  return {
    features: config.features,
    isFeatureEnabled,
    toggleFeature: (feature: string) => {
      const currentValue = isFeatureEnabled(feature);
      updateConfig(`features.${feature}`, !currentValue);
    },
    enableFeature: (feature: string) => updateConfig(`features.${feature}`, true),
    disableFeature: (feature: string) => updateConfig(`features.${feature}`, false)
  };
} 