import { ValidationResult } from '../types/services';
import { TodoItem, DaySchedule, YearSchedule, EntryFormData } from '../types';

/**
 * Service for handling input validation and data integrity checks
 */
export class ValidationService {
  private static instance: ValidationService;
  private readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /eval\s*\(/gi,
    /alert\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /location\./gi,
    /document\.cookie/gi,
    /document\.write/gi,
    /document\.domain/gi,
    /document\.referrer/gi,
    /document\.location/gi,
    /document\.URL/gi,
    /document\.URLUnencoded/gi,
    /document\.baseURI/gi,
    /document\.images/gi,
    /document\.forms/gi,
    /document\.links/gi,
    /document\.anchors/gi,
    /document\.applets/gi,
    /document\.embeds/gi,
    /document\.plugins/gi,
    /document\.scripts/gi,
    /document\.styleSheets/gi,
    /document\.title/gi,
    /document\.body/gi,
    /document\.all/gi,
    /document\.getElementById/gi,
    /document\.getElementsByTagName/gi,
    /document\.getElementsByClassName/gi,
    /document\.querySelector/gi,
    /document\.querySelectorAll/gi,
    /document\.createElement/gi,
    /document\.createTextNode/gi,
    /document\.createDocumentFragment/gi,
    /document\.createAttribute/gi,
    /document\.createEvent/gi,
    /document\.createRange/gi,
    /document\.createTreeWalker/gi,
    /document\.importNode/gi,
    /document\.adoptNode/gi,
    /document\.normalize/gi,
    /document\.renameNode/gi,
    /document\.open/gi,
    /document\.close/gi,
    /document\.execCommand/gi,
    /document\.queryCommandEnabled/gi,
    /document\.queryCommandIndeterm/gi,
    /document\.queryCommandState/gi,
    /document\.queryCommandSupported/gi,
    /document\.queryCommandValue/gi,
    /document\.getElementsByName/gi,
    /document\.getElementsByTagNameNS/gi,
    /document\.getElementsByClassName/gi,
    /document\.getElementById/gi,
    /document\.querySelector/gi,
    /document\.querySelectorAll/gi,
    /document\.createElement/gi,
    /document\.createElementNS/gi,
    /document\.createTextNode/gi,
    /document\.createDocumentFragment/gi,
    /document\.createAttribute/gi,
    /document\.createAttributeNS/gi,
    /document\.createEvent/gi,
    /document\.createRange/gi,
    /document\.createTreeWalker/gi,
    /document\.importNode/gi,
    /document\.adoptNode/gi,
    /document\.normalize/gi,
    /document\.renameNode/gi,
    /document\.open/gi,
    /document\.close/gi,
    /document\.execCommand/gi,
    /document\.queryCommandEnabled/gi,
    /document\.queryCommandIndeterm/gi,
    /document\.queryCommandState/gi,
    /document\.queryCommandSupported/gi,
    /document\.queryCommandValue/gi,
  ];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate todo input data
   */
  public validateTodoInput(input: EntryFormData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate title
    if (!input.title) {
      errors.push('Title is required');
    } else if (input.title.length > 100) {
      errors.push('Title must be 100 characters or less');
    }

    // Validate description
    if (input.description && input.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    // Validate point value
    const pointValue = parseInt(input.pointValue, 10);
    if (isNaN(pointValue)) {
      errors.push('Point value must be a number');
    } else if (pointValue < 1 || pointValue > 100) {
      errors.push('Point value must be between 1 and 100');
    }

    // Check for XSS in title and description
    if (this.containsXSS(input.title)) {
      errors.push('Title contains potentially harmful content');
    }
    if (input.description && this.containsXSS(input.description)) {
      errors.push('Description contains potentially harmful content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a todo item
   */
  public validateTodoItem(todo: TodoItem): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!todo.id) {
      errors.push('Todo ID is required');
    }
    if (!todo.title) {
      errors.push('Title is required');
    } else if (todo.title.length > 100) {
      errors.push('Title must be 100 characters or less');
    }

    // Validate description
    if (todo.description && todo.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    // Validate point value
    if (todo.pointValue < 1 || todo.pointValue > 100) {
      errors.push('Point value must be between 1 and 100');
    }

    // Validate dates
    if (!todo.createdAt) {
      errors.push('Creation date is required');
    }
    if (todo.isCompleted && !todo.completedAt) {
      errors.push('Completion date is required for completed todos');
    }

    // Check for XSS
    if (this.containsXSS(todo.title)) {
      errors.push('Title contains potentially harmful content');
    }
    if (todo.description && this.containsXSS(todo.description)) {
      errors.push('Description contains potentially harmful content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize todo input data
   */
  public sanitizeTodoInput(input: EntryFormData): EntryFormData {
    return {
      title: this.sanitizeString(input.title),
      description: this.sanitizeString(input.description),
      pointValue: input.pointValue
    };
  }

  /**
   * Validate a day schedule
   */
  public validateDaySchedule(schedule: DaySchedule): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate date format
    if (!this.isValidISODate(schedule.date)) {
      errors.push('Invalid date format');
    }

    // Validate point values
    if (schedule.totalPointValue < 0) {
      errors.push('Total point value cannot be negative');
    }
    if (schedule.totalCompletedPointValue < 0) {
      errors.push('Total completed point value cannot be negative');
    }
    if (schedule.totalCompletedPointValue > schedule.totalPointValue) {
      errors.push('Completed points cannot exceed total points');
    }

    // Validate todo items
    if (!Array.isArray(schedule.todoItems)) {
      errors.push('Todo items must be an array');
    } else {
      schedule.todoItems.forEach((todo, index) => {
        const todoValidation = this.validateTodoItem(todo);
        if (!todoValidation.isValid) {
          errors.push(`Todo item ${index + 1}: ${todoValidation.errors.join(', ')}`);
        }
      });
    }

    // Validate computed arrays
    if (!Array.isArray(schedule.completedTodoItems) || !Array.isArray(schedule.incompleteTodoItems)) {
      errors.push('Completed and incomplete todo items must be arrays');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a year schedule
   */
  public validateYearSchedule(schedule: YearSchedule): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate year
    if (!Number.isInteger(schedule.year) || schedule.year < 1900 || schedule.year > 2100) {
      errors.push('Invalid year');
    }

    // Validate month schedules
    if (!(schedule.monthSchedules instanceof Map)) {
      errors.push('Month schedules must be a Map');
    } else {
      for (const [month, monthSchedule] of schedule.monthSchedules) {
        if (!this.isValidMonthString(month)) {
          errors.push(`Invalid month format: ${month}`);
        }
        if (!monthSchedule) {
          errors.push(`Missing schedule for month: ${month}`);
        } else {
          const monthValidation = this.validateMonthSchedule(monthSchedule);
          if (!monthValidation.isValid) {
            errors.push(`Month ${month}: ${monthValidation.errors.join(', ')}`);
          }
        }
      }
    }

    // Validate point totals
    if (schedule.totalYearPoints < 0) {
      errors.push('Total year points cannot be negative');
    }
    if (schedule.totalCompletedYearPoints < 0) {
      errors.push('Total completed year points cannot be negative');
    }
    if (schedule.totalCompletedYearPoints > schedule.totalYearPoints) {
      errors.push('Completed points cannot exceed total points');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if a string contains XSS patterns
   */
  private containsXSS(str: string): boolean {
    return this.XSS_PATTERNS.some(pattern => pattern.test(str));
  }

  /**
   * Sanitize a string to prevent XSS
   */
  private sanitizeString(str: string): string {
    if (!str) return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Check if a string is a valid ISO date
   */
  private isValidISODate(str: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(str)) return false;
    const date = new Date(str);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Check if a string is a valid month format (YYYY-MM)
   */
  private isValidMonthString(str: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(str)) return false;
    const [year, month] = str.split('-').map(Number);
    return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
  }

  /**
   * Validate a month schedule
   */
  private validateMonthSchedule(schedule: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate date format
    if (!this.isValidMonthString(schedule.date)) {
      errors.push('Invalid month format');
    }

    // Validate day schedules
    if (!(schedule.daySchedules instanceof Map)) {
      errors.push('Day schedules must be a Map');
    } else {
      for (const [date, daySchedule] of schedule.daySchedules) {
        if (!this.isValidISODate(date)) {
          errors.push(`Invalid date format: ${date}`);
        }
        if (!daySchedule) {
          errors.push(`Missing schedule for date: ${date}`);
        } else {
          const dayValidation = this.validateDaySchedule(daySchedule);
          if (!dayValidation.isValid) {
            errors.push(`Date ${date}: ${dayValidation.errors.join(', ')}`);
          }
        }
      }
    }

    // Validate point totals
    if (schedule.totalMonthPoints < 0) {
      errors.push('Total month points cannot be negative');
    }
    if (schedule.totalCompletedMonthPoints < 0) {
      errors.push('Total completed month points cannot be negative');
    }
    if (schedule.totalCompletedMonthPoints > schedule.totalMonthPoints) {
      errors.push('Completed points cannot exceed total points');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
} 