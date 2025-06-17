import { IStorageService } from './interfaces/IStorageService';
import { YearSchedule, DaySchedule, StorageResponse, ServiceError, MonthSchedule } from '../types';
import { IndexedDBConfig } from '../types/storage';

/**
 * IndexedDB storage service implementation for larger data storage needs
 * Provides structured data storage with indexes and supports larger volumes than localStorage
 */
export class IndexedDBStorageService implements IStorageService {
  private readonly config: IndexedDBConfig = {
    dbName: 'TodoAppDB',
    version: 1,
    stores: {
      yearSchedules: 'yearSchedules',
      daySchedules: 'daySchedules'
    }
  };
  
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeDB();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isStorageAvailable()) {
        reject(new Error('IndexedDB is not available'));
        return;
      }

      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create year schedules store
        if (!db.objectStoreNames.contains(this.config.stores.yearSchedules)) {
          const yearStore = db.createObjectStore(this.config.stores.yearSchedules, {
            keyPath: 'year'
          });
          yearStore.createIndex('year', 'year', { unique: true });
        }

        // Create day schedules store
        if (!db.objectStoreNames.contains(this.config.stores.daySchedules)) {
          const dayStore = db.createObjectStore(this.config.stores.daySchedules, {
            keyPath: 'date'
          });
          dayStore.createIndex('date', 'date', { unique: true });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('IndexedDB is not initialized');
    }
  }

  /**
   * Save a year schedule to IndexedDB
   */
  public async saveYearSchedule(yearSchedule: YearSchedule): Promise<StorageResponse<YearSchedule>> {
    try {
      await this.ensureInitialized();

      const serializedSchedule = this.serializeYearSchedule(yearSchedule);
      
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.config.stores.yearSchedules], 'readwrite');
        const store = transaction.objectStore(this.config.stores.yearSchedules);
        const request = store.put(serializedSchedule);

        request.onsuccess = () => {
          resolve({
            data: yearSchedule,
            success: true
          });
        };

        request.onerror = () => {
          resolve(this.handleStorageError(request.error, 'Failed to save year schedule'));
        };
      });
    } catch (error) {
      return this.handleStorageError(error, 'Failed to save year schedule');
    }
  }

  /**
   * Load a year schedule from IndexedDB
   */
  public async loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.config.stores.yearSchedules], 'readonly');
        const store = transaction.objectStore(this.config.stores.yearSchedules);
        const request = store.get(year);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve({
              data: null,
              success: true
            });
            return;
          }

          const yearSchedule = this.deserializeYearSchedule(result);
          resolve({
            data: yearSchedule,
            success: true
          });
        };

        request.onerror = () => {
          resolve(this.handleStorageError(request.error, 'Failed to load year schedule'));
        };
      });
    } catch (error) {
      return this.handleStorageError(error, 'Failed to load year schedule');
    }
  }

  /**
   * Save a day schedule to IndexedDB
   */
  public async saveDaySchedule(daySchedule: DaySchedule): Promise<StorageResponse<DaySchedule>> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.config.stores.daySchedules], 'readwrite');
        const store = transaction.objectStore(this.config.stores.daySchedules);
        const request = store.put(daySchedule);

        request.onsuccess = () => {
          resolve({
            data: daySchedule,
            success: true
          });
        };

        request.onerror = () => {
          resolve(this.handleStorageError(request.error, 'Failed to save day schedule'));
        };
      });
    } catch (error) {
      return this.handleStorageError(error, 'Failed to save day schedule');
    }
  }

  /**
   * Load a day schedule from IndexedDB
   */
  public async loadDaySchedule(date: Date): Promise<StorageResponse<DaySchedule | null>> {
    try {
      await this.ensureInitialized();

      const dateString = date.toISOString().split('T')[0];

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.config.stores.daySchedules], 'readonly');
        const store = transaction.objectStore(this.config.stores.daySchedules);
        const request = store.get(dateString);

        request.onsuccess = () => {
          const result = request.result;
          resolve({
            data: result || null,
            success: true
          });
        };

        request.onerror = () => {
          resolve(this.handleStorageError(request.error, 'Failed to load day schedule'));
        };
      });
    } catch (error) {
      return this.handleStorageError(error, 'Failed to load day schedule');
    }
  }

  /**
   * Export all data as a JSON string
   */
  public async exportData(): Promise<StorageResponse<string>> {
    try {
      await this.ensureInitialized();

      const exportData: Record<string, any> = {};

      // Export year schedules
      const yearSchedules = await this.getAllFromStore(this.config.stores.yearSchedules);
      exportData.yearSchedules = yearSchedules;

      // Export day schedules
      const daySchedules = await this.getAllFromStore(this.config.stores.daySchedules);
      exportData.daySchedules = daySchedules;

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
      await this.ensureInitialized();

      const importedData = JSON.parse(data);
      
      // Clear existing data
      await this.clearAllData();
      
      // Import year schedules
      if (importedData.yearSchedules) {
        await this.putAllToStore(this.config.stores.yearSchedules, importedData.yearSchedules);
      }

      // Import day schedules
      if (importedData.daySchedules) {
        await this.putAllToStore(this.config.stores.daySchedules, importedData.daySchedules);
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
   * Clear all application data from IndexedDB
   */
  public async clearAllData(): Promise<StorageResponse<void>> {
    try {
      await this.ensureInitialized();

      return new Promise((resolve) => {
        const transaction = this.db!.transaction(
          [this.config.stores.yearSchedules, this.config.stores.daySchedules], 
          'readwrite'
        );

        const yearStore = transaction.objectStore(this.config.stores.yearSchedules);
        const dayStore = transaction.objectStore(this.config.stores.daySchedules);

        const clearYears = yearStore.clear();
        const clearDays = dayStore.clear();

        transaction.oncomplete = () => {
          resolve({
            data: undefined,
            success: true
          });
        };

        transaction.onerror = () => {
          resolve(this.handleStorageError(transaction.error, 'Failed to clear data'));
        };
      });
    } catch (error) {
      return this.handleStorageError(error, 'Failed to clear data');
    }
  }

  /**
   * Check if IndexedDB is available
   */
  public isStorageAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Get storage information
   */
  public getStorageInfo(): { used: number; available: number; type: string } {
    // IndexedDB doesn't provide direct size information
    // This is an approximation
    return {
      used: 0, // Would need to calculate by iterating through all data
      available: 100 * 1024 * 1024, // Typical IndexedDB quota is much larger
      type: 'indexedDB'
    };
  }

  /**
   * Get all items from a store
   */
  private async getAllFromStore(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Put all items to a store
   */
  private async putAllToStore(storeName: string, items: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      const total = items.length;

      if (total === 0) {
        resolve();
        return;
      }

      items.forEach(item => {
        const request = store.put(item);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  }

  /**
   * Serialize YearSchedule for IndexedDB storage
   */
  private serializeYearSchedule(yearSchedule: YearSchedule): any {
    return {
      year: yearSchedule.year,
      monthSchedules: Object.fromEntries(yearSchedule.monthSchedules),
      totalYearPoints: yearSchedule.totalYearPoints,
      totalCompletedYearPoints: yearSchedule.totalCompletedYearPoints
    };
  }

  /**
   * Deserialize YearSchedule from IndexedDB storage
   */
  private deserializeYearSchedule(data: any): YearSchedule {
    const yearSchedule: YearSchedule = {
      year: data.year,
      monthSchedules: new Map(),
      totalYearPoints: data.totalYearPoints,
      totalCompletedYearPoints: data.totalCompletedYearPoints
    };

    // Reconstruct Map from object
    if (data.monthSchedules) {
      for (const [month, monthObj] of Object.entries(data.monthSchedules)) {
        const monthSchedule: MonthSchedule = {
          ...(monthObj as MonthSchedule),
          daySchedules: new Map(Object.entries((monthObj as any).daySchedules || {}))
        };
        yearSchedule.monthSchedules.set(month, monthSchedule);
      }
    }

    return yearSchedule;
  }

  /**
   * Handle storage errors and create appropriate error response
   */
  private handleStorageError(error: unknown, message: string): StorageResponse<any> {
    const serviceError: ServiceError = {
      type: 'STORAGE',
      message: error instanceof Error ? error.message : message,
      timestamp: new Date(),
      recoverable: true, // IndexedDB errors are usually recoverable
      context: error
    };

    return {
      data: null,
      success: false,
      error: serviceError
    };
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }
} 