import { TodoItem, YearSchedule, MonthSchedule, DaySchedule } from '../../types';
import { BaseStateSlice, SliceAction } from '../core/StateSlice';

// State Interface
export interface TodoState {
  yearSchedule: YearSchedule;
  selectedDate: Date;
  currentYear: number;
  isLoading: boolean;
  error: string | null;
  lastOperation: {
    type: string;
    timestamp: Date;
    success: boolean;
  } | null;
}

// Action Types
export type TodoActions =
  | SliceAction<'TODO_ADD_STARTED', { todo: Omit<TodoItem, 'id' | 'createdAt'>; targetDate: Date }>
  | SliceAction<'TODO_ADD_SUCCESS', { todo: TodoItem; daySchedule: DaySchedule; targetDate: Date }>
  | SliceAction<'TODO_ADD_FAILURE', { error: string }>
  | SliceAction<'TODO_COMPLETE_STARTED', { todoId: string }>
  | SliceAction<'TODO_COMPLETE_SUCCESS', { todoId: string; daySchedule: DaySchedule }>
  | SliceAction<'TODO_COMPLETE_FAILURE', { error: string }>
  | SliceAction<'TODO_SET_SELECTED_DATE', { date: Date }>
  | SliceAction<'TODO_LOAD_YEAR_STARTED', { year: number }>
  | SliceAction<'TODO_LOAD_YEAR_SUCCESS', { yearSchedule: YearSchedule }>
  | SliceAction<'TODO_LOAD_YEAR_FAILURE', { error: string }>
  | SliceAction<'TODO_SET_ERROR', { error: string }>
  | SliceAction<'TODO_CLEAR_ERROR'>;

export class TodoSlice extends BaseStateSlice<TodoState, TodoActions> {
  readonly name = 'todo';
  
  readonly initialState: TodoState = {
    yearSchedule: {
      year: new Date().getFullYear(),
      monthSchedules: new Map(),
      totalYearPoints: 0,
      totalCompletedYearPoints: 0
    },
    selectedDate: new Date(),
    currentYear: new Date().getFullYear(),
    isLoading: false,
    error: null,
    lastOperation: null
  };

  // Actions
  actions = {
    addTodoStarted: this.createAction<'TODO_ADD_STARTED', { todo: Omit<TodoItem, 'id' | 'createdAt'>; targetDate: Date }>('TODO_ADD_STARTED'),
    addTodoSuccess: this.createAction<'TODO_ADD_SUCCESS', { todo: TodoItem; daySchedule: DaySchedule; targetDate: Date }>('TODO_ADD_SUCCESS'),
    addTodoFailure: this.createAction<'TODO_ADD_FAILURE', { error: string }>('TODO_ADD_FAILURE'),
    
    completeTodoStarted: this.createAction<'TODO_COMPLETE_STARTED', { todoId: string }>('TODO_COMPLETE_STARTED'),
    completeTodoSuccess: this.createAction<'TODO_COMPLETE_SUCCESS', { todoId: string; daySchedule: DaySchedule }>('TODO_COMPLETE_SUCCESS'),
    completeTodoFailure: this.createAction<'TODO_COMPLETE_FAILURE', { error: string }>('TODO_COMPLETE_FAILURE'),
    
    setSelectedDate: this.createAction<'TODO_SET_SELECTED_DATE', { date: Date }>('TODO_SET_SELECTED_DATE'),
    
    loadYearStarted: this.createAction<'TODO_LOAD_YEAR_STARTED', { year: number }>('TODO_LOAD_YEAR_STARTED'),
    loadYearSuccess: this.createAction<'TODO_LOAD_YEAR_SUCCESS', { yearSchedule: YearSchedule }>('TODO_LOAD_YEAR_SUCCESS'),
    loadYearFailure: this.createAction<'TODO_LOAD_YEAR_FAILURE', { error: string }>('TODO_LOAD_YEAR_FAILURE'),
    
    setError: this.createAction<'TODO_SET_ERROR', { error: string }>('TODO_SET_ERROR'),
    clearError: this.createAction<'TODO_CLEAR_ERROR'>('TODO_CLEAR_ERROR')
  };

  // Selectors
  selectors: Record<string, (state: TodoState) => any> = {
    // Basic selectors
    getYearSchedule: this.createSelector('getYearSchedule', (state: TodoState): YearSchedule => state.yearSchedule),
    getSelectedDate: this.createSelector('getSelectedDate', (state: TodoState): Date => state.selectedDate),
    getCurrentYear: this.createSelector('getCurrentYear', (state: TodoState): number => state.currentYear),
    getIsLoading: this.createSelector('getIsLoading', (state: TodoState): boolean => state.isLoading),
    getError: this.createSelector('getError', (state: TodoState): string | null => state.error),
    
    // Computed selectors
    getCurrentDaySchedule: this.createSelector('getCurrentDaySchedule', (state: TodoState): DaySchedule | null => {
      const monthKey = state.selectedDate.toISOString().slice(0, 7);
      const dayKey = state.selectedDate.toISOString().slice(0, 10);
      const monthSchedule = state.yearSchedule.monthSchedules.get(monthKey);
      return monthSchedule?.daySchedules.get(dayKey) || null;
    }),
    
    getCurrentDayTasks: this.createSelector('getCurrentDayTasks', (state: TodoState): TodoItem[] => {
      const daySchedule = this.selectors.getCurrentDaySchedule(state) as DaySchedule | null;
      return daySchedule?.todoItems || [];
    }),
    
    getIncompleteTasks: this.createSelector('getIncompleteTasks', (state: TodoState): TodoItem[] => {
      const tasks = this.selectors.getCurrentDayTasks(state) as TodoItem[];
      return tasks.filter((task: TodoItem) => !task.isCompleted);
    }),
    
    getCompletedTasks: this.createSelector('getCompletedTasks', (state: TodoState): TodoItem[] => {
      const tasks = this.selectors.getCurrentDayTasks(state) as TodoItem[];
      return tasks.filter((task: TodoItem) => task.isCompleted);
    }),
    
    getCurrentDayStats: this.createSelector('getCurrentDayStats', (state: TodoState): {
      totalTasks: number;
      completedTasks: number;
      totalPoints: number;
      completedPoints: number;
    } => {
      const daySchedule = this.selectors.getCurrentDaySchedule(state) as DaySchedule | null;
      return {
        totalTasks: daySchedule?.todoItems.length || 0,
        completedTasks: daySchedule?.completedTodoItems.length || 0,
        totalPoints: daySchedule?.totalPointValue || 0,
        completedPoints: daySchedule?.totalCompletedPointValue || 0
      };
    })
  };

  // Reducer
  reducer(state: TodoState, action: TodoActions): TodoState {
    switch (action.type) {
      case 'TODO_ADD_STARTED':
        return {
          ...state,
          isLoading: true,
          error: null
        };

      case 'TODO_ADD_SUCCESS': {
        const { todo, daySchedule, targetDate } = action.payload!;
        const updatedYearSchedule = this.updateYearScheduleWithDay(state.yearSchedule, daySchedule, targetDate);
        
        return {
          ...state,
          yearSchedule: updatedYearSchedule,
          isLoading: false,
          lastOperation: {
            type: 'ADD_TODO',
            timestamp: new Date(),
            success: true
          }
        };
      }

      case 'TODO_ADD_FAILURE':
        return {
          ...state,
          isLoading: false,
          error: action.payload!.error,
          lastOperation: {
            type: 'ADD_TODO',
            timestamp: new Date(),
            success: false
          }
        };

      case 'TODO_COMPLETE_STARTED':
        return {
          ...state,
          isLoading: true,
          error: null
        };

      case 'TODO_COMPLETE_SUCCESS': {
        const { todoId, daySchedule } = action.payload!;
        const updatedYearSchedule = this.updateYearScheduleWithDay(state.yearSchedule, daySchedule, state.selectedDate);
        
        return {
          ...state,
          yearSchedule: updatedYearSchedule,
          isLoading: false,
          lastOperation: {
            type: 'COMPLETE_TODO',
            timestamp: new Date(),
            success: true
          }
        };
      }

      case 'TODO_COMPLETE_FAILURE':
        return {
          ...state,
          isLoading: false,
          error: action.payload!.error,
          lastOperation: {
            type: 'COMPLETE_TODO',
            timestamp: new Date(),
            success: false
          }
        };

      case 'TODO_SET_SELECTED_DATE':
        return {
          ...state,
          selectedDate: action.payload!.date
        };

      case 'TODO_LOAD_YEAR_STARTED':
        return {
          ...state,
          isLoading: true,
          error: null,
          currentYear: action.payload!.year
        };

      case 'TODO_LOAD_YEAR_SUCCESS':
        return {
          ...state,
          yearSchedule: action.payload!.yearSchedule,
          isLoading: false
        };

      case 'TODO_LOAD_YEAR_FAILURE':
        return {
          ...state,
          isLoading: false,
          error: action.payload!.error
        };

      case 'TODO_SET_ERROR':
        return {
          ...state,
          error: action.payload!.error
        };

      case 'TODO_CLEAR_ERROR':
        return {
          ...state,
          error: null
        };

      default:
        return state;
    }
  }

  private updateYearScheduleWithDay(yearSchedule: YearSchedule, daySchedule: DaySchedule, date: Date): YearSchedule {
    const monthKey = date.toISOString().slice(0, 7);
    const dayKey = date.toISOString().slice(0, 10);
    
    const newMonthSchedules = new Map(yearSchedule.monthSchedules);
    
    if (!newMonthSchedules.has(monthKey)) {
      newMonthSchedules.set(monthKey, {
        date: monthKey,
        daySchedules: new Map(),
        totalMonthPoints: 0,
        totalCompletedMonthPoints: 0
      });
    }
    
    const monthSchedule = { ...newMonthSchedules.get(monthKey)! };
    const newDaySchedules = new Map(monthSchedule.daySchedules);
    newDaySchedules.set(dayKey, daySchedule);
    
    monthSchedule.daySchedules = newDaySchedules;
    monthSchedule.totalMonthPoints = this.calculateMonthTotalPoints(monthSchedule);
    monthSchedule.totalCompletedMonthPoints = this.calculateMonthCompletedPoints(monthSchedule);
    
    newMonthSchedules.set(monthKey, monthSchedule);
    
    return {
      ...yearSchedule,
      monthSchedules: newMonthSchedules,
      totalYearPoints: this.calculateYearTotalPoints(newMonthSchedules),
      totalCompletedYearPoints: this.calculateYearCompletedPoints(newMonthSchedules)
    };
  }

  private calculateMonthTotalPoints(monthSchedule: MonthSchedule): number {
    let total = 0;
    for (const daySchedule of monthSchedule.daySchedules.values()) {
      total += daySchedule.totalPointValue;
    }
    return total;
  }

  private calculateMonthCompletedPoints(monthSchedule: MonthSchedule): number {
    let total = 0;
    for (const daySchedule of monthSchedule.daySchedules.values()) {
      total += daySchedule.totalCompletedPointValue;
    }
    return total;
  }

  private calculateYearTotalPoints(monthSchedules: Map<string, MonthSchedule>): number {
    let total = 0;
    for (const monthSchedule of monthSchedules.values()) {
      total += monthSchedule.totalMonthPoints;
    }
    return total;
  }

  private calculateYearCompletedPoints(monthSchedules: Map<string, MonthSchedule>): number {
    let total = 0;
    for (const monthSchedule of monthSchedules.values()) {
      total += monthSchedule.totalCompletedMonthPoints;
    }
    return total;
  }
} 