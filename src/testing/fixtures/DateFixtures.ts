/**
 * Date fixtures for testing date-related functionality
 */

/**
 * Standard test dates
 */
export const TestDates = {
  // Fixed dates for consistent testing
  JANUARY_1_2024: new Date('2024-01-01T00:00:00Z'),
  JUNE_15_2024: new Date('2024-06-15T12:00:00Z'),
  DECEMBER_31_2024: new Date('2024-12-31T23:59:59Z'),
  
  // Edge cases
  LEAP_YEAR_FEB_29: new Date('2024-02-29T12:00:00Z'),
  NON_LEAP_YEAR_FEB_28: new Date('2023-02-28T12:00:00Z'),
  
  // Week boundaries
  SUNDAY_START: new Date('2024-01-07T00:00:00Z'), // Sunday
  MONDAY_START: new Date('2024-01-01T00:00:00Z'), // Monday
  SATURDAY_END: new Date('2024-01-06T23:59:59Z'), // Saturday
  
  // Month boundaries
  MONTH_START: new Date('2024-03-01T00:00:00Z'),
  MONTH_END: new Date('2024-03-31T23:59:59Z'),
  
  // Year boundaries
  YEAR_START: new Date('2024-01-01T00:00:00Z'),
  YEAR_END: new Date('2024-12-31T23:59:59Z'),
  
  // Different years
  YEAR_2023: new Date('2023-06-15T12:00:00Z'),
  YEAR_2025: new Date('2025-06-15T12:00:00Z')
};

/**
 * Create a date with specific components
 */
export const createTestDate = (
  year: number = 2024,
  month: number = 1, // 1-indexed
  day: number = 1,
  hour: number = 12,
  minute: number = 0,
  second: number = 0
): Date => {
  return new Date(year, month - 1, day, hour, minute, second);
};

/**
 * Create a date relative to today
 */
export const createRelativeDate = (daysOffset: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

/**
 * Date ranges for testing
 */
export const createDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Week date ranges
 */
export const createWeekDates = (startDate: Date = TestDates.MONDAY_START): Date[] => {
  return createDateRange(startDate, new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000));
};

/**
 * Month date ranges
 */
export const createMonthDates = (year: number = 2024, month: number = 1): Date[] => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month
  return createDateRange(startDate, endDate);
};

/**
 * Year date ranges (sampled - not every day)
 */
export const createYearDates = (year: number = 2024): Date[] => {
  const dates: Date[] = [];
  
  // Add first day of each month
  for (let month = 0; month < 12; month++) {
    dates.push(new Date(year, month, 1));
  }
  
  return dates;
};

/**
 * Time zone test dates
 */
export const TimeZoneTestDates = {
  UTC_MIDNIGHT: new Date('2024-01-01T00:00:00Z'),
  UTC_NOON: new Date('2024-01-01T12:00:00Z'),
  
  // Specific timezone examples (as ISO strings)
  PACIFIC_MIDNIGHT: '2024-01-01T00:00:00-08:00',
  EASTERN_MIDNIGHT: '2024-01-01T00:00:00-05:00',
  LONDON_MIDNIGHT: '2024-01-01T00:00:00+00:00',
  TOKYO_MIDNIGHT: '2024-01-01T00:00:00+09:00'
};

/**
 * Daylight saving time test dates
 */
export const DSTTestDates = {
  // US DST 2024
  BEFORE_DST_START: new Date('2024-03-09T12:00:00Z'),
  DST_START: new Date('2024-03-10T12:00:00Z'),
  DURING_DST: new Date('2024-07-15T12:00:00Z'),
  DST_END: new Date('2024-11-03T12:00:00Z'),
  AFTER_DST_END: new Date('2024-11-04T12:00:00Z')
};

/**
 * Format test data
 */
export const DateFormatTestData = {
  date: TestDates.JUNE_15_2024,
  expectedFormats: {
    ISO: '2024-06-15',
    US: '06/15/2024',
    EU: '15/06/2024',
    LONG: 'June 15, 2024',
    SHORT: 'Jun 15',
    WEEKDAY: 'Saturday',
    MONTH_YEAR: 'June 2024'
  }
};

/**
 * Date validation test cases
 */
export const DateValidationTestCases = {
  valid: [
    TestDates.JANUARY_1_2024,
    TestDates.LEAP_YEAR_FEB_29,
    new Date('2024-12-31')
  ],
  invalid: [
    new Date('invalid'),
    new Date('2024-02-30'), // Invalid date
    new Date('2024-13-01'), // Invalid month
    new Date(''),
    null as any,
    undefined as any
  ]
};

/**
 * Calendar navigation test scenarios
 */
export const CalendarNavigationScenarios = {
  nextDay: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2024-01-02T00:00:00Z')
  },
  previousDay: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2023-12-31T00:00:00Z')
  },
  nextWeek: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2024-01-08T00:00:00Z')
  },
  previousWeek: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2023-12-25T00:00:00Z')
  },
  nextMonth: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2024-02-01T00:00:00Z')
  },
  previousMonth: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2023-12-01T00:00:00Z')
  },
  nextYear: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2025-01-01T00:00:00Z')
  },
  previousYear: {
    from: TestDates.JANUARY_1_2024,
    to: new Date('2023-01-01T00:00:00Z')
  }
};

/**
 * Date comparison test cases
 */
export const DateComparisonTestCases = {
  same: {
    date1: TestDates.JANUARY_1_2024,
    date2: new Date('2024-01-01T00:00:00Z'),
    expectedSame: true
  },
  different: {
    date1: TestDates.JANUARY_1_2024,
    date2: TestDates.JUNE_15_2024,
    expectedSame: false
  },
  differentTime: {
    date1: new Date('2024-01-01T10:00:00Z'),
    date2: new Date('2024-01-01T15:00:00Z'),
    expectedSameDay: true,
    expectedSameTime: false
  }
};

/**
 * Date utility functions for tests
 */
export const DateTestUtils = {
  /**
   * Create a date string in ISO format
   */
  toISOString: (date: Date): string => date.toISOString().split('T')[0],
  
  /**
   * Create a date from ISO string
   */
  fromISOString: (dateString: string): Date => new Date(dateString + 'T00:00:00Z'),
  
  /**
   * Check if two dates are the same day
   */
  isSameDay: (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  },
  
  /**
   * Get start of day
   */
  startOfDay: (date: Date): Date => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  },
  
  /**
   * Get end of day
   */
  endOfDay: (date: Date): Date => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  },
  
  /**
   * Add days to a date
   */
  addDays: (date: Date, days: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  },
  
  /**
   * Add months to a date
   */
  addMonths: (date: Date, months: number): Date => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  },
  
  /**
   * Add years to a date
   */
  addYears: (date: Date, years: number): Date => {
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate;
  }
}; 