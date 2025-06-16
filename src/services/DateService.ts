import { IDateService } from './interfaces/IDateService';

/**
 * Service for handling date operations and calendar functionality
 */
export class DateService implements IDateService {
  private static instance: DateService;
  private readonly weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /**
   * Get singleton instance of DateService
   */
  public static getInstance(): DateService {
    if (!DateService.instance) {
      DateService.instance = new DateService();
    }
    return DateService.instance;
  }

  /**
   * Format date for display (MM/DD/YY)
   */
  public formatDisplayDate(date: Date): string {
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  }

  /**
   * Format date as ISO date string (YYYY-MM-DD)
   */
  public formatISODate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format date as ISO month string (YYYY-MM)
   */
  public formatISOMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get the start of the month for a given date
   */
  public getMonthStart(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the end of the month for a given date
   */
  public getMonthEnd(date: Date): Date {
    const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Add or subtract months from a date
   */
  public addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Check if a date is today
   */
  public isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  /**
   * Check if two dates are the same day
   */
  public isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  }

  /**
   * Generate an array of dates for a calendar month view
   * Includes padding days from previous/next months to fill complete weeks
   */
  public generateCalendarDays(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate the number of days from the previous month to include
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate the number of days from the next month to include
    const totalDays = lastDay.getDate();
    const lastDayOfWeek = lastDay.getDay();
    const daysFromNextMonth = 6 - lastDayOfWeek;
    
    const calendarDays: Date[] = [];
    
    // Add days from previous month
    if (daysFromPrevMonth > 0) {
      const prevMonth = new Date(year, month - 1);
      const daysInPrevMonth = this.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
      for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
        calendarDays.push(new Date(year, month - 1, i));
      }
    }
    
    // Add days from current month
    for (let i = 1; i <= totalDays; i++) {
      calendarDays.push(new Date(year, month, i));
    }
    
    // Add days from next month
    if (daysFromNextMonth > 0) {
      for (let i = 1; i <= daysFromNextMonth; i++) {
        calendarDays.push(new Date(year, month + 1, i));
      }
    }
    
    return calendarDays;
  }

  /**
   * Get array of weekday names
   */
  public getWeekdays(): string[] {
    return this.weekdays;
  }

  /**
   * Get the number of days in a month
   */
  public getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Check if a year is a leap year
   */
  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Get the timezone offset in minutes
   */
  public getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }

  /**
   * Convert a date to UTC
   */
  public toUTC(date: Date): Date {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    ));
  }

  /**
   * Convert a UTC date to local time
   */
  public fromUTC(date: Date): Date {
    return new Date(date.getTime() + this.getTimezoneOffset() * 60000);
  }
} 