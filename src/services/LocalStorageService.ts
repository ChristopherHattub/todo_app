import { YearSchedule, MonthSchedule, DaySchedule, StorageResponse, ServiceError } from '../types';
import { IStorageService } from './interfaces/IStorageService';

/**
 * Service for handling local storage operations with error handling and data compression
 */
export class LocalStorageService implements IStorageService {
  private readonly STORAGE_PREFIX = 'todo_app_';
  private readonly COMPRESSION_ENABLED = true;
  private static instance: LocalStorageService;

  /**
   * Get singleton instance
   */
  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  // Static methods for compatibility with existing code
  public static async saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>> {
    return LocalStorageService.getInstance().saveYearSchedule(yearSchedule);
  }

  public static async loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>> {
    return LocalStorageService.getInstance().loadYearSchedule(year);
  }

  public static async saveDaySchedule(daySchedule: DaySchedule): Promise<StorageResponse<DaySchedule>> {
    return LocalStorageService.getInstance().saveDaySchedule(daySchedule);
  }

  public static async loadDaySchedule(date: Date): Promise<StorageResponse<DaySchedule | null>> {
    return LocalStorageService.getInstance().loadDaySchedule(date);
  }

  public static async exportData(): Promise<StorageResponse<string>> {
    return LocalStorageService.getInstance().exportData();
  }

  public static async importData(data: string): Promise<StorageResponse<void>> {
    return LocalStorageService.getInstance().importData(data);
  }

  public static async clearAllData(): Promise<StorageResponse<void>> {
    return LocalStorageService.getInstance().clearAllData();
  }

  public static isStorageAvailable(): boolean {
    return LocalStorageService.getInstance().isStorageAvailable();
  }

  public static getStorageInfo(): { used: number; available: number; type: string } {
    return LocalStorageService.getInstance().getStorageInfo();
  }

  /**
   * Save a year schedule to local storage
   */
  public async saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>> {
    try {
      const key = this.getStorageKey('year', yearSchedule.year.toString());
      const data = this.COMPRESSION_ENABLED 
        ? await this.compressData(yearSchedule)
        : JSON.stringify(yearSchedule);
      
      localStorage.setItem(key, data);
      
      return {
        data: yearSchedule,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to save year schedule');
    }
  }

  /**
   * Load a year schedule from local storage
   */
  public async loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>> {
    try {
      const key = this.getStorageKey('year', year.toString());
      const data = localStorage.getItem(key);
      
      if (!data) {
        return {
          data: null,
          success: true
        };
      }

      const raw = this.COMPRESSION_ENABLED
        ? await this.decompressData<YearSchedule>(data)
        : JSON.parse(data);
      const yearSchedule = this.reviveYearSchedule(raw);

      return {
        data: yearSchedule,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to load year schedule');
    }
  }

  /**
   * Save a day schedule to local storage
   */
  public async saveDaySchedule(daySchedule: DaySchedule): Promise<StorageResponse<DaySchedule>> {
    try {
      const key = this.getStorageKey('day', daySchedule.date);
      const data = this.COMPRESSION_ENABLED
        ? await this.compressData(daySchedule)
        : JSON.stringify(daySchedule);
      
      localStorage.setItem(key, data);
      
      return {
        data: daySchedule,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to save day schedule');
    }
  }

  /**
   * Load a day schedule from local storage
   */
  public async loadDaySchedule(date: Date): Promise<StorageResponse<DaySchedule | null>> {
    try {
      const key = this.getStorageKey('day', date.toISOString().split('T')[0]);
      const data = localStorage.getItem(key);
      
      if (!data) {
        return {
          data: null,
          success: true
        };
      }

      const daySchedule = this.COMPRESSION_ENABLED
        ? await this.decompressData<DaySchedule>(data)
        : JSON.parse(data);

      return {
        data: daySchedule,
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
      const data: Record<string, any> = {};
      
      // Collect all data from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            data[key] = this.COMPRESSION_ENABLED
              ? await this.decompressData(value)
              : JSON.parse(value);
          }
        }
      }

      const exportData = JSON.stringify(data);
      
      return {
        data: exportData,
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
        const serializedValue = this.COMPRESSION_ENABLED
          ? await this.compressData(value)
          : JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
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
   * Clear all application data from local storage
   */
  public async clearAllData(): Promise<StorageResponse<void>> {
    try {
      const keysToRemove: string[] = [];
      
      // Collect all app-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all collected keys
      keysToRemove.forEach(key => localStorage.removeItem(key));

      return {
        data: undefined,
        success: true
      };
    } catch (error) {
      return this.handleStorageError(error, 'Failed to clear data');
    }
  }

  /**
   * Check if local storage is available
   */
  public isStorageAvailable(): boolean {
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
   * Get storage information
   */
  public getStorageInfo(): { used: number; available: number; type: string } {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      
      // Estimate localStorage limit (usually 5-10MB)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      
      return {
        used: totalSize,
        available: estimatedLimit - totalSize,
        type: 'localStorage'
      };
    } catch {
      return {
        used: 0,
        available: 0,
        type: 'localStorage'
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
   * Handle storage errors and create appropriate error response
   */
  private handleStorageError(error: unknown, message: string): StorageResponse<any> {
    const serviceError: ServiceError = {
      type: 'STORAGE',
      message: error instanceof Error ? error.message : message,
      timestamp: new Date(),
      recoverable: this.isQuotaExceededError(error),
      context: error
    };

    return {
      data: null,
      success: false,
      error: serviceError
    };
  }

  /**
   * Check if error is due to storage quota being exceeded
   */
  private isQuotaExceededError(error: unknown): boolean {
    return error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }

  /**
   * Compress data using a simple compression algorithm
   * In a real application, you might want to use a more robust compression library
   */
  private async compressData<T>(data: T): Promise<string> {
    const jsonString = JSON.stringify(data);
    // Simple compression: remove whitespace and encode special characters
    return jsonString.replace(/\s+/g, '').replace(/[<>]/g, c => 
      c === '<' ? '&lt;' : '&gt;'
    );
  }

  /**
   * Decompress data
   */
  private async decompressData<T>(data: string): Promise<T> {
    // Simple decompression: decode special characters
    const decompressed = data.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return JSON.parse(decompressed);
  }

  /**
   * Helper to revive a YearSchedule from plain object, reconstructing Maps
   */
  private reviveYearSchedule(obj: any): YearSchedule {
    const yearSchedule: YearSchedule = {
      ...obj,
      monthSchedules: new Map<string, MonthSchedule>(),
    };
    if (obj.monthSchedules && typeof obj.monthSchedules === 'object') {
      for (const [month, monthObj] of Object.entries(obj.monthSchedules)) {
        yearSchedule.monthSchedules.set(month, this.reviveMonthSchedule(monthObj));
      }
    }
    return yearSchedule;
  }

  /**
   * Helper to revive a MonthSchedule from plain object, reconstructing Maps
   */
  private reviveMonthSchedule(obj: any): MonthSchedule {
    const monthSchedule: MonthSchedule = {
      ...obj,
      daySchedules: new Map(Object.entries(obj.daySchedules || {}))
    };
    return monthSchedule;
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    // Cleanup if needed - for localStorage no specific cleanup required
  }
} 