import { TodoItem, DaySchedule, MonthSchedule, YearSchedule, EntryFormData } from './index';

/**
 * Service layer type definitions for the ToDo List Tracker application
 */

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Array of error messages */
  errors: string[];
  /** Array of warning messages */
  warnings: string[];
}

/**
 * Service error types
 */
export type ServiceErrorType = 
  | 'VALIDATION'
  | 'STORAGE'
  | 'NETWORK'
  | 'ANIMATION'
  | 'MIGRATION';

/**
 * Service error structure
 */
export interface ServiceError {
  /** Type of error */
  type: ServiceErrorType;
  /** Error message */
  message: string;
  /** Additional context data */
  context?: any;
  /** When the error occurred */
  timestamp: Date;
  /** Whether the error is recoverable */
  recoverable: boolean;
}

/**
 * Storage service response types
 */
export interface StorageResponse<T> {
  /** The stored/retrieved data */
  data: T;
  /** Whether the operation was successful */
  success: boolean;
  /** Any error that occurred */
  error?: ServiceError;
}

/**
 * Todo service response types
 */
export interface TodoServiceResponse {
  /** The affected todo item */
  todo: TodoItem;
  /** The updated day schedule */
  daySchedule: DaySchedule;
  /** The updated month schedule */
  monthSchedule: MonthSchedule;
  /** The updated year schedule */
  yearSchedule: YearSchedule;
}

/**
 * Validation service methods
 */
export interface ValidationService {
  /** Validate todo input data */
  validateTodoInput(input: EntryFormData): ValidationResult;
  /** Validate a todo item */
  validateTodoItem(todo: TodoItem): ValidationResult;
  /** Sanitize todo input data */
  sanitizeTodoInput(input: EntryFormData): EntryFormData;
  /** Validate a day schedule */
  validateDaySchedule(schedule: DaySchedule): ValidationResult;
  /** Validate a year schedule */
  validateYearSchedule(schedule: YearSchedule): ValidationResult;
}

/**
 * Storage service methods
 */
export interface StorageService {
  /** Save a year schedule */
  saveYearSchedule(schedule: YearSchedule): Promise<StorageResponse<YearSchedule>>;
  /** Load a year schedule */
  loadYearSchedule(year: number): Promise<StorageResponse<YearSchedule | null>>;
  /** Save a day schedule */
  saveDaySchedule(schedule: DaySchedule): Promise<StorageResponse<DaySchedule>>;
  /** Load a day schedule */
  loadDaySchedule(date: Date): Promise<StorageResponse<DaySchedule | null>>;
  /** Export all data */
  exportData(): Promise<StorageResponse<string>>;
  /** Import data */
  importData(data: string): Promise<StorageResponse<void>>;
  /** Clear all data */
  clearAllData(): Promise<StorageResponse<void>>;
}

/**
 * Todo service methods
 */
export interface TodoService {
  /** Create a new todo */
  createTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>): Promise<TodoServiceResponse>;
  /** Update a todo */
  updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<TodoServiceResponse>;
  /** Delete a todo */
  deleteTodo(todoId: string): Promise<TodoServiceResponse>;
  /** Complete a todo */
  completeTodo(todoId: string): Promise<TodoServiceResponse>;
  /** Get todos for a date */
  getTodosForDate(date: Date): Promise<TodoItem[]>;
  /** Get day schedule */
  getDaySchedule(date: Date): Promise<DaySchedule>;
  /** Get month schedule */
  getMonthSchedule(year: number, month: number): Promise<MonthSchedule>;
  /** Get year schedule */
  getYearSchedule(year: number): Promise<YearSchedule>;
} 