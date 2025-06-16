import { TodoItem, DaySchedule, MonthSchedule, YearSchedule } from '../../types';

export interface TodoServiceResponse {
  todo: TodoItem;
  daySchedule: DaySchedule;
  monthSchedule: MonthSchedule;
  yearSchedule: YearSchedule;
}

export interface ITodoService {
  // CRUD Operations
  createTodo(todo: Omit<TodoItem, 'id' | 'createdAt'>, forDate?: Date): Promise<TodoServiceResponse>;
  updateTodo(todoId: string, updates: Partial<TodoItem>): Promise<TodoServiceResponse>;
  deleteTodo(todoId: string): Promise<TodoServiceResponse>;
  completeTodo(todoId: string): Promise<TodoServiceResponse>;

  // Query Operations
  getTodosForDate(date: Date): Promise<TodoItem[]>;
  getDaySchedule(date: Date): Promise<DaySchedule>;
  getMonthSchedule(year: number, month: number): Promise<MonthSchedule>;
  getYearSchedule(year: number): Promise<YearSchedule>;

  // Calculation Operations
  calculateDayTotals(todos: TodoItem[]): { total: number; completed: number };
  calculateMonthTotals(monthSchedule: MonthSchedule): { total: number; completed: number };

  // Lifecycle
  dispose?(): Promise<void>;
} 