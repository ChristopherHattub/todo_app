import { DateService } from '../DateService';

describe('DateService', () => {
  let dateService: DateService;
  const mockDate = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    dateService = DateService.getInstance();
    // Mock current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatDisplayDate', () => {
    it('should format date in MM/DD/YY format', () => {
      expect(dateService.formatDisplayDate(mockDate)).toBe('01/15/24');
    });

    it('should handle single digit months and days', () => {
      const date = new Date('2024-02-05T12:00:00Z');
      expect(dateService.formatDisplayDate(date)).toBe('02/05/24');
    });
  });

  describe('formatISODate', () => {
    it('should format date in YYYY-MM-DD format', () => {
      expect(dateService.formatISODate(mockDate)).toBe('2024-01-15');
    });
  });

  describe('formatISOMonth', () => {
    it('should format date in YYYY-MM format', () => {
      expect(dateService.formatISOMonth(mockDate)).toBe('2024-01');
    });
  });

  describe('getMonthStart', () => {
    it('should return the first day of the month', () => {
      const result = dateService.getMonthStart(mockDate);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2024);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('getMonthEnd', () => {
    it('should return the last day of the month', () => {
      const result = dateService.getMonthEnd(mockDate);
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2024);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should handle months with different lengths', () => {
      const febDate = new Date('2024-02-15T12:00:00Z');
      const result = dateService.getMonthEnd(febDate);
      expect(result.getDate()).toBe(29); // 2024 is a leap year
    });
  });

  describe('addMonths', () => {
    it('should add months correctly', () => {
      const result = dateService.addMonths(mockDate, 2);
      expect(result.getMonth()).toBe(2); // March
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle month overflow', () => {
      const result = dateService.addMonths(mockDate, 13);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getFullYear()).toBe(2025);
    });

    it('should handle negative months', () => {
      const result = dateService.addMonths(mockDate, -1);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getFullYear()).toBe(2023);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(dateService.isToday(today)).toBe(true);
    });

    it('should return false for other days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(dateService.isToday(tomorrow)).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15T12:00:00Z');
      const date2 = new Date('2024-01-15T23:59:59Z');
      expect(dateService.isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15T12:00:00Z');
      const date2 = new Date('2024-01-16T00:00:00Z');
      expect(dateService.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('generateCalendarDays', () => {
    it('should generate correct number of days for a month', () => {
      const days = dateService.generateCalendarDays(2024, 0); // January 2024
      expect(days.length % 7).toBe(0); // Should be divisible by 7
      expect(days.length).toBeGreaterThanOrEqual(28); // At least 4 weeks
      expect(days.length).toBeLessThanOrEqual(42); // At most 6 weeks
    });

    it('should include correct padding days', () => {
      const days = dateService.generateCalendarDays(2024, 0); // January 2024
      const firstDay = days[0];
      const lastDay = days[days.length - 1];
      
      // January 2024 starts on a Monday (1)
      expect(firstDay.getMonth()).toBe(11); // December
      expect(lastDay.getMonth()).toBe(1); // February
    });

    it('should handle leap years correctly', () => {
      const days = dateService.generateCalendarDays(2024, 1); // February 2024
      const lastDay = days.find(d => d.getMonth() === 1 && d.getDate() === 29);
      expect(lastDay).toBeDefined();
    });
  });

  describe('getWeekdays', () => {
    it('should return array of weekday names', () => {
      const weekdays = dateService.getWeekdays();
      expect(weekdays).toHaveLength(7);
      expect(weekdays[0]).toBe('Sunday');
      expect(weekdays[6]).toBe('Saturday');
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct number of days for each month', () => {
      expect(dateService.getDaysInMonth(2024, 0)).toBe(31); // January
      expect(dateService.getDaysInMonth(2024, 1)).toBe(29); // February (leap year)
      expect(dateService.getDaysInMonth(2024, 3)).toBe(30); // April
    });

    it('should handle non-leap years', () => {
      expect(dateService.getDaysInMonth(2023, 1)).toBe(28); // February (non-leap year)
    });
  });

  describe('timezone handling', () => {
    it('should get timezone offset', () => {
      const offset = dateService.getTimezoneOffset();
      expect(typeof offset).toBe('number');
    });

    it('should convert to UTC', () => {
      const localDate = new Date();
      const utcDate = dateService.toUTC(localDate);
      expect(utcDate.getUTCHours()).toBe(localDate.getHours());
    });

    it('should convert from UTC', () => {
      const utcDate = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
      const localDate = dateService.fromUTC(utcDate);
      expect(localDate.getHours()).toBe(utcDate.getUTCHours());
    });
  });
}); 