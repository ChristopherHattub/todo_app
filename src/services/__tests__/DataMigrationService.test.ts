import { DataMigrationService } from '../DataMigrationService';
import { LocalStorageService } from '../LocalStorageService';
import { YearSchedule } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index]),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock LocalStorageService
jest.mock('../LocalStorageService');
const mockedLocalStorageService = LocalStorageService as jest.Mocked<typeof LocalStorageService>;

describe('DataMigrationService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('checkAndMigrate', () => {
    it('should set initial version on first run', async () => {
      const result = await DataMigrationService.checkAndMigrate();

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'todo_app_migration_version',
        '1.0.0'
      );
    });

    it('should not migrate if version is current', async () => {
      localStorageMock.setItem('todo_app_migration_version', '1.0.0');

      const result = await DataMigrationService.checkAndMigrate();

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1); // Only initial call
    });

    it('should perform migration if version is different', async () => {
      localStorageMock.setItem('todo_app_migration_version', '0.9.0');
      mockedLocalStorageService.exportData.mockResolvedValue({
        data: '{"test": "data"}',
        success: true
      });

      const result = await DataMigrationService.checkAndMigrate();

      expect(result.success).toBe(true);
      expect(mockedLocalStorageService.exportData).toHaveBeenCalled();
    });

    it('should handle migration errors', async () => {
      localStorageMock.setItem('todo_app_migration_version', '0.9.0');
      mockedLocalStorageService.exportData.mockResolvedValue({
        data: '',
        success: false,
        error: {
          type: 'STORAGE',
          message: 'Export failed',
          timestamp: new Date(),
          recoverable: false
        }
      });

      const result = await DataMigrationService.checkAndMigrate();

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('MIGRATION');
    });
  });

  describe('validateDataIntegrity', () => {
    it('should return true for valid data', async () => {
      const yearSchedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map([
          ['2024-01', {
            date: '2024-01',
            daySchedules: new Map([
              ['2024-01-01', {
                date: '2024-01-01',
                totalPointValue: 10,
                totalCompletedPointValue: 5,
                todoItems: [
                  {
                    id: '1',
                    title: 'Test',
                    description: 'Test todo',
                    pointValue: 5,
                    isCompleted: true,
                    createdAt: new Date(),
                    completedAt: new Date()
                  }
                ],
                completedTodoItems: [],
                incompleteTodoItems: []
              }]
            )],
            totalMonthPoints: 10,
            totalCompletedMonthPoints: 5
          }]
        )],
        totalYearPoints: 10,
        totalCompletedYearPoints: 5
      };

      mockedLocalStorageService.isStorageAvailable.mockReturnValue(true);
      mockedLocalStorageService.loadYearSchedule.mockResolvedValue({
        data: yearSchedule,
        success: true
      });

      const result = await DataMigrationService.validateDataIntegrity();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for invalid data', async () => {
      const invalidYearSchedule = {
        year: 'invalid',
        monthSchedules: 'not a map'
      };

      mockedLocalStorageService.isStorageAvailable.mockReturnValue(true);
      mockedLocalStorageService.loadYearSchedule.mockResolvedValue({
        data: invalidYearSchedule as any,
        success: true
      });

      const result = await DataMigrationService.validateDataIntegrity();

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.error?.message).toContain('Invalid year schedule structure');
    });

    it('should handle storage unavailability', async () => {
      mockedLocalStorageService.isStorageAvailable.mockReturnValue(false);

      const result = await DataMigrationService.validateDataIntegrity();

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
      expect(result.error?.message).toContain('Local storage is not available');
    });
  });

  describe('createBackup', () => {
    it('should create backup successfully', async () => {
      mockedLocalStorageService.exportData.mockResolvedValue({
        data: '{"test": "data"}',
        success: true
      });

      const result = await DataMigrationService.createBackup('test');

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.data).toMatch(/todo_app_manual_backup_test_\d+/);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle backup creation errors', async () => {
      mockedLocalStorageService.exportData.mockResolvedValue({
        data: '',
        success: false,
        error: {
          type: 'STORAGE',
          message: 'Export failed',
          timestamp: new Date(),
          recoverable: false
        }
      });

      const result = await DataMigrationService.createBackup('test');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('MIGRATION');
    });
  });

  describe('listBackups', () => {
    it('should list backups correctly', () => {
      const timestamp1 = Date.now();
      const timestamp2 = Date.now() + 1000;
      
      localStorageMock.setItem(`todo_app_backup_1.0.0_${timestamp1}`, 'data1');
      localStorageMock.setItem(`todo_app_manual_backup_test_${timestamp2}`, 'data2');
      localStorageMock.setItem('unrelated_key', 'data3');

      const backups = DataMigrationService.listBackups();

      expect(backups).toHaveLength(2);
      expect(backups[0].timestamp).toBe(timestamp2); // Most recent first
      expect(backups[0].type).toBe('manual');
      expect(backups[1].timestamp).toBe(timestamp1);
      expect(backups[1].type).toBe('migration');
    });

    it('should return empty array when no backups exist', () => {
      const backups = DataMigrationService.listBackups();
      expect(backups).toHaveLength(0);
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup successfully', async () => {
      const backupKey = 'todo_app_backup_1.0.0_123456789';
      const backupData = '{"test": "data"}';
      
      localStorageMock.setItem(backupKey, backupData);
      mockedLocalStorageService.importData.mockResolvedValue({
        data: undefined,
        success: true
      });

      const result = await DataMigrationService.restoreFromBackup(backupKey);

      expect(result.success).toBe(true);
      expect(mockedLocalStorageService.importData).toHaveBeenCalledWith(backupData);
    });

    it('should handle missing backup', async () => {
      const result = await DataMigrationService.restoreFromBackup('nonexistent_backup');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not found');
    });

    it('should handle import errors', async () => {
      const backupKey = 'todo_app_backup_1.0.0_123456789';
      const backupData = '{"test": "data"}';
      
      localStorageMock.setItem(backupKey, backupData);
      mockedLocalStorageService.importData.mockResolvedValue({
        data: undefined,
        success: false,
        error: {
          type: 'STORAGE',
          message: 'Import failed',
          timestamp: new Date(),
          recoverable: false
        }
      });

      const result = await DataMigrationService.restoreFromBackup(backupKey);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('MIGRATION');
    });
  });

  describe('cleanOldBackups', () => {
    it('should keep only 5 most recent backups', async () => {
      // Create 7 backups
      for (let i = 0; i < 7; i++) {
        const timestamp = Date.now() + i * 1000;
        localStorageMock.setItem(`todo_app_backup_1.0.0_${timestamp}`, 'data');
      }

      const result = await DataMigrationService.cleanOldBackups();

      expect(result.success).toBe(true);
      expect(result.data).toBe(2); // 2 backups deleted
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
    });

    it('should not delete anything if 5 or fewer backups exist', async () => {
      // Create 3 backups
      for (let i = 0; i < 3; i++) {
        const timestamp = Date.now() + i * 1000;
        localStorageMock.setItem(`todo_app_backup_1.0.0_${timestamp}`, 'data');
      }

      const result = await DataMigrationService.cleanOldBackups();

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('version management', () => {
    it('should return correct version history', () => {
      const history = DataMigrationService.getVersionHistory();
      expect(history).toContain('1.0.0');
      expect(Array.isArray(history)).toBe(true);
    });

    it('should return current version', () => {
      const version = DataMigrationService.getCurrentVersion();
      expect(version).toBe('1.0.0');
    });

    it('should return stored version', () => {
      localStorageMock.setItem('todo_app_migration_version', '1.0.0');
      const version = DataMigrationService.getStoredVersion();
      expect(version).toBe('1.0.0');
    });

    it('should return null if no stored version', () => {
      const version = DataMigrationService.getStoredVersion();
      expect(version).toBeNull();
    });
  });
}); 