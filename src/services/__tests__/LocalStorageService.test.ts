import { LocalStorageService } from '../LocalStorageService';
import { YearSchedule, DaySchedule } from '../../types';

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

describe('LocalStorageService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('saveYearSchedule', () => {
    it('should save year schedule successfully', async () => {
      const yearSchedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 0,
        totalCompletedYearPoints: 0
      };

      const result = await LocalStorageService.saveYearSchedule(yearSchedule);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(yearSchedule);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      const yearSchedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 0,
        totalCompletedYearPoints: 0
      };

      // Simulate storage error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = await LocalStorageService.saveYearSchedule(yearSchedule);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('STORAGE');
    });
  });

  describe('loadYearSchedule', () => {
    it('should load year schedule successfully', async () => {
      const yearSchedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 0,
        totalCompletedYearPoints: 0
      };

      localStorageMock.setItem('todo_app_year_2024', JSON.stringify(yearSchedule));

      const result = await LocalStorageService.loadYearSchedule(2024);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(yearSchedule);
    });

    it('should return null for non-existent year', async () => {
      const result = await LocalStorageService.loadYearSchedule(2024);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('saveDaySchedule', () => {
    it('should save day schedule successfully', async () => {
      const daySchedule: DaySchedule = {
        date: '2024-01-01',
        totalPointValue: 0,
        totalCompletedPointValue: 0,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const result = await LocalStorageService.saveDaySchedule(daySchedule);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(daySchedule);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('loadDaySchedule', () => {
    it('should load day schedule successfully', async () => {
      const daySchedule: DaySchedule = {
        date: '2024-01-01',
        totalPointValue: 0,
        totalCompletedPointValue: 0,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      localStorageMock.setItem('todo_app_day_2024-01-01', JSON.stringify(daySchedule));

      const result = await LocalStorageService.loadDaySchedule(new Date('2024-01-01'));

      expect(result.success).toBe(true);
      expect(result.data).toEqual(daySchedule);
    });
  });

  describe('exportData', () => {
    it('should export all data successfully', async () => {
      const yearSchedule: YearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 0,
        totalCompletedYearPoints: 0
      };

      localStorageMock.setItem('todo_app_year_2024', JSON.stringify(yearSchedule));

      const result = await LocalStorageService.exportData();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
    });
  });

  describe('importData', () => {
    it('should import data successfully', async () => {
      const data = JSON.stringify({
        'todo_app_year_2024': {
          year: 2024,
          monthSchedules: new Map(),
          totalYearPoints: 0,
          totalCompletedYearPoints: 0
        }
      });

      const result = await LocalStorageService.importData(data);

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('clearAllData', () => {
    it('should clear all app data successfully', async () => {
      localStorageMock.setItem('todo_app_year_2024', 'data');
      localStorageMock.setItem('todo_app_day_2024-01-01', 'data');

      const result = await LocalStorageService.clearAllData();

      expect(result.success).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when storage is available', () => {
      expect(LocalStorageService.isStorageAvailable()).toBe(true);
    });

    it('should return false when storage is not available', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage not available');
      });

      expect(LocalStorageService.isStorageAvailable()).toBe(false);
    });
  });
}); 