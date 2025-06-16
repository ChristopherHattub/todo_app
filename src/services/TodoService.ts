import { v4 as uuidv4 } from 'uuid';
import { 
  TodoItem, 
  DaySchedule, 
  MonthSchedule, 
  YearSchedule,
  TodoServiceResponse
} from '../types';
import { ITodoService } from './interfaces/ITodoService';
import { IStorageService } from './interfaces/IStorageService';
import { IValidationService } from './interfaces/IValidationService';
import { LocalStorageService } from './LocalStorageService';
import { ValidationService } from './ValidationService';

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
   * Create a new todo item
   */
  public async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>, forDate?: Date): Promise<TodoServiceResponse> {
    try {
      // Validate input
      const validation = this.validationService.validateTodoInput({
        title: todo.title,
        description: todo.description,
        pointValue: todo.pointValue.toString()
      });

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const targetDate = forDate || new Date();
      const newTodo: TodoItem = {
        ...todo,
        id: uuidv4(),
        createdAt: new Date(),
        isCompleted: false
      };

      const daySchedule = await this.getDaySchedule(targetDate);
      
      daySchedule.todoItems.push(newTodo);
      daySchedule.totalPointValue += newTodo.pointValue;
      
      if (newTodo.isCompleted) {
        daySchedule.completedTodoItems.push(newTodo);
        daySchedule.totalCompletedPointValue += newTodo.pointValue;
      } else {
        daySchedule.incompleteTodoItems.push(newTodo);
      }

      await this.storageService.saveDaySchedule(daySchedule);

      return {
        todo: newTodo,
        daySchedule,
        monthSchedule: await this.getMonthSchedule(targetDate.getFullYear(), targetDate.getMonth()),
        yearSchedule: await this.getYearSchedule(targetDate.getFullYear())
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to create todo');
    }
  }

  /**
   * Update an existing todo item
   */
  public async updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<TodoServiceResponse> {
    try {
      const date = new Date();
      const daySchedule = await this.getDaySchedule(date);
      
      const todoIndex = daySchedule.todoItems.findIndex(t => t.id === todoId);
      if (todoIndex === -1) {
        throw new Error(`Todo with id ${todoId} not found`);
      }

      const oldTodo = daySchedule.todoItems[todoIndex];
      const updatedTodo = { ...oldTodo, ...updates };

      // Update point values
      daySchedule.totalPointValue = daySchedule.totalPointValue - oldTodo.pointValue + updatedTodo.pointValue;
      
      if (oldTodo.isCompleted !== updatedTodo.isCompleted) {
        if (updatedTodo.isCompleted) {
          daySchedule.completedTodoItems.push(updatedTodo);
          daySchedule.incompleteTodoItems = daySchedule.incompleteTodoItems.filter(t => t.id !== todoId);
          daySchedule.totalCompletedPointValue += updatedTodo.pointValue;
          updatedTodo.completedAt = new Date();
        } else {
          daySchedule.incompleteTodoItems.push(updatedTodo);
          daySchedule.completedTodoItems = daySchedule.completedTodoItems.filter(t => t.id !== todoId);
          daySchedule.totalCompletedPointValue -= updatedTodo.pointValue;
          updatedTodo.completedAt = undefined;
        }
      }

      daySchedule.todoItems[todoIndex] = updatedTodo;
      await this.storageService.saveDaySchedule(daySchedule);

      return {
        todo: updatedTodo,
        daySchedule,
        monthSchedule: await this.getMonthSchedule(date.getFullYear(), date.getMonth()),
        yearSchedule: await this.getYearSchedule(date.getFullYear())
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to update todo');
    }
  }

  /**
   * Delete a todo item
   */
  public async deleteTodo(todoId: string): Promise<TodoServiceResponse> {
    try {
      const date = new Date();
      const daySchedule = await this.getDaySchedule(date);
      
      const todoIndex = daySchedule.todoItems.findIndex(t => t.id === todoId);
      if (todoIndex === -1) {
        throw new Error(`Todo with id ${todoId} not found`);
      }

      const deletedTodo = daySchedule.todoItems[todoIndex];
      
      // Update point values
      daySchedule.totalPointValue -= deletedTodo.pointValue;
      if (deletedTodo.isCompleted) {
        daySchedule.totalCompletedPointValue -= deletedTodo.pointValue;
      }

      // Remove from all arrays
      daySchedule.todoItems = daySchedule.todoItems.filter(t => t.id !== todoId);
      daySchedule.completedTodoItems = daySchedule.completedTodoItems.filter(t => t.id !== todoId);
      daySchedule.incompleteTodoItems = daySchedule.incompleteTodoItems.filter(t => t.id !== todoId);

      await this.storageService.saveDaySchedule(daySchedule);

      return {
        todo: deletedTodo,
        daySchedule,
        monthSchedule: await this.getMonthSchedule(date.getFullYear(), date.getMonth()),
        yearSchedule: await this.getYearSchedule(date.getFullYear())
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to delete todo');
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
   * Get all todos for a specific date
   */
  public async getTodosForDate(date: Date): Promise<TodoItem[]> {
    try {
      const daySchedule = await this.getDaySchedule(date);
      return daySchedule.todoItems;
    } catch (error) {
      throw this.handleError(error, 'Failed to get todos for date');
    }
  }

  /**
   * Get the schedule for a specific day
   */
  public async getDaySchedule(date: Date): Promise<DaySchedule> {
    try {
      const response = await this.storageService.loadDaySchedule(date);
      if (!response.success || !response.data) {
        // Create new day schedule if none exists
        return {
          date: date.toISOString().split('T')[0],
          totalPointValue: 0,
          totalCompletedPointValue: 0,
          todoItems: [],
          completedTodoItems: [],
          incompleteTodoItems: []
        };
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get day schedule');
    }
  }

  /**
   * Get the schedule for a specific month
   */
  public async getMonthSchedule(year: number, month: number): Promise<MonthSchedule> {
    try {
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
      throw this.handleError(error, 'Failed to get month schedule');
    }
  }

  /**
   * Get the schedule for a specific year
   */
  public async getYearSchedule(year: number): Promise<YearSchedule> {
    try {
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
      throw this.handleError(error, 'Failed to get year schedule');
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
   * Handle service errors
   */
  private handleError(error: unknown, message: string): Error {
    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`);
    }
    return new Error(message);
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    // Cleanup if needed - for now nothing specific to clean up
  }
} 