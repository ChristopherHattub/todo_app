import { IServiceContainer, ServiceFactory } from '../../core/di';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';
import { IStorageService } from '../interfaces/IStorageService';
import { IConfigService } from '../interfaces/IConfigService';
import { LocalStorageService } from '../LocalStorageService';
import { MemoryStorageService } from '../MemoryStorageService';
import { IndexedDBStorageService } from '../IndexedDBStorageService';
import { StorageProviderType } from '../../types/storage';

export class StorageServiceFactory implements ServiceFactory<IStorageService> {
  dependencies = [SERVICE_TOKENS.CONFIG_SERVICE];

  create(container: IServiceContainer): IStorageService {
    const configService = container.resolve<IConfigService>(SERVICE_TOKENS.CONFIG_SERVICE);
    const storageConfig = configService.getConfigValue('storage.provider') as StorageProviderType;
    
    // Determine the storage provider to use with fallback logic
    const provider = this.determineStorageProvider(storageConfig);
    
    switch (provider) {
      case 'indexedDB':
        console.log('StorageServiceFactory: Using IndexedDB storage');
        return new IndexedDBStorageService();
        
      case 'memory':
        console.log('StorageServiceFactory: Using memory storage');
        return new MemoryStorageService();
        
      case 'localStorage':
      default:
        console.log('StorageServiceFactory: Using localStorage storage');
        return new LocalStorageService();
    }
  }

  /**
   * Determine which storage provider to use with fallback logic
   */
  private determineStorageProvider(preferredProvider: StorageProviderType): StorageProviderType {
    // Test availability in order of preference
    const providers: StorageProviderType[] = [preferredProvider, 'localStorage', 'indexedDB', 'memory'];
    
    for (const provider of providers) {
      if (this.isProviderAvailable(provider)) {
        if (provider !== preferredProvider) {
          console.warn(`StorageServiceFactory: Preferred provider "${preferredProvider}" not available, falling back to "${provider}"`);
        }
        return provider;
      }
    }
    
    // If all else fails, use memory (which should always be available)
    console.warn('StorageServiceFactory: All storage providers failed, using memory storage');
    return 'memory';
  }

  /**
   * Check if a storage provider is available
   */
  private isProviderAvailable(provider: StorageProviderType): boolean {
    switch (provider) {
      case 'localStorage':
        return this.isLocalStorageAvailable();
        
      case 'indexedDB':
        return this.isIndexedDBAvailable();
        
      case 'memory':
        return true; // Memory is always available
        
      default:
        return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if IndexedDB is available
   */
  private isIndexedDBAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Get storage provider capabilities for debugging/monitoring
   */
  public getProviderCapabilities(provider: StorageProviderType) {
    switch (provider) {
      case 'localStorage':
        return {
          maxSize: 5 * 1024 * 1024, // ~5MB
          supportsCompression: true,
          isAvailable: this.isLocalStorageAvailable(),
          isPersistent: true,
          type: provider
        };
        
      case 'indexedDB':
        return {
          maxSize: 100 * 1024 * 1024, // ~100MB+
          supportsCompression: false,
          isAvailable: this.isIndexedDBAvailable(),
          isPersistent: true,
          type: provider
        };
        
      case 'memory':
        return {
          maxSize: 50 * 1024 * 1024, // ~50MB
          supportsCompression: false,
          isAvailable: true,
          isPersistent: false,
          type: provider
        };
        
      default:
        return {
          maxSize: 0,
          supportsCompression: false,
          isAvailable: false,
          isPersistent: false,
          type: provider
        };
    }
  }

  dispose(instance: IStorageService): void {
    if (instance.dispose) {
      instance.dispose().catch(error => {
        console.error('Error disposing storage service:', error);
      });
    }
  }
} 