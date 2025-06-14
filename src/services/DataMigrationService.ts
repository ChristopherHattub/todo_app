import { StorageResponse, ServiceError } from '../types';
import { LocalStorageService } from './LocalStorageService';

/**
 * Service for handling data migrations and backward compatibility
 */
export class DataMigrationService {
  private static readonly MIGRATION_VERSION_KEY = 'todo_app_migration_version';
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * Data structure version history
   */
  private static readonly VERSION_HISTORY = [
    '1.0.0' // Initial version
  ];

  /**
   * Check if migration is needed and perform migration
   */
  public static async checkAndMigrate(): Promise<StorageResponse<void>> {
    try {
      const currentVersion = localStorage.getItem(this.MIGRATION_VERSION_KEY);
      
      if (!currentVersion) {
        // First time setup - no migration needed
        localStorage.setItem(this.MIGRATION_VERSION_KEY, this.CURRENT_VERSION);
        return {
          data: undefined,
          success: true
        };
      }

      if (currentVersion !== this.CURRENT_VERSION) {
        const migrationResult = await this.performMigration(currentVersion, this.CURRENT_VERSION);
        if (migrationResult.success) {
          localStorage.setItem(this.MIGRATION_VERSION_KEY, this.CURRENT_VERSION);
        }
        return migrationResult;
      }

      return {
        data: undefined,
        success: true
      };
    } catch (error) {
      return this.handleMigrationError(error, 'Migration check failed');
    }
  }

  /**
   * Perform data migration between versions
   */
  private static async performMigration(fromVersion: string, toVersion: string): Promise<StorageResponse<void>> {
    try {
      // Export current data for backup
      const backupResult = await LocalStorageService.exportData();
      if (!backupResult.success) {
        throw new Error('Failed to create backup before migration');
      }

      // Store backup with timestamp
      const backupKey = `todo_app_backup_${fromVersion}_${Date.now()}`;
      localStorage.setItem(backupKey, backupResult.data);

      // Perform version-specific migrations
      switch (fromVersion) {
        case '0.9.0':
          await this.migrateFrom090To100();
          break;
        // Add more migration cases as needed
        default:
          console.warn(`No migration path defined from ${fromVersion} to ${toVersion}`);
      }

      return {
        data: undefined,
        success: true
      };
    } catch (error) {
      return this.handleMigrationError(error, 'Migration failed');
    }
  }

  /**
   * Migrate from version 0.9.0 to 1.0.0
   * Example migration - add more specific migrations as needed
   */
  private static async migrateFrom090To100(): Promise<void> {
    // Example: If we changed data structure, we would transform it here
    // This is a placeholder for future migrations
    console.log('Migrating from 0.9.0 to 1.0.0 - no changes needed');
  }

  /**
   * Validate data integrity after migration
   */
  public static async validateDataIntegrity(): Promise<StorageResponse<boolean>> {
    try {
      let isValid = true;
      const validationErrors: string[] = [];

      // Check storage availability
      if (!LocalStorageService.isStorageAvailable()) {
        validationErrors.push('Local storage is not available');
        isValid = false;
      }

      // Validate current year data
      const currentYear = new Date().getFullYear();
      const yearDataResult = await LocalStorageService.loadYearSchedule(currentYear);
      
      if (yearDataResult.success && yearDataResult.data) {
        const yearData = yearDataResult.data;
        
        // Validate year schedule structure
        if (typeof yearData.year !== 'number' || yearData.year !== currentYear) {
          validationErrors.push('Invalid year schedule structure');
          isValid = false;
        }

        if (!(yearData.monthSchedules instanceof Map)) {
          validationErrors.push('Month schedules should be a Map');
          isValid = false;
        }

        // Validate month schedules
        for (const [monthKey, monthSchedule] of yearData.monthSchedules) {
          if (!(monthSchedule.daySchedules instanceof Map)) {
            validationErrors.push(`Day schedules for ${monthKey} should be a Map`);
            isValid = false;
          }

          // Validate day schedules
          for (const [dayKey, daySchedule] of monthSchedule.daySchedules) {
            if (!Array.isArray(daySchedule.todoItems)) {
              validationErrors.push(`Todo items for ${dayKey} should be an array`);
              isValid = false;
            }

            // Validate todo items
            for (const todo of daySchedule.todoItems) {
              if (!todo.id || !todo.title || typeof todo.pointValue !== 'number') {
                validationErrors.push(`Invalid todo item structure in ${dayKey}`);
                isValid = false;
              }
            }
          }
        }
      }

      return {
        data: isValid,
        success: true,
        error: validationErrors.length > 0 ? {
          type: 'VALIDATION',
          message: validationErrors.join('; '),
          timestamp: new Date(),
          recoverable: true,
          context: validationErrors
        } : undefined
      };
    } catch (error) {
      return this.handleMigrationError(error, 'Data integrity validation failed');
    }
  }

  /**
   * Get migration version history
   */
  public static getVersionHistory(): string[] {
    return [...this.VERSION_HISTORY];
  }

  /**
   * Get current migration version
   */
  public static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }

  /**
   * Get stored migration version
   */
  public static getStoredVersion(): string | null {
    return localStorage.getItem(this.MIGRATION_VERSION_KEY);
  }

  /**
   * Create a manual backup
   */
  public static async createBackup(label?: string): Promise<StorageResponse<string>> {
    try {
      const exportResult = await LocalStorageService.exportData();
      if (!exportResult.success) {
        throw new Error('Failed to export data for backup');
      }

      const backupKey = `todo_app_manual_backup_${label || 'manual'}_${Date.now()}`;
      localStorage.setItem(backupKey, exportResult.data);

      return {
        data: backupKey,
        success: true
      };
    } catch (error) {
      return this.handleMigrationError(error, 'Failed to create backup');
    }
  }

  /**
   * List available backups
   */
  public static listBackups(): Array<{ key: string; timestamp: number; type: string }> {
    const backups: Array<{ key: string; timestamp: number; type: string }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('todo_app_backup_') || key?.startsWith('todo_app_manual_backup_')) {
        const parts = key.split('_');
        const timestamp = parseInt(parts[parts.length - 1]);
        const type = key.includes('manual') ? 'manual' : 'migration';
        
        backups.push({ key, timestamp, type });
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Restore from backup
   */
  public static async restoreFromBackup(backupKey: string): Promise<StorageResponse<void>> {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error(`Backup ${backupKey} not found`);
      }

      const importResult = await LocalStorageService.importData(backupData);
      if (!importResult.success) {
        throw new Error('Failed to restore from backup');
      }

      return {
        data: undefined,
        success: true
      };
    } catch (error) {
      return this.handleMigrationError(error, 'Failed to restore from backup');
    }
  }

  /**
   * Clean old backups (keep only last 5)
   */
  public static async cleanOldBackups(): Promise<StorageResponse<number>> {
    try {
      const backups = this.listBackups();
      const toDelete = backups.slice(5); // Keep only 5 most recent
      
      toDelete.forEach(backup => {
        localStorage.removeItem(backup.key);
      });

      return {
        data: toDelete.length,
        success: true
      };
    } catch (error) {
      return this.handleMigrationError(error, 'Failed to clean old backups');
    }
  }

  /**
   * Handle migration errors
   */
  private static handleMigrationError(error: unknown, message: string): StorageResponse<any> {
    const serviceError: ServiceError = {
      type: 'MIGRATION',
      message: error instanceof Error ? error.message : message,
      timestamp: new Date(),
      recoverable: true,
      context: error
    };

    return {
      data: null,
      success: false,
      error: serviceError
    };
  }
} 