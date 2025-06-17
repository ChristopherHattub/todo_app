import { v4 as uuidv4 } from 'uuid';
import { 
  TodoItem, 
  DaySchedule, 
  MonthSchedule, 
  YearSchedule,
  TodoServiceResponse
} from '../types';
import { ValidationResult, ServiceError, ServiceErrorType } from '../types/services';
import { ITodoService } from './interfaces/ITodoService';
import { IStorageService } from './interfaces/IStorageService';
import { IValidationService } from './interfaces/IValidationService';
import { LocalStorageService } from './LocalStorageService';
import { ValidationService } from './ValidationService';

/**
 * Enhanced error class for TodoService
 */
class TodoServiceError extends Error {
  constructor(
    message: string,
    public readonly type: ServiceErrorType,
    public readonly context?: any,
    public readonly recoverable: boolean = true,
    public readonly validationResult?: ValidationResult
  ) {
    super(message);
    this.name = 'TodoServiceError';
  }

  toServiceError(): ServiceError {
    return {
      type: this.type,
      message: this.message,
      context: this.context,
      timestamp: new Date(),
      recoverable: this.recoverable
    };
  }
}

/**
 * Service for managing todo items and schedules
 */
export class TodoService implements ITodoService {
  private static instance: TodoService;

  constructor(
    private storageService: IStorageService,
    private validationService: IValidationService
  ) {}

  /**
   * Get singleton instance of TodoService with default dependencies
   */
  public static getInstance(): TodoService {
    if (!TodoService.instance) {
      TodoService.instance = new TodoService(
        new LocalStorageService(),
        new ValidationService()
      );
    }
    return TodoService.instance;
  }

  /**
   * Create a new todo item with enhanced validation and error handling
   */
  public async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>, forDate?: Date): Promise<TodoServiceResponse> {
    try {
      // Step 1: Validate and sanitize input
      const validationResult = await this.validateAndSanitizeInput({
        title: todo.title,
        description: todo.description || '',
        pointValue: todo.pointValue.toString()
      });

      if (!validationResult.isValid) {
        throw new TodoServiceError(
          `Input validation failed: ${validationResult.errors.join(', ')}`,
          'VALIDATION',
          { originalInput: todo, validationErrors: validationResult.errors },
          true,
          validationResult
        );
      }

      // Step 2: Create todo with validated data
      const targetDate = forDate || new Date();
      const sanitizedInput = this.validationService.sanitizeTodoInput({
        title: todo.title,
        description: todo.description || '',
        pointValue: todo.pointValue.toString()
      });

      const newTodo: TodoItem = {
        id: uuidv4(),
        title: sanitizedInput.title,
        description: sanitizedInput.description,
        pointValue: parseInt(sanitizedInput.pointValue, 10),
        isCompleted: false,
        createdAt: new Date()
      };

      // Step 3: Validate the created todo item
      const todoValidation = this.validationService.validateTodoItem(newTodo);
      if (!todoValidation.isValid) {
        throw new TodoServiceError(
          `Created todo validation failed: ${todoValidation.errors.join(', ')}`,
          'VALIDATION',
          { todo: newTodo, validationErrors: todoValidation.errors },
          false,
          todoValidation
        );
      }

      // Step 4: Get and validate day schedule
      const daySchedule = await this.getDayScheduleWithValidation(targetDate);

      // Step 5: Update schedule with new todo
      daySchedule.todoItems.push(newTodo);
      daySchedule.totalPointValue += newTodo.pointValue;
      daySchedule.incompleteTodoItems.push(newTodo);

      // Step 6: Validate updated schedule before saving
      await this.validateAndSaveSchedule(daySchedule);

      // Step 7: Build complete response
      const response = await this.buildServiceResponse(newTodo, targetDate);
      
      // Step 8: Log warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('Todo creation completed with warnings:', validationResult.warnings);
      }

      return response;
    } catch (error) {
      throw this.enhancedErrorHandler(error, 'Failed to create todo', { input: todo, forDate });
    }
  }

  /**
   * Update an existing todo item with comprehensive validation
   */
  public async updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<TodoServiceResponse> {
    try {
      // Step 1: Validate todoId
      if (!todoId || typeof todoId !== 'string') {
        throw new TodoServiceError(
          'Invalid todo ID provided',
          'VALIDATION',
          { todoId, updates },
          true
        );
      }

      // Step 2: Validate updates if they contain user input fields
      if (updates.title !== undefined || updates.description !== undefined || updates.pointValue !== undefined) {
        const inputForValidation = {
          title: updates.title || '',
          description: updates.description || '',
          pointValue: updates.pointValue?.toString() || '1'
        };

        const validationResult = this.validationService.validateTodoInput(inputForValidation);
        if (!validationResult.isValid) {
          throw new TodoServiceError(
            `Update validation failed: ${validationResult.errors.join(', ')}`,
            'VALIDATION',
            { todoId, updates, validationErrors: validationResult.errors },
            true,
            validationResult
          );
        }

        // Sanitize updates
        if (updates.title !== undefined) {
          updates.title = this.validationService.sanitizeString(updates.title);
        }
        if (updates.description !== undefined) {
          updates.description = this.validationService.sanitizeString(updates.description);
        }
      }

      // Step 3: Find and update todo
      const date = new Date();
      const daySchedule = await this.getDayScheduleWithValidation(date);
      
      const todoIndex = daySchedule.todoItems.findIndex(t => t.id === todoId);
      if (todoIndex === -1) {
        throw new TodoServiceError(
          `Todo with id ${todoId} not found`,
          'VALIDATION',
          { todoId, availableIds: daySchedule.todoItems.map(t => t.id) },
          true
        );
      }

      const oldTodo = daySchedule.todoItems[todoIndex];
      const updatedTodo = { ...oldTodo, ...updates };

      // Step 4: Validate the updated todo
      const todoValidation = this.validationService.validateTodoItem(updatedTodo);
      if (!todoValidation.isValid) {
        throw new TodoServiceError(
          `Updated todo validation failed: ${todoValidation.errors.join(', ')}`,
          'VALIDATION',
          { originalTodo: oldTodo, updates, validationErrors: todoValidation.errors },
          true,
          todoValidation
        );
      }

      // Step 5: Update schedule calculations
      this.updateScheduleForTodoChange(daySchedule, oldTodo, updatedTodo, todoIndex);

      // Step 6: Validate and save updated schedule
      await this.validateAndSaveSchedule(daySchedule);

      return await this.buildServiceResponse(updatedTodo, date);
    } catch (error) {
      throw this.enhancedErrorHandler(error, 'Failed to update todo', { todoId, updates });
    }
  }

  /**
   * Delete a todo item with validation
   */
  public async deleteTodo(todoId: string): Promise<TodoServiceResponse> {
    try {
      // Step 1: Validate todoId
      if (!todoId || typeof todoId !== 'string') {
        throw new TodoServiceError(
          'Invalid todo ID provided for deletion',
          'VALIDATION',
          { todoId },
          true
        );
      }

      // Step 2: Find and remove todo
      const date = new Date();
      const daySchedule = await this.getDayScheduleWithValidation(date);
      
      const todoIndex = daySchedule.todoItems.findIndex(t => t.id === todoId);
      if (todoIndex === -1) {
        throw new TodoServiceError(
          `Todo with id ${todoId} not found for deletion`,
          'VALIDATION',
          { todoId, availableIds: daySchedule.todoItems.map(t => t.id) },
          true
        );
      }

      const deletedTodo = daySchedule.todoItems[todoIndex];
      
      // Step 3: Update schedule calculations
      daySchedule.totalPointValue -= deletedTodo.pointValue;
      if (deletedTodo.isCompleted) {
        daySchedule.totalCompletedPointValue -= deletedTodo.pointValue;
      }

      // Step 4: Remove from all arrays
      daySchedule.todoItems = daySchedule.todoItems.filter(t => t.id !== todoId);
      daySchedule.completedTodoItems = daySchedule.completedTodoItems.filter(t => t.id !== todoId);
      daySchedule.incompleteTodoItems = daySchedule.incompleteTodoItems.filter(t => t.id !== todoId);

      // Step 5: Validate and save updated schedule
      await this.validateAndSaveSchedule(daySchedule);

      return await this.buildServiceResponse(deletedTodo, date);
    } catch (error) {
      throw this.enhancedErrorHandler(error, 'Failed to delete todo', { todoId });
    }
  }

  /**
   * Mark a todo item as completed
   */
  public async completeTodo(todoId: string): Promise<TodoServiceResponse> {
    return this.updateTodo(todoId, { 
      isCompleted: true,
      completedAt: new Date()
    });
  }

  /**
   * Get all todos for a specific date with validation
   */
  public async getTodosForDate(date: Date): Promise<TodoItem[]> {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        throw new TodoServiceError(
          'Invalid date provided',
          'VALIDATION',
          { date },
          true
        );
      }

      const daySchedule = await this.getDayScheduleWithValidation(date);
      return daySchedule.todoItems;
    } catch (error) {
      throw this.enhancedErrorHandler(error, 'Failed to get todos for date', { date });
    }
  }

  /**
   * Get the schedule for a specific day with validation
   */
  public async getDaySchedule(date: Date): Promise<DaySchedule> {
    return this.getDayScheduleWithValidation(date);
  }

  /**
   * Get the schedule for a specific month
   */
  public async getMonthSchedule(year: number, month: number): Promise<MonthSchedule> {
    try {
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        throw new TodoServiceError(
          'Invalid year provided',
          'VALIDATION',
          { year },
          true
        );
      }

      if (!Number.isInteger(month) || month < 0 || month > 11) {
        throw new TodoServiceError(
          'Invalid month provided (should be 0-11)',
          'VALIDATION',
          { month },
          true
        );
      }

      const yearSchedule = await this.getYearSchedule(year);
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!yearSchedule.monthSchedules.has(monthKey)) {
        return {
          date: monthKey,
          daySchedules: new Map(),
          totalMonthPoints: 0,
          totalCompletedMonthPoints: 0
        };
      }

      return yearSchedule.monthSchedules.get(monthKey)!;
    } catch (error) {
      throw this.enhancedErrorHandler(error, 'Failed to get month schedule', { year, month });
    }
  }

  /**
   * Get the schedule for a specific year
   */
  public async getYearSchedule(year: number): Promise<YearSchedule> {
    try {
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        throw new TodoServiceError(
          'Invalid year provided',
          'VALIDATION',
          { year },
          true
        );
      }

      const response = await this.storageService.loadYearSchedule(year);
      if (!response.success || !response.data) {
        return {
          year,
          monthSchedules: new Map(),
          totalYearPoints: 0,
          totalCompletedYearPoints: 0
        };
      }
      return response.data;
    } catch (error) {
      throw this.enhancedErrorHandler(error, 'Failed to get year schedule', { year });
    }
  }

  /**
   * Calculate totals for a day's todos
   */
  public calculateDayTotals(todos: TodoItem[]): { total: number; completed: number } {
    return todos.reduce((acc, todo) => {
      acc.total += todo.pointValue;
      if (todo.isCompleted) {
        acc.completed += todo.pointValue;
      }
      return acc;
    }, { total: 0, completed: 0 });
  }

  /**
   * Calculate totals for a month's schedule
   */
  public calculateMonthTotals(monthSchedule: MonthSchedule): { total: number; completed: number } {
    let total = 0;
    let completed = 0;

    for (const daySchedule of monthSchedule.daySchedules.values()) {
      total += daySchedule.totalPointValue;
      completed += daySchedule.totalCompletedPointValue;
    }

    return { total, completed };
  }

  /**
   * Enhanced error handling with structured error information
   */
  private enhancedErrorHandler(error: unknown, message: string, context?: any): Error {
    if (error instanceof TodoServiceError) {
      // Re-throw TodoServiceError as-is
      return error;
    }

    if (error instanceof Error) {
      // Wrap other errors with context
      return new TodoServiceError(
        `${message}: ${error.message}`,
        'STORAGE', // Default to storage error for unknown errors
        { originalError: error.message, context },
        true
      );
    }

    // Handle unknown error types
    return new TodoServiceError(
      message,
      'STORAGE',
      { unknownError: error, context },
      false
    );
  }

  /**
   * Validate and sanitize input data
   */
  private async validateAndSanitizeInput(input: { title: string; description: string; pointValue: string }): Promise<ValidationResult> {
    return this.validationService.validateTodoInput(input);
  }

  /**
   * Get day schedule with comprehensive validation
   */
  private async getDayScheduleWithValidation(date: Date): Promise<DaySchedule> {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        throw new TodoServiceError(
          'Invalid date provided for day schedule',
          'VALIDATION',
          { date },
          true
        );
      }

      const response = await this.storageService.loadDaySchedule(date);
      let daySchedule: DaySchedule;

      if (!response.success || !response.data) {
        // Create new day schedule if none exists
        daySchedule = {
          date: date.toISOString().split('T')[0],
          totalPointValue: 0,
          totalCompletedPointValue: 0,
          todoItems: [],
          completedTodoItems: [],
          incompleteTodoItems: []
        };
      } else {
        daySchedule = response.data;
      }

      // Validate the day schedule
      const validation = this.validationService.validateDaySchedule(daySchedule);
      if (!validation.isValid) {
        throw new TodoServiceError(
          `Day schedule validation failed: ${validation.errors.join(', ')}`,
          'VALIDATION',
          { daySchedule, validationErrors: validation.errors },
          false,
          validation
        );
      }

      return daySchedule;
    } catch (error) {
      if (error instanceof TodoServiceError) {
        throw error;
      }
      throw new TodoServiceError(
        'Failed to load day schedule',
        'STORAGE',
        { date, originalError: error },
        true
      );
    }
  }

  /**
   * Validate and save day schedule
   */
  private async validateAndSaveSchedule(daySchedule: DaySchedule): Promise<void> {
    try {
      // Validate the schedule before saving
      const validation = this.validationService.validateDaySchedule(daySchedule);
      if (!validation.isValid) {
        throw new TodoServiceError(
          `Schedule validation failed before save: ${validation.errors.join(', ')}`,
          'VALIDATION',
          { daySchedule, validationErrors: validation.errors },
          false,
          validation
        );
      }

      // Attempt to save
      const response = await this.storageService.saveDaySchedule(daySchedule);
      if (!response.success) {
        throw new TodoServiceError(
          'Failed to save day schedule',
          'STORAGE',
          { daySchedule, storageError: response.error },
          true
        );
      }

      // Log warnings if any exist
      if (validation.warnings.length > 0) {
        console.warn('Schedule saved with warnings:', validation.warnings);
      }
    } catch (error) {
      if (error instanceof TodoServiceError) {
        throw error;
      }
      throw new TodoServiceError(
        'Failed to validate and save schedule',
        'STORAGE',
        { daySchedule, originalError: error },
        true
      );
    }
  }

  /**
   * Build complete service response with all schedules
   */
  private async buildServiceResponse(todo: TodoItem, date: Date): Promise<TodoServiceResponse> {
    try {
      const [daySchedule, monthSchedule, yearSchedule] = await Promise.all([
        this.getDayScheduleWithValidation(date),
        this.getMonthSchedule(date.getFullYear(), date.getMonth()),
        this.getYearSchedule(date.getFullYear())
      ]);

      return {
        todo,
        daySchedule,
        monthSchedule,
        yearSchedule
      };
    } catch (error) {
      throw new TodoServiceError(
        'Failed to build service response',
        'STORAGE',
        { todo, date, originalError: error },
        true
      );
    }
  }

  /**
   * Update schedule calculations when a todo changes
   */
  private updateScheduleForTodoChange(
    daySchedule: DaySchedule, 
    oldTodo: TodoItem, 
    updatedTodo: TodoItem, 
    todoIndex: number
  ): void {
    // Update point values
    daySchedule.totalPointValue = daySchedule.totalPointValue - oldTodo.pointValue + updatedTodo.pointValue;
    
    // Handle completion status changes
    if (oldTodo.isCompleted !== updatedTodo.isCompleted) {
      if (updatedTodo.isCompleted) {
        // Todo was completed
        daySchedule.completedTodoItems.push(updatedTodo);
        daySchedule.incompleteTodoItems = daySchedule.incompleteTodoItems.filter(t => t.id !== updatedTodo.id);
        daySchedule.totalCompletedPointValue += updatedTodo.pointValue;
        updatedTodo.completedAt = new Date();
      } else {
        // Todo was uncompleted
        daySchedule.incompleteTodoItems.push(updatedTodo);
        daySchedule.completedTodoItems = daySchedule.completedTodoItems.filter(t => t.id !== updatedTodo.id);
        daySchedule.totalCompletedPointValue -= updatedTodo.pointValue;
        updatedTodo.completedAt = undefined;
      }
    } else if (oldTodo.isCompleted && updatedTodo.isCompleted) {
      // Update completed point total if point value changed
      daySchedule.totalCompletedPointValue = daySchedule.totalCompletedPointValue - oldTodo.pointValue + updatedTodo.pointValue;
      
      // Update the todo in completed array
      const completedIndex = daySchedule.completedTodoItems.findIndex(t => t.id === updatedTodo.id);
      if (completedIndex !== -1) {
        daySchedule.completedTodoItems[completedIndex] = updatedTodo;
      }
    } else if (!oldTodo.isCompleted && !updatedTodo.isCompleted) {
      // Update the todo in incomplete array
      const incompleteIndex = daySchedule.incompleteTodoItems.findIndex(t => t.id === updatedTodo.id);
      if (incompleteIndex !== -1) {
        daySchedule.incompleteTodoItems[incompleteIndex] = updatedTodo;
      }
    }

    // Update the main todo in the todoItems array
    daySchedule.todoItems[todoIndex] = updatedTodo;
  }

  /**
   * Handle service errors (legacy method for backwards compatibility)
   */
  private handleError(error: unknown, message: string): Error {
    return this.enhancedErrorHandler(error, message);
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    // Cleanup if needed - for now nothing specific to clean up
  }
} 