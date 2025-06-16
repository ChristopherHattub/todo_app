import { ValidationResult } from '../types/services';
import { TodoItem, DaySchedule, YearSchedule, EntryFormData } from '../types';
import { IValidationService } from './interfaces/IValidationService';

/**
 * Service for handling input validation and data integrity checks
 */
export class ValidationService implements IValidationService {
  private readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
    /onerror\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /onchange\s*=/gi,
    /onsubmit\s*=/gi,
    /onkeydown\s*=/gi,
    /onkeyup\s*=/gi,
    /onkeypress\s*=/gi,
    /document\.cookie/gi,
    /window\.location/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /Function\s*\(/gi,
    /XMLHttpRequest/gi,
    /fetch\s*\(/gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi,
    /document\.write/gi,
    /document\.writeln/gi,
    /document\.createElement/gi,
    /document\.getElementById/gi,
    /document\.getElementsByTagName/gi,
    /document\.getElementsByClassName/gi,
    /document\.querySelector/gi,
    /document\.querySelectorAll/gi,
    /document\.execCommand/gi,
    /document\.queryCommandEnabled/gi,
    /document\.queryCommandIndeterm/gi,
    /document\.queryCommandState/gi,
    /document\.queryCommandSupported/gi,
    /document\.queryCommandValue/gi,
  ];

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
  public containsXSS(str: string): boolean {
    return this.XSS_PATTERNS.some(pattern => pattern.test(str));
  }

  /**
   * Sanitize a string to prevent XSS
   */
  public sanitizeString(str: string): string {
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
  public isValidDate(str: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(str)) return false;
    const date = new Date(str);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Check if a string is a valid month format (YYYY-MM)
   */
  public isValidMonth(str: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(str)) return false;
    const [year, month] = str.split('-').map(Number);
    return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
  }

  /**
   * Check if a string is a valid ISO date (private method for internal use)
   */
  private isValidISODate(str: string): boolean {
    return this.isValidDate(str);
  }

  /**
   * Check if a string is a valid month format (private method for internal use)
   */
  private isValidMonthString(str: string): boolean {
    return this.isValidMonth(str);
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