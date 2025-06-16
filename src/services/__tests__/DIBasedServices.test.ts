import { ServiceContainer } from '../../core/di/ServiceContainer';
import { SERVICE_TOKENS } from '../../core/di/ServiceToken';
import { ValidationServiceFactory, StorageServiceFactory, DateServiceFactory } from '../factories';
import type { IValidationService, IStorageService, IDateService } from '../interfaces';

describe('DI-Based Service Implementations', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
    
    // Mock localStorage for tests
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn().mockReturnValue(null)
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(async () => {
    await container.dispose();
    jest.clearAllMocks();
  });

  describe('ValidationService (DI-based)', () => {
    let validationService: IValidationService;

    beforeEach(() => {
      container.register(SERVICE_TOKENS.VALIDATION_SERVICE, new ValidationServiceFactory());
      validationService = container.resolve<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE);
    });

    it('should be created through dependency injection', () => {
      expect(validationService).toBeDefined();
      expect(validationService.validateTodoInput).toBeDefined();
      expect(validationService.sanitizeTodoInput).toBeDefined();
    });

    it('should validate valid todo input', () => {
      const validInput = {
        title: 'Test Todo',
        description: 'Valid description',
        pointValue: '25'
      };

      const result = validationService.validateTodoInput(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid todo input', () => {
      const invalidInput = {
        title: '', // Empty title
        description: 'Valid description',
        pointValue: '150' // Too high
      };

      const result = validationService.validateTodoInput(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Point value must be between 1 and 100');
    });

    it('should sanitize input strings', () => {
      const unsafeInput = {
        title: '<script>alert("xss")</script>Test',
        description: 'Normal description',
        pointValue: '10'
      };

      const sanitized = validationService.sanitizeTodoInput(unsafeInput);

      expect(sanitized.title).not.toContain('<script>');
      expect(sanitized.title).toContain('&lt;script&gt;');
    });

    it('should validate date strings', () => {
      expect(validationService.isValidDate('2024-03-14')).toBe(true);
      expect(validationService.isValidDate('invalid-date')).toBe(false);
      expect(validationService.isValidDate('2024-13-01')).toBe(false);
    });

    it('should validate month strings', () => {
      expect(validationService.isValidMonth('2024-03')).toBe(true);
      expect(validationService.isValidMonth('2024-13')).toBe(false);
      expect(validationService.isValidMonth('invalid')).toBe(false);
    });

    it('should detect XSS patterns', () => {
      expect(validationService.containsXSS('<script>alert("test")</script>')).toBe(true);
      expect(validationService.containsXSS('javascript:alert("test")')).toBe(true);
      expect(validationService.containsXSS('Normal text')).toBe(false);
    });
  });

  describe('StorageService (DI-based)', () => {
    let storageService: IStorageService;

    beforeEach(() => {
      container.register(SERVICE_TOKENS.STORAGE_SERVICE, new StorageServiceFactory());
      storageService = container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
    });

    it('should be created through dependency injection', () => {
      expect(storageService).toBeDefined();
      expect(storageService.saveYearSchedule).toBeDefined();
      expect(storageService.loadYearSchedule).toBeDefined();
      expect(storageService.saveDaySchedule).toBeDefined();
      expect(storageService.loadDaySchedule).toBeDefined();
    });

    it('should check storage availability', () => {
      expect(storageService.isStorageAvailable()).toBe(true);
    });

    it('should provide storage information', () => {
      const info = storageService.getStorageInfo();

      expect(info).toHaveProperty('used');
      expect(info).toHaveProperty('available');
      expect(info).toHaveProperty('type');
      expect(info.type).toBe('localStorage');
      expect(typeof info.used).toBe('number');
      expect(typeof info.available).toBe('number');
    });

    it('should save and load day schedules', async () => {
      const testSchedule = {
        date: '2024-03-14',
        totalPointValue: 50,
        totalCompletedPointValue: 25,
        todoItems: [],
        completedTodoItems: [],
        incompleteTodoItems: []
      };

      const saveResult = await storageService.saveDaySchedule(testSchedule);
      expect(saveResult.success).toBe(true);
      expect(saveResult.data).toEqual(testSchedule);

      // Mock the getItem call for loading
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(testSchedule));

      const loadResult = await storageService.loadDaySchedule(new Date('2024-03-14'));
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(testSchedule);
    });

    it('should handle missing data gracefully', async () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const loadResult = await storageService.loadDaySchedule(new Date('2024-03-14'));
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toBeNull();
    });

    it('should save and load year schedules', async () => {
      const testYearSchedule = {
        year: 2024,
        monthSchedules: new Map(),
        totalYearPoints: 100,
        totalCompletedYearPoints: 60
      };

      const saveResult = await storageService.saveYearSchedule(testYearSchedule);
      expect(saveResult.success).toBe(true);
      expect(saveResult.data).toEqual(testYearSchedule);
    });

    it('should export and import data', async () => {
      const testData = { 'test_key': { some: 'data' } };
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ some: 'data' }));
      (localStorage.key as jest.Mock).mockReturnValue('test_key');
      Object.defineProperty(localStorage, 'length', { value: 1, writable: true });

      const exportResult = await storageService.exportData();
      expect(exportResult.success).toBe(true);
      expect(typeof exportResult.data).toBe('string');

      const importResult = await storageService.importData(exportResult.data);
      expect(importResult.success).toBe(true);
    });

    it('should clear all data', async () => {
      (localStorage.key as jest.Mock)
        .mockReturnValueOnce('todo_app_test1')
        .mockReturnValueOnce('todo_app_test2')
        .mockReturnValueOnce('other_app_data')
        .mockReturnValueOnce(null);
      Object.defineProperty(localStorage, 'length', { value: 3, writable: true });

      const clearResult = await storageService.clearAllData();
      expect(clearResult.success).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('todo_app_test1');
      expect(localStorage.removeItem).toHaveBeenCalledWith('todo_app_test2');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('other_app_data');
    });
  });

  describe('DateService (DI-based)', () => {
    let dateService: IDateService;

    beforeEach(() => {
      container.register(SERVICE_TOKENS.DATE_SERVICE, new DateServiceFactory());
      dateService = container.resolve<IDateService>(SERVICE_TOKENS.DATE_SERVICE);
    });

    it('should be created through dependency injection', () => {
      expect(dateService).toBeDefined();
      expect(dateService.formatDisplayDate).toBeDefined();
      expect(dateService.formatISODate).toBeDefined();
      expect(dateService.isToday).toBeDefined();
    });

    it('should format dates correctly', () => {
      const testDate = new Date('2024-03-14T10:00:00.000Z');

      const displayDate = dateService.formatDisplayDate(testDate);
      const isoDate = dateService.formatISODate(testDate);
      const isoMonth = dateService.formatISOMonth(testDate);

      expect(displayDate).toBe('03/14/24');
      expect(isoDate).toBe('2024-03-14');
      expect(isoMonth).toBe('2024-03');
    });

    it('should handle month operations', () => {
      const testDate = new Date('2024-03-15');

      const monthStart = dateService.getMonthStart(testDate);
      const monthEnd = dateService.getMonthEnd(testDate);
      const nextMonth = dateService.addMonths(testDate, 1);

      expect(monthStart.getDate()).toBe(1);
      expect(monthStart.getMonth()).toBe(2); // March (0-indexed)
      expect(monthEnd.getMonth()).toBe(2); // March
      expect(monthEnd.getDate()).toBe(31); // Last day of March
      expect(nextMonth.getMonth()).toBe(3); // April
    });

    it('should compare dates correctly', () => {
      const date1 = new Date('2024-03-14');
      const date2 = new Date('2024-03-14');
      const date3 = new Date('2024-03-15');

      expect(dateService.isSameDay(date1, date2)).toBe(true);
      expect(dateService.isSameDay(date1, date3)).toBe(false);
    });

    it('should detect today correctly', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      expect(dateService.isToday(today)).toBe(true);
      expect(dateService.isToday(yesterday)).toBe(false);
    });

    it('should generate calendar days', () => {
      const calendarDays = dateService.generateCalendarDays(2024, 2); // March 2024

      expect(calendarDays.length).toBeGreaterThan(28); // At least the days in March
      expect(calendarDays[0]).toBeInstanceOf(Date);
    });

    it('should provide weekday names', () => {
      const weekdays = dateService.getWeekdays();

      expect(weekdays).toHaveLength(7);
      expect(weekdays[0]).toBe('Sunday');
      expect(weekdays[6]).toBe('Saturday');
    });

    it('should calculate days in month', () => {
      expect(dateService.getDaysInMonth(2024, 1)).toBe(29); // February 2024 (leap year)
      expect(dateService.getDaysInMonth(2024, 2)).toBe(31); // March 2024
      expect(dateService.getDaysInMonth(2023, 1)).toBe(28); // February 2023 (not leap year)
    });

    it('should handle timezone operations', () => {
      const testDate = new Date('2024-03-14T15:30:00.000Z');

      const offset = dateService.getTimezoneOffset();
      const utcDate = dateService.toUTC(testDate);
      const localDate = dateService.fromUTC(utcDate);

      expect(typeof offset).toBe('number');
      expect(utcDate).toBeInstanceOf(Date);
      expect(localDate).toBeInstanceOf(Date);
    });
  });

  describe('Service Disposal', () => {
    it('should dispose services without errors', async () => {
      container.register(SERVICE_TOKENS.VALIDATION_SERVICE, new ValidationServiceFactory());
      container.register(SERVICE_TOKENS.STORAGE_SERVICE, new StorageServiceFactory());
      container.register(SERVICE_TOKENS.DATE_SERVICE, new DateServiceFactory());

      // Resolve services to create instances
      container.resolve<IValidationService>(SERVICE_TOKENS.VALIDATION_SERVICE);
      container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE_SERVICE);
      container.resolve<IDateService>(SERVICE_TOKENS.DATE_SERVICE);

      await expect(container.dispose()).resolves.not.toThrow();
    });
  });
}); 