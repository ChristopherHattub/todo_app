/**
 * State fixtures for testing state management functionality
 */

import { TodoState } from '../../state/slices/TodoSlice';
import { UIState, Notification } from '../../state/slices/UISlice';
import { DateState } from '../../state/slices/DateSlice';
import { RootState } from '../../state/StateManager';
import { TodoItem, DaySchedule, MonthSchedule, YearSchedule } from '../../types';
import { createTodoCollection, createDaySchedule, createYearSchedule } from './TodoFixtures';
import { TestDates } from './DateFixtures';

/**
 * Initial state fixtures for each slice
 */
export const InitialStateFixtures = {
  todo: (): TodoState => ({
    yearSchedule: createYearSchedule(),
    selectedDate: TestDates.JANUARY_1_2024,
    currentYear: 2024,
    isLoading: false,
    error: null,
    lastOperation: null
  }),

  ui: (): UIState => ({
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
  }),

  date: (): DateState => ({
    currentDate: TestDates.JANUARY_1_2024,
    selectedDate: TestDates.JANUARY_1_2024,
    currentMonth: new Date(2024, 0, 1),
    isDateSelectorOpen: false,
    calendarView: 'month',
    timezone: 'UTC'
  })
};

/**
 * Loading state fixtures
 */
export const LoadingStateFixtures = {
  todoLoading: (): TodoState => ({
    ...InitialStateFixtures.todo(),
    isLoading: true
  }),

  uiLoading: (): UIState => ({
    ...InitialStateFixtures.ui(),
    isLoading: true
  })
};

/**
 * Error state fixtures
 */
export const ErrorStateFixtures = {
  todoError: (error: string = 'Test error'): TodoState => ({
    ...InitialStateFixtures.todo(),
    error,
    lastOperation: {
      type: 'ADD_TODO',
      timestamp: TestDates.JANUARY_1_2024,
      success: false
    }
  }),

  uiError: (error: string = 'Test global error'): UIState => ({
    ...InitialStateFixtures.ui(),
    globalError: error
  })
};

/**
 * Populated state fixtures with data
 */
export const PopulatedStateFixtures = {
  todoWithData: (): TodoState => {
    const yearSchedule = createYearSchedule();
    return {
      ...InitialStateFixtures.todo(),
      yearSchedule,
      lastOperation: {
        type: 'ADD_TODO',
        timestamp: TestDates.JANUARY_1_2024,
        success: true
      }
    };
  },

  uiWithNotifications: (): UIState => ({
    ...InitialStateFixtures.ui(),
    notifications: [
      {
        id: 'notif-1',
        type: 'success',
        title: 'Success',
        message: 'Todo added successfully',
        timestamp: TestDates.JANUARY_1_2024,
        autoHide: true,
        duration: 5000
      },
      {
        id: 'notif-2',
        type: 'error',
        title: 'Error',
        message: 'Failed to save todo',
        timestamp: TestDates.JANUARY_1_2024,
        autoHide: false
      }
    ]
  }),

  uiWithModalsOpen: (): UIState => ({
    ...InitialStateFixtures.ui(),
    modals: {
      isDateSelectorOpen: true,
      isSettingsOpen: false,
      isConfirmDeleteOpen: true
    }
  })
};

/**
 * Complete root state fixtures
 */
export const RootStateFixtures = {
  initial: (): RootState => ({
    todo: InitialStateFixtures.todo(),
    ui: InitialStateFixtures.ui(),
    date: InitialStateFixtures.date()
  }),

  loading: (): RootState => ({
    todo: LoadingStateFixtures.todoLoading(),
    ui: LoadingStateFixtures.uiLoading(),
    date: InitialStateFixtures.date()
  }),

  withErrors: (): RootState => ({
    todo: ErrorStateFixtures.todoError(),
    ui: ErrorStateFixtures.uiError(),
    date: InitialStateFixtures.date()
  }),

  populated: (): RootState => ({
    todo: PopulatedStateFixtures.todoWithData(),
    ui: PopulatedStateFixtures.uiWithNotifications(),
    date: InitialStateFixtures.date()
  }),

  custom: (overrides: Partial<RootState>): RootState => ({
    ...RootStateFixtures.initial(),
    ...overrides
  })
};

/**
 * Action fixtures for testing state transitions
 */
export const ActionFixtures = {
  todo: {
    addTodoStarted: (todo: Omit<TodoItem, 'id' | 'createdAt'>, targetDate: Date = TestDates.JANUARY_1_2024) => ({
      type: 'TODO_ADD_STARTED' as const,
      payload: { todo, targetDate }
    }),

    addTodoSuccess: (todo: TodoItem, daySchedule: DaySchedule, targetDate: Date = TestDates.JANUARY_1_2024) => ({
      type: 'TODO_ADD_SUCCESS' as const,
      payload: { todo, daySchedule, targetDate }
    }),

    addTodoFailure: (error: string = 'Test error') => ({
      type: 'TODO_ADD_FAILURE' as const,
      payload: { error }
    }),

    completeTodoStarted: (todoId: string) => ({
      type: 'TODO_COMPLETE_STARTED' as const,
      payload: { todoId }
    }),

    completeTodoSuccess: (todoId: string, daySchedule: DaySchedule) => ({
      type: 'TODO_COMPLETE_SUCCESS' as const,
      payload: { todoId, daySchedule }
    }),

    completeTodoFailure: (error: string = 'Test error') => ({
      type: 'TODO_COMPLETE_FAILURE' as const,
      payload: { error }
    }),

    setSelectedDate: (date: Date = TestDates.JANUARY_1_2024) => ({
      type: 'TODO_SET_SELECTED_DATE' as const,
      payload: { date }
    }),

    loadYearStarted: (year: number = 2024) => ({
      type: 'TODO_LOAD_YEAR_STARTED' as const,
      payload: { year }
    }),

    loadYearSuccess: (yearSchedule: YearSchedule) => ({
      type: 'TODO_LOAD_YEAR_SUCCESS' as const,
      payload: { yearSchedule }
    }),

    loadYearFailure: (error: string = 'Test error') => ({
      type: 'TODO_LOAD_YEAR_FAILURE' as const,
      payload: { error }
    }),

    setError: (error: string) => ({
      type: 'TODO_SET_ERROR' as const,
      payload: { error }
    }),

    clearError: () => ({
      type: 'TODO_CLEAR_ERROR' as const
    })
  },

  ui: {
    setLoading: (isLoading: boolean) => ({
      type: 'UI_SET_LOADING' as const,
      payload: { isLoading }
    }),

    setGlobalError: (error: string | null) => ({
      type: 'UI_SET_GLOBAL_ERROR' as const,
      payload: { error }
    }),

    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => ({
      type: 'UI_ADD_NOTIFICATION' as const,
      payload: { notification }
    }),

    removeNotification: (id: string) => ({
      type: 'UI_REMOVE_NOTIFICATION' as const,
      payload: { id }
    }),

    clearNotifications: () => ({
      type: 'UI_CLEAR_NOTIFICATIONS' as const
    }),

    setModal: (modal: 'isDateSelectorOpen' | 'isSettingsOpen' | 'isConfirmDeleteOpen', isOpen: boolean) => ({
      type: 'UI_SET_MODAL' as const,
      payload: { modal, isOpen }
    }),

    setTheme: (theme: 'light' | 'dark' | 'auto') => ({
      type: 'UI_SET_THEME' as const,
      payload: { theme }
    }),

    toggleSidebar: () => ({
      type: 'UI_TOGGLE_SIDEBAR' as const
    })
  },

  date: {
    setSelectedDate: (date: Date = TestDates.JANUARY_1_2024) => ({
      type: 'DATE_SET_SELECTED' as const,
      payload: { date }
    }),

    setCurrentMonth: (date: Date = TestDates.JANUARY_1_2024) => ({
      type: 'DATE_SET_CURRENT_MONTH' as const,
      payload: { date }
    }),

    toggleSelector: (isOpen?: boolean) => ({
      type: 'DATE_TOGGLE_SELECTOR' as const,
      payload: isOpen !== undefined ? { isOpen } : undefined
    }),

    setCalendarView: (view: 'month' | 'year') => ({
      type: 'DATE_SET_CALENDAR_VIEW' as const,
      payload: { view }
    }),

    setTimezone: (timezone: string) => ({
      type: 'DATE_SET_TIMEZONE' as const,
      payload: { timezone }
    })
  }
};

/**
 * Selector test expectations
 */
export const SelectorExpectations = {
  todo: {
    getCurrentDayTasks: (state: TodoState): TodoItem[] => {
      const monthKey = state.selectedDate.toISOString().slice(0, 7);
      const dayKey = state.selectedDate.toISOString().slice(0, 10);
      const monthSchedule = state.yearSchedule.monthSchedules.get(monthKey);
      return monthSchedule?.daySchedules.get(dayKey)?.todoItems || [];
    },

    getCurrentDayStats: (state: TodoState) => {
      const tasks = SelectorExpectations.todo.getCurrentDayTasks(state);
      const completed = tasks.filter(t => t.isCompleted);
      return {
        totalTasks: tasks.length,
        completedTasks: completed.length,
        totalPoints: tasks.reduce((sum, t) => sum + t.pointValue, 0),
        completedPoints: completed.reduce((sum, t) => sum + t.pointValue, 0)
      };
    }
  },

  ui: {
    getActiveNotifications: (state: UIState) => {
      return state.notifications.filter(notification => {
        if (!notification.autoHide) return true;
        const now = new Date();
        const elapsed = now.getTime() - notification.timestamp.getTime();
        return elapsed < (notification.duration || 5000);
      });
    }
  },

  date: {
    getIsToday: (state: DateState): boolean => {
      return state.currentDate.toDateString() === state.selectedDate.toDateString();
    },

    getSelectedDateFormatted: (state: DateState): string => {
      return state.selectedDate.toLocaleDateString();
    }
  }
};

/**
 * State transition test scenarios
 */
export const StateTransitionScenarios = {
  todoLifecycle: {
    addTodo: {
      initial: InitialStateFixtures.todo(),
      action: ActionFixtures.todo.addTodoStarted({
        title: 'New Todo',
        description: 'Description',
        pointValue: 10,
        isCompleted: false
      }),
      expectedChanges: { isLoading: true, error: null }
    },
    
    addTodoSuccess: {
      initial: LoadingStateFixtures.todoLoading(),
      action: ActionFixtures.todo.addTodoSuccess(
        createTodoCollection(1)[0],
        createDaySchedule()
      ),
      expectedChanges: { isLoading: false, lastOperation: { success: true } }
    }
  },

  uiInteractions: {
    showNotification: {
      initial: InitialStateFixtures.ui(),
      action: ActionFixtures.ui.addNotification({
        type: 'success',
        title: 'Success',
        message: 'Operation completed'
      }),
      expectedChanges: { notifications: { length: 1 } }
    },

    openModal: {
      initial: InitialStateFixtures.ui(),
      action: ActionFixtures.ui.setModal('isDateSelectorOpen', true),
      expectedChanges: { modals: { isDateSelectorOpen: true } }
    }
  }
}; 