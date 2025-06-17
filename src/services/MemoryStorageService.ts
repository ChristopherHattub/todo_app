import { IStorageService } from './interfaces/IStorageService';
import { YearSchedule, DaySchedule, StorageResponse, ServiceError } from '../types';

/**
 * In-memory storage service implementation for testing and development
 * Data is volatile and will be lost on page refresh
 */
export class MemoryStorageService implements IStorageService {
  private store = new Map<string, any>();
  private readonly STORAGE_PREFIX = 'memory_';

  /**
   * Save a year schedule to memory
   */
  public async saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>> {
    try {
      const key = this.getStorageKey('year', yearSchedule.year.toString());
      this.store.set(key, this.deepClone(yearSchedule));
      
      return {
        data: yearSchedule,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to save year schedule');
    }
  }

  /**
   * Load a year schedule from memory
   */
  public async loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>> {
    try {
      const key = this.getStorageKey('year', year.toString());
      const data = this.store.get(key);
      
      if (!data) {
        return {
          data: null,
          success: true
        };
      }

      return {
        data: this.deepClone(data),
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to load year schedule');
    }
  }

  /**
   * Save a day schedule to memory
   */
  public async saveDaySchedule(daySchedule: DaySchedule): Promise<StorageResponse<DaySchedule>> {
    try {
      const key = this.getStorageKey('day', daySchedule.date);
      this.store.set(key, this.deepClone(daySchedule));
      
      return {
        data: daySchedule,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to save day schedule');
    }
  }

  /**
   * Load a day schedule from memory
   */
  public async loadDaySchedule(date: Date): Promise<StorageResponse<DaySchedule | null>> {
    try {
      const key = this.getStorageKey('day', date.toISOString().split('T')[0]);
      const data = this.store.get(key);
      
      if (!data) {
        return {
          data: null,
          success: true
        };
      }

      return {
        data: this.deepClone(data),
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to load day schedule');
    }
  }

  /**
   * Export all data as a JSON string
   */
  public async exportData(): Promise<StorageResponse<string>> {
    try {
      const exportData: Record<string, any> = {};
      
      // Collect all data from memory store
      for (const [key, value] of this.store.entries()) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          exportData[key] = value;
        }
      }

      const jsonData = JSON.stringify(exportData);
      
      return {
        data: jsonData,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to export data');
    }
  }

  /**
   * Import data from a JSON string
   */
  public async importData(data: string): Promise<StorageResponse<void>> {
    try {
      const importedData = JSON.parse(data);
      
      // Clear existing data
      await this.clearAllData();
      
      // Import new data
      for (const [key, value] of Object.entries(importedData)) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          this.store.set(key, value);
        }
      }

      return {
        data: undefined,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to import data');
    }
  }

  /**
   * Clear all application data from memory
   */
  public async clearAllData(): Promise<StorageResponse<void>> {
    try {
      const keysToRemove: string[] = [];
      
      // Collect all app-related keys
      for (const key of this.store.keys()) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all collected keys
      keysToRemove.forEach(key => this.store.delete(key));

      return {
        data: undefined,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to clear data');
    }
  }

  /**
   * Check if memory storage is available (always true)
   */
  public isStorageAvailable(): boolean {
    return true;
  }

  /**
   * Get storage information for memory storage
   */
  public getStorageInfo(): { used: number; available: number; type: string } {
    try {
      // Calculate approximate memory usage
      let totalSize = 0;
      for (const [key, value] of this.store.entries()) {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          totalSize += key.length + JSON.stringify(value).length;
        }
      }
      
      // Memory storage doesn't have a fixed limit, but we'll use a reasonable estimate
      const estimatedLimit = 50 * 1024 * 1024; // 50MB
      
      return {
        used: totalSize,
        available: estimatedLimit - totalSize,
        type: 'memory'
      };
    } catch {
      return {
        used: 0,
        available: 0,
        type: 'memory'
      };
    }
  }

  /**
   * Get storage key with prefix
   */
  private getStorageKey(type: 'year' | 'day', identifier: string): string {
    return `${this.STORAGE_PREFIX}${type}_${identifier}`;
  }

  /**
   * Deep clone an object to prevent reference issues
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Map) {
      const clonedMap = new Map();
      for (const [key, value] of obj) {
        clonedMap.set(key, this.deepClone(value));
      }
      return clonedMap as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = this.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  /**
   * Handle storage errors and create appropriate error response
   */
  private handleStorageError(error: unknown, message: string): StorageResponse<any> {
    const serviceError: ServiceError = {
      type: 'STORAGE',
      message: error instanceof Error ? error.message : message,
      timestamp: new Date(),
      recoverable: true, // Memory storage errors are usually recoverable
      context: error
    };

    return {
      data: null,
      success: false,
      error: serviceError
    };
  }

  /**
   * Dispose of resources - clear all data
   */
  public async dispose(): Promise<void> {
    this.store.clear();
  }
} 