

## TASK-003: Create Domain-Driven State Slices
**Priority:** P0  
**Category:** STATE_MANAGEMENT  
**Estimated Time:** 5 hours

**Description:** Break down the monolithic TodoContext into focused domain slices with clear responsibilities and communication patterns.

### Implementation Steps:

#### 1. Create State Slice Foundation
```typescript
// src/state/core/StateSlice.ts
export interface StateSlice<TState = any, TActions = any> {
  readonly name: string;
  readonly initialState: TState;
  reducer(state: TState, action: TActions): TState;
  selectors: Record<string, (state: TState) => any>;
  actions: Record<string, (...args: any[]) => TActions>;
}

export interface SliceAction<TType extends string = string, TPayload = any> {
  type: TType;
  payload?: TPayload;
  meta?: Record<string, any>;
}

export interface AsyncSliceAction<TType extends string = string, TPayload = any> 
  extends SliceAction<TType, TPayload> {
  async: true;
  promise: Promise<any>;
}

// Base class for creating slices
export abstract class BaseStateSlice<TState, TActions extends SliceAction> 
  implements StateSlice<TState, TActions> {
  
  abstract readonly name: string;
  abstract readonly initialState: TState;
  abstract reducer(state: TState, action: TActions): TState;
  
  selectors: Record<string, (state: TState) => any> = {};
  actions: Record<string, (...args: any[]) => TActions> = {};

  protected createAction<T extends string, P = void>(
    type: T
  ): P extends void ? () => SliceAction<T> : (payload: P) => SliceAction<T, P> {
    return ((payload?: P) => ({
      type,
      ...(payload !== undefined && { payload })
    })) as any;
  }

  protected createAsyncAction<T extends string, P = void>(
    type: T,
    asyncFn: (payload: P, getState: () => TState) => Promise<any>
  ): (payload: P) => AsyncSliceAction<T, P> {
    return (payload: P) => ({
      type,
      payload,
      async: true,
      promise: asyncFn(payload, () => this.initialState) // Will be replaced by actual state
    });
  }

  protected createSelector<TResult>(
    name: string,
    selectorFn: (state: TState) => TResult
  ): (state: TState) => TResult {
    this.selectors[name] = selectorFn;
    return selectorFn;
  }
}
```

#### 2. Create Todo Domain Slice
```typescript
// src/state/slices/TodoSlice.ts
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
  selectors = {
    // Basic selectors
    getYearSchedule: this.createSelector('getYearSchedule', (state) => state.yearSchedule),
    getSelectedDate: this.createSelector('getSelectedDate', (state) => state.selectedDate),
    getCurrentYear: this.createSelector('getCurrentYear', (state) => state.currentYear),
    getIsLoading: this.createSelector('getIsLoading', (state) => state.isLoading),
    getError: this.createSelector('getError', (state) => state.error),
    
    // Computed selectors
    getCurrentDaySchedule: this.createSelector('getCurrentDaySchedule', (state) => {
      const monthKey = state.selectedDate.toISOString().slice(0, 7);
      const dayKey = state.selectedDate.toISOString().slice(0, 10);
      const monthSchedule = state.yearSchedule.monthSchedules.get(monthKey);
      return monthSchedule?.daySchedules.get(dayKey) || null;
    }),
    
    getCurrentDayTasks: this.createSelector('getCurrentDayTasks', (state) => {
      const daySchedule = this.selectors.getCurrentDaySchedule(state);
      return daySchedule?.todoItems || [];
    }),
    
    getIncompleteTasks: this.createSelector('getIncompleteTasks', (state) => {
      const tasks = this.selectors.getCurrentDayTasks(state);
      return tasks.filter(task => !task.isCompleted);
    }),
    
    getCompletedTasks: this.createSelector('getCompletedTasks', (state) => {
      const tasks = this.selectors.getCurrentDayTasks(state);
      return tasks.filter(task => task.isCompleted);
    }),
    
    getCurrentDayStats: this.createSelector('getCurrentDayStats', (state) => {
      const daySchedule = this.selectors.getCurrentDaySchedule(state);
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
```

#### 3. Create Date Domain Slice
```typescript
// src/state/slices/DateSlice.ts
import { BaseStateSlice, SliceAction } from '../core/StateSlice';

export interface DateState {
  currentDate: Date;
  selectedDate: Date;
  currentMonth: Date;
  isDateSelectorOpen: boolean;
  calendarView: 'month' | 'year';
  timezone: string;
}

export type DateActions =
  | SliceAction<'DATE_SET_SELECTED', { date: Date }>
  | SliceAction<'DATE_SET_CURRENT_MONTH', { date: Date }>
  | SliceAction<'DATE_TOGGLE_SELECTOR', { isOpen?: boolean }>
  | SliceAction<'DATE_SET_CALENDAR_VIEW', { view: 'month' | 'year' }>
  | SliceAction<'DATE_SET_TIMEZONE', { timezone: string }>;

export class DateSlice extends BaseStateSlice<DateState, DateActions> {
  readonly name = 'date';

  readonly initialState: DateState = {
    currentDate: new Date(),
    selectedDate: new Date(),
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    isDateSelectorOpen: false,
    calendarView: 'month',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  actions = {
    setSelectedDate: this.createAction<'DATE_SET_SELECTED', { date: Date }>('DATE_SET_SELECTED'),
    setCurrentMonth: this.createAction<'DATE_SET_CURRENT_MONTH', { date: Date }>('DATE_SET_CURRENT_MONTH'),
    toggleSelector: this.createAction<'DATE_TOGGLE_SELECTOR', { isOpen?: boolean }>('DATE_TOGGLE_SELECTOR'),
    setCalendarView: this.createAction<'DATE_SET_CALENDAR_VIEW', { view: 'month' | 'year' }>('DATE_SET_CALENDAR_VIEW'),
    setTimezone: this.createAction<'DATE_SET_TIMEZONE', { timezone: string }>('DATE_SET_TIMEZONE')
  };

  selectors = {
    getCurrentDate: this.createSelector('getCurrentDate', (state) => state.currentDate),
    getSelectedDate: this.createSelector('getSelectedDate', (state) => state.selectedDate),
    getCurrentMonth: this.createSelector('getCurrentMonth', (state) => state.currentMonth),
    getIsDateSelectorOpen: this.createSelector('getIsDateSelectorOpen', (state) => state.isDateSelectorOpen),
    getCalendarView: this.createSelector('getCalendarView', (state) => state.calendarView),
    getTimezone: this.createSelector('getTimezone', (state) => state.timezone),
    
    getSelectedDateFormatted: this.createSelector('getSelectedDateFormatted', (state) => {
      return state.selectedDate.toLocaleDateString();
    }),
    
    getIsToday: this.createSelector('getIsToday', (state) => {
      const today = state.currentDate;
      const selected = state.selectedDate;
      return today.toDateString() === selected.toDateString();
    })
  };

  reducer(state: DateState, action: DateActions): DateState {
    switch (action.type) {
      case 'DATE_SET_SELECTED': {
        const { date } = action.payload!;
        return {
          ...state,
          selectedDate: date,
          currentMonth: new Date(date.getFullYear(), date.getMonth(), 1),
          isDateSelectorOpen: false
        };
      }

      case 'DATE_SET_CURRENT_MONTH':
        return {
          ...state,
          currentMonth: new Date(action.payload!.date.getFullYear(), action.payload!.date.getMonth(), 1)
        };

      case 'DATE_TOGGLE_SELECTOR': {
        const { isOpen } = action.payload || {};
        return {
          ...state,
          isDateSelectorOpen: isOpen !== undefined ? isOpen : !state.isDateSelectorOpen
        };
      }

      case 'DATE_SET_CALENDAR_VIEW':
        return {
          ...state,
          calendarView: action.payload!.view
        };

      case 'DATE_SET_TIMEZONE':
        return {
          ...state,
          timezone: action.payload!.timezone
        };

      default:
        return state;
    }
  }
}
```

#### 4. Create UI Domain Slice
```typescript
// src/state/slices/UISlice.ts
import { BaseStateSlice, SliceAction } from '../core/StateSlice';

export interface UIState {
  isLoading: boolean;
  globalError: string | null;
  notifications: Notification[];
  modals: {
    isDateSelectorOpen: boolean;
    isSettingsOpen: boolean;
    isConfirmDeleteOpen: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
  duration?: number;
}

export type UIActions =
  | SliceAction<'UI_SET_LOADING', { isLoading: boolean }>
  | SliceAction<'UI_SET_GLOBAL_ERROR', { error: string | null }>
  | SliceAction<'UI_ADD_NOTIFICATION', { notification: Omit<Notification, 'id' | 'timestamp'> }>
  | SliceAction<'UI_REMOVE_NOTIFICATION', { id: string }>
  | SliceAction<'UI_CLEAR_NOTIFICATIONS'>
  | SliceAction<'UI_SET_MODAL', { modal: keyof UIState['modals']; isOpen: boolean }>
  | SliceAction<'UI_SET_THEME', { theme: 'light' | 'dark' | 'auto' }>
  | SliceAction<'UI_TOGGLE_SIDEBAR'>;

export class UISlice extends BaseStateSlice<UIState, UIActions> {
  readonly name = 'ui';

  readonly initialState: UIState = {
    isLoading: false,
    globalError: null,
    notifications: [],
    modals: {
      isDateSelectorOpen: false,
      isSettingsOpen: false,
      isConfirmDeleteOpen: false
    },
    theme: 'auto',
    sidebarCollapsed: false
  };

  actions = {
    setLoading: this.createAction<'UI_SET_LOADING', { isLoading: boolean }>('UI_SET_LOADING'),
    setGlobalError: this.createAction<'UI_SET_GLOBAL_ERROR', { error: string | null }>('UI_SET_GLOBAL_ERROR'),
    addNotification: this.createAction<'UI_ADD_NOTIFICATION', { notification: Omit<Notification, 'id' | 'timestamp'> }>('UI_ADD_NOTIFICATION'),
    removeNotification: this.createAction<'UI_REMOVE_NOTIFICATION', { id: string }>('UI_REMOVE_NOTIFICATION'),
    clearNotifications: this.createAction<'UI_CLEAR_NOTIFICATIONS'>('UI_CLEAR_NOTIFICATIONS'),
    setModal: this.createAction<'UI_SET_MODAL', { modal: keyof UIState['modals']; isOpen: boolean }>('UI_SET_MODAL'),
    setTheme: this.createAction<'UI_SET_THEME', { theme: 'light' | 'dark' | 'auto' }>('UI_SET_THEME'),
    toggleSidebar: this.createAction<'UI_TOGGLE_SIDEBAR'>('UI_TOGGLE_SIDEBAR')
  };

  selectors = {
    getIsLoading: this.createSelector('getIsLoading', (state) => state.isLoading),
    getGlobalError: this.createSelector('getGlobalError', (state) => state.globalError),
    getNotifications: this.createSelector('getNotifications', (state) => state.notifications),
    getModals: this.createSelector('getModals', (state) => state.modals),
    getTheme: this.createSelector('getTheme', (state) => state.theme),
    getSidebarCollapsed: this.createSelector('getSidebarCollapsed', (state) => state.sidebarCollapsed),
    
    getActiveNotifications: this.createSelector('getActiveNotifications', (state) => {
      return state.notifications.filter(notification => {
        if (!notification.autoHide) return true;
        const now = new Date();
        const elapsed = now.getTime() - notification.timestamp.getTime();
        return elapsed < (notification.duration || 5000);
      });
    }),
    
    getModalState: this.createSelector('getModalState', (state) => (modal: keyof UIState['modals']) => {
      return state.modals[modal];
    })
  };

  reducer(state: UIState, action: UIActions): UIState {
    switch (action.type) {
      case 'UI_SET_LOADING':
        return {
          ...state,
          isLoading: action.payload!.isLoading
        };

      case 'UI_SET_GLOBAL_ERROR':
        return {
          ...state,
          globalError: action.payload!.error
        };

      case 'UI_ADD_NOTIFICATION': {
        const notification: Notification = {
          ...action.payload!.notification,
          id: `notification-${Date.now()}-${Math.random()}`,
          timestamp: new Date()
        };
        
        return {
          ...state,
          notifications: [...state.notifications, notification]
        };
      }

      case 'UI_REMOVE_NOTIFICATION':
        return {
          ...state,
          notifications: state.notifications.filter(n => n.id !== action.payload!.id)
        };

      case 'UI_CLEAR_NOTIFICATIONS':
        return {
          ...state,
          notifications: []
        };

      case 'UI_SET_MODAL': {
        const { modal, isOpen } = action.payload!;
        return {
          ...state,
          modals: {
            ...state.modals,
            [modal]: isOpen
          }
        };
      }

      case 'UI_SET_THEME':
        return {
          ...state,
          theme: action.payload!.theme
        };

      case 'UI_TOGGLE_SIDEBAR':
        return {
          ...state,
          sidebarCollapsed: !state.sidebarCollapsed
        };

      default:
        return state;
    }
  }
}
```

#### 5. Create State Manager and Root Store
```typescript
// src/state/StateManager.ts
import { StateSlice, SliceAction } from './core/StateSlice';
import { TodoSlice, TodoState, TodoActions } from './slices/TodoSlice';
import { DateSlice, DateState, DateActions } from './slices/DateSlice';
import { UISlice, UIState, UIActions } from './slices/UISlice';

export interface RootState {
  todo: TodoState;
  date: DateState;
  ui: UIState;
}

export type RootActions = TodoActions | DateActions | UIActions;

export class StateManager {
  private slices: Map<string, StateSlice> = new Map();
  private currentState: RootState;
  private listeners: Array<(state: RootState) => void> = [];

  constructor() {
    // Register slices
    this.registerSlice(new TodoSlice());
    this.registerSlice(new DateSlice());
    this.registerSlice(new UISlice());

    // Initialize state
    this.currentState = this.createInitialState();
  }

  private registerSlice(slice: StateSlice): void {
    this.slices.set(slice.name, slice);
  }

  private createInitialState(): RootState {
    const state: any = {};
    
    for (const [name, slice] of this.slices) {
      state[name] = slice.initialState;
    }

    return state as RootState;
  }

  getState(): RootState {
    return this.currentState;
  }

  dispatch(action: RootActions): void {
    let hasChanged = false;
    const newState: any = {};

    // Run action through all slice reducers
    for (const [name, slice] of this.slices) {
      const currentSliceState = this.currentState[name as keyof RootState];
      const newSliceState = slice.reducer(currentSliceState, action);
      
      newState[name] = newSliceState;
      
      if (newSliceState !== currentSliceState) {
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.currentState = newState as RootState;
      this.notifyListeners();
    }
  }

  subscribe(listener: (state: RootState) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Selector helpers
  getSliceSelectors<T extends keyof RootState>(sliceName: T): Record<string, (state: RootState[T]) => any> {
    const slice = this.slices.get(sliceName as string);
    return slice?.selectors || {};
  }

  getSliceActions<T extends keyof RootState>(sliceName: T): Record<string, (...args: any[]) => any> {
    const slice = this.slices.get(sliceName as string);
    return slice?.actions || {};
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    }
  }
}

// React integration
// src/state/StateProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const StateContext = createContext<StateManager | null>(null);

export interface StateProviderProps {
  stateManager: StateManager;
  children: React.ReactNode;
}

export const StateProvider: React.FC<StateProviderProps> = ({ stateManager, children }) => {
  return (
    <StateContext.Provider value={stateManager}>
      {children}
    </StateContext.Provider>
  );
};

export function useStateManager(): StateManager {
  const stateManager = useContext(StateContext);
  if (!stateManager) {
    throw new Error('useStateManager must be used within a StateProvider');
  }
  return stateManager;
}

export function useAppState(): RootState {
  const stateManager = useStateManager();
  const [state, setState] = useState(stateManager.getState());

  useEffect(() => {
    return stateManager.subscribe(setState);
  }, [stateManager]);

  return state;
}

export function useAppDispatch() {
  const stateManager = useStateManager();
  return stateManager.dispatch.bind(stateManager);
}

export function useSliceSelector<T extends keyof RootState>(
  sliceName: T,
  selectorName: string
): (state: RootState[T]) => any {
  const stateManager = useStateManager();
  const selectors = stateManager.getSliceSelectors(sliceName);
  return selectors[selectorName];
}

export function useSliceActions<T extends keyof RootState>(
  sliceName: T
): Record<string, (...args: any[]) => any> {
  const stateManager = useStateManager();
  return stateManager.getSliceActions(sliceName);
}
```

### Files to Create:
- `src/state/core/StateSlice.ts`
- `src/state/slices/TodoSlice.ts`
- `src/state/slices/DateSlice.ts`
- `src/state/slices/UISlice.ts`
- `src/state/StateManager.ts`
- `src/state/StateProvider.tsx`
- `src/state/index.ts` (exports)

### Acceptance Criteria:
- [ ] Domain slices isolate concerns correctly
- [ ] Actions are strongly typed and self-contained
- [ ] Selectors provide computed state efficiently
- [ ] State updates are immutable and predictable
- [ ] React integration provides hooks for state access
- [ ] Cross-slice communication patterns established

---
