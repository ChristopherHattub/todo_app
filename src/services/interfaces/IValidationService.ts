import { ValidationResult } from '../../types/services';
import { TodoItem, EntryFormData, DaySchedule, YearSchedule } from '../../types';

export interface IValidationService {
  // Input Validation
  validateTodoInput(input: EntryFormData): ValidationResult;
  validateTodoItem(todo: TodoItem): ValidationResult;
  sanitizeTodoInput(input: EntryFormData): EntryFormData;

  // Data Structure Validation
  validateDaySchedule(schedule: DaySchedule): ValidationResult;
  validateYearSchedule(schedule: YearSchedule): ValidationResult;

  // Utility
  isValidDate(date: string): boolean;
  isValidMonth(month: string): boolean;
  containsXSS(input: string): boolean;
  sanitizeString(input: string): string;
} 