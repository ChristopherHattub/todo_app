/**
 * Core data structures for the ToDo List Tracker application
 */

/**
 * Represents a single todo item in the application
 */
export interface TodoItem {
  /** Unique identifier for the todo item */
  id: string;
  /** Title of the todo item (required) */
  title: string;
  /** Optional description of the todo item */
  description: string;
  /** Point value representing importance/difficulty (1-100) */
  pointValue: number;
  /** Whether the todo item has been completed */
  isCompleted: boolean;
  /** When the todo item was created */
  createdAt: Date;
  /** When the todo item was completed (if completed) */
  completedAt?: Date;
}

/**
 * Represents the schedule for a single day
 */
export interface DaySchedule {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Total points for all tasks in the day */
  totalPointValue: number;
  /** Total points for completed tasks in the day */
  totalCompletedPointValue: number;
  /** All tasks for this day */
  todoItems: TodoItem[];
  /** Computed: completed tasks for this day */
  completedTodoItems: TodoItem[];
  /** Computed: incomplete tasks for this day */
  incompleteTodoItems: TodoItem[];
}

/**
 * Represents the schedule for a single month
 */
export interface MonthSchedule {
  /** ISO month string (YYYY-MM) */
  date: string;
  /** Map of day schedules, keyed by date string */
  daySchedules: Map<string, DaySchedule>;
  /** Computed: sum of all day points */
  totalMonthPoints: number;
  /** Computed: sum of completed points */
  totalCompletedMonthPoints: number;
}

/**
 * Represents the schedule for a single year
 */
export interface YearSchedule {
  /** Year number (e.g., 2024) */
  year: number;
  /** Map of month schedules, keyed by month string */
  monthSchedules: Map<string, MonthSchedule>;
  /** Computed: sum of all month points */
  totalYearPoints: number;
  /** Computed: sum of completed points */
  totalCompletedYearPoints: number;
}

/**
 * Data structure for the todo entry form
 */
export interface EntryFormData {
  /** Title of the todo item */
  title: string;
  /** Description of the todo item */
  description: string;
  /** Point value as string for input validation */
  pointValue: string;
}

/**
 * Global application state
 */
export interface AppState {
  /** Currently selected date */
  selectedDate: Date;
  /** Current year being viewed */
  currentYear: number;
  /** Complete year data */
  yearSchedule: YearSchedule;
  /** Whether the date selector modal is open */
  isDateSelectorOpen: boolean;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

export type { StorageResponse, ServiceError, TodoServiceResponse } from './services'; 