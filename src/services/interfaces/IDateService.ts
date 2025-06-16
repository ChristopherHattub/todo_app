export interface IDateService {
  // Formatting
  formatDisplayDate(date: Date): string;
  formatISODate(date: Date): string;
  formatISOMonth(date: Date): string;

  // Navigation
  getMonthStart(date: Date): Date;
  getMonthEnd(date: Date): Date;
  addMonths(date: Date, months: number): Date;

  // Comparison
  isToday(date: Date): boolean;
  isSameDay(date1: Date, date2: Date): boolean;

  // Calendar
  generateCalendarDays(year: number, month: number): Date[];
  getWeekdays(): string[];
  getDaysInMonth(year: number, month: number): number;

  // Timezone
  getTimezoneOffset(): number;
  toUTC(date: Date): Date;
  fromUTC(date: Date): Date;
} 