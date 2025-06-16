import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { TodoItem, YearSchedule, AppState } from '../types';
import { TodoService } from '../types/services';
import { TodoService as TodoServiceImplementation } from '../services/TodoService';
import { LocalStorageService } from '../services/LocalStorageService';
import { DataMigrationService } from '../services/DataMigrationService';
import { animationHandler } from '../services/AnimationHandler';

// Define the state interface
interface TodoState extends AppState {
  yearSchedule: YearSchedule;
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;
  // New state for persistence
  isInitialized: boolean;
  lastSaveTimestamp: Date | null;
  hasUnsavedChanges: boolean;
}

// Define action types
export enum TodoActionType {
  ADD_TODO = 'ADD_TODO',
  UPDATE_TODO = 'UPDATE_TODO',
  DELETE_TODO = 'DELETE_TODO',
  COMPLETE_TODO = 'COMPLETE_TODO',
  SET_SELECTED_DATE = 'SET_SELECTED_DATE',
  LOAD_YEAR_DATA = 'LOAD_YEAR_DATA',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  // New actions for persistence
  SET_INITIALIZED = 'SET_INITIALIZED',
  SET_SAVE_TIMESTAMP = 'SET_SAVE_TIMESTAMP',
  SET_UNSAVED_CHANGES = 'SET_UNSAVED_CHANGES',
  INITIALIZE_DATA = 'INITIALIZE_DATA'
}

// Define action interfaces
interface AddTodoAction {
  type: TodoActionType.ADD_TODO;
  payload: {
    todo: TodoItem;
    targetDate: Date;
  };
}

interface UpdateTodoAction {
  type: TodoActionType.UPDATE_TODO;
  payload: TodoItem;
}

interface DeleteTodoAction {
  type: TodoActionType.DELETE_TODO;
  payload: string; // todoId
}

interface CompleteTodoAction {
  type: TodoActionType.COMPLETE_TODO;
  payload: string; // todoId
}

interface SetSelectedDateAction {
  type: TodoActionType.SET_SELECTED_DATE;
  payload: Date;
}

interface LoadYearDataAction {
  type: TodoActionType.LOAD_YEAR_DATA;
  payload: YearSchedule;
}

interface SetLoadingAction {
  type: TodoActionType.SET_LOADING;
  payload: boolean;
}

interface SetErrorAction {
  type: TodoActionType.SET_ERROR;
  payload: string;
}

interface ClearErrorAction {
  type: TodoActionType.CLEAR_ERROR;
}

// New action interfaces for persistence
interface SetInitializedAction {
  type: TodoActionType.SET_INITIALIZED;
  payload: boolean;
}

interface SetSaveTimestampAction {
  type: TodoActionType.SET_SAVE_TIMESTAMP;
  payload: Date | null;
}

interface SetUnsavedChangesAction {
  type: TodoActionType.SET_UNSAVED_CHANGES;
  payload: boolean;
}

interface InitializeDataAction {
  type: TodoActionType.INITIALIZE_DATA;
  payload: {
    yearSchedule: YearSchedule;
    selectedDate: Date;
  };
}

type TodoAction =
  | AddTodoAction
  | UpdateTodoAction
  | DeleteTodoAction
  | CompleteTodoAction
  | SetSelectedDateAction
  | LoadYearDataAction
  | SetLoadingAction
  | SetErrorAction
  | ClearErrorAction
  | SetInitializedAction
  | SetSaveTimestampAction
  | SetUnsavedChangesAction
  | InitializeDataAction;

// Initial state
const initialState: TodoState = {
  yearSchedule: {
    year: new Date().getFullYear(),
    monthSchedules: new Map(),
    totalYearPoints: 0,
    totalCompletedYearPoints: 0
  },
  selectedDate: new Date(),
  currentYear: new Date().getFullYear(),
  isDateSelectorOpen: false,
  isLoading: false,
  error: null,
  // New persistence state
  isInitialized: false,
  lastSaveTimestamp: null,
  hasUnsavedChanges: false
};

// Create context
interface TodoContextType {
  state: TodoState;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt'>) => Promise<void>;
  completeTodo: (todoId: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  loadYearData: (year: number) => Promise<void>;
  // New persistence methods
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  createBackup: (label?: string) => Promise<string>;
  getBackups: () => Array<{ key: string; timestamp: number; type: string }>;
  restoreFromBackup: (backupKey: string) => Promise<void>;
  validateDataIntegrity: () => Promise<boolean>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Reducer function
const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case TodoActionType.ADD_TODO:
      // Update the year schedule with the new todo
      const updatedYearSchedule = { ...state.yearSchedule };
      const monthKey = action.payload.targetDate.toISOString().slice(0, 7);
      const dayKey = action.payload.targetDate.toISOString().slice(0, 10);
      
      // Create new Map to ensure proper updates
      const newMonthSchedules = new Map(updatedYearSchedule.monthSchedules);
      
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
      
      if (!newDaySchedules.has(dayKey)) {
        newDaySchedules.set(dayKey, {
          date: dayKey,
          totalPointValue: 0,
          totalCompletedPointValue: 0,
          todoItems: [],
          completedTodoItems: [],
          incompleteTodoItems: []
        });
      }
      
      const daySchedule = { ...newDaySchedules.get(dayKey)! };
      daySchedule.todoItems = [...daySchedule.todoItems, action.payload.todo];
      daySchedule.totalPointValue += action.payload.todo.pointValue;
      
      if (action.payload.todo.isCompleted) {
        daySchedule.completedTodoItems = [...daySchedule.completedTodoItems, action.payload.todo];
        daySchedule.totalCompletedPointValue += action.payload.todo.pointValue;
      } else {
        daySchedule.incompleteTodoItems = [...daySchedule.incompleteTodoItems, action.payload.todo];
      }
      
      newDaySchedules.set(dayKey, daySchedule);
      monthSchedule.daySchedules = newDaySchedules;
      monthSchedule.totalMonthPoints += action.payload.todo.pointValue;
      newMonthSchedules.set(monthKey, monthSchedule);
      updatedYearSchedule.monthSchedules = newMonthSchedules;
      updatedYearSchedule.totalYearPoints += action.payload.todo.pointValue;
      
      return {
        ...state,
        yearSchedule: updatedYearSchedule,
        hasUnsavedChanges: true
      };

    case TodoActionType.COMPLETE_TODO:
      // Update the todo completion status
      const completedYearSchedule = { ...state.yearSchedule };
      const newCompletedMonthSchedules = new Map(completedYearSchedule.monthSchedules);
      
      // Find the todo item in the current selected date
      const currentMonthKey = state.selectedDate.toISOString().slice(0, 7);
      const currentDayKey = state.selectedDate.toISOString().slice(0, 10);
      
      const currentMonthSchedule = newCompletedMonthSchedules.get(currentMonthKey);
      if (currentMonthSchedule) {
        const newDaySchedules = new Map(currentMonthSchedule.daySchedules);
        const daySchedule = newDaySchedules.get(currentDayKey);
        if (daySchedule) {
          const todo = daySchedule.todoItems.find(t => t.id === action.payload);
          if (todo && !todo.isCompleted) {
            // Update the todo
            todo.isCompleted = true;
            todo.completedAt = new Date();
            
            // Update the day schedule totals
            const updatedDaySchedule = { ...daySchedule };
            updatedDaySchedule.totalCompletedPointValue += todo.pointValue;
            updatedDaySchedule.completedTodoItems = [...daySchedule.completedTodoItems, todo];
            updatedDaySchedule.incompleteTodoItems = daySchedule.incompleteTodoItems.filter(t => t.id !== action.payload);
            
            // Update the maps
            newDaySchedules.set(currentDayKey, updatedDaySchedule);
            const updatedMonthSchedule = { ...currentMonthSchedule };
            updatedMonthSchedule.daySchedules = newDaySchedules;
            updatedMonthSchedule.totalCompletedMonthPoints += todo.pointValue;
            
            newCompletedMonthSchedules.set(currentMonthKey, updatedMonthSchedule);
            completedYearSchedule.monthSchedules = newCompletedMonthSchedules;
            completedYearSchedule.totalCompletedYearPoints += todo.pointValue;
          }
        }
      }
      
      return {
        ...state,
        yearSchedule: completedYearSchedule,
        hasUnsavedChanges: true
      };

    case TodoActionType.SET_SELECTED_DATE:
      return {
        ...state,
        selectedDate: action.payload
      };

    case TodoActionType.LOAD_YEAR_DATA:
      return {
        ...state,
        yearSchedule: action.payload,
        hasUnsavedChanges: false
      };

    case TodoActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case TodoActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case TodoActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case TodoActionType.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload
      };

    case TodoActionType.SET_SAVE_TIMESTAMP:
      return {
        ...state,
        lastSaveTimestamp: action.payload,
        hasUnsavedChanges: false
      };

    case TodoActionType.SET_UNSAVED_CHANGES:
      return {
        ...state,
        hasUnsavedChanges: action.payload
      };

    case TodoActionType.INITIALIZE_DATA:
      return {
        ...state,
        yearSchedule: action.payload.yearSchedule,
        selectedDate: action.payload.selectedDate,
        isInitialized: true,
        hasUnsavedChanges: false
      };

    default:
      return state;
  }
};

// Provider component
interface TodoProviderProps {
  children: ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const todoService = TodoServiceImplementation.getInstance();

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!state.hasUnsavedChanges || !state.isInitialized) {
      return;
    }

    try {
      // Save year schedule
      const yearSaveResult = await LocalStorageService.saveYearSchedule(state.yearSchedule);
      if (!yearSaveResult.success) {
        throw new Error(yearSaveResult.error?.message || 'Failed to save year schedule');
      }

      // Save current day schedule
      const currentDayKey = state.selectedDate.toISOString().slice(0, 10);
      const currentMonthKey = state.selectedDate.toISOString().slice(0, 7);
      const monthSchedule = state.yearSchedule.monthSchedules.get(currentMonthKey);
      const daySchedule = monthSchedule?.daySchedules.get(currentDayKey);
      
      if (daySchedule) {
        const daySaveResult = await LocalStorageService.saveDaySchedule(daySchedule);
        if (!daySaveResult.success) {
          throw new Error(daySaveResult.error?.message || 'Failed to save day schedule');
        }
      }

      dispatch({ type: TodoActionType.SET_SAVE_TIMESTAMP, payload: new Date() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
      dispatch({ type: TodoActionType.SET_ERROR, payload: errorMessage });
    }
  }, [state.hasUnsavedChanges, state.isInitialized, state.yearSchedule, state.selectedDate]);

  // Initialize data on mount
  useEffect(() => {
    const initializeApp = async () => {
      dispatch({ type: TodoActionType.SET_LOADING, payload: true });
      
      try {
        // Run migrations first
        const migrationResult = await DataMigrationService.checkAndMigrate();
        if (!migrationResult.success) {
          throw new Error(migrationResult.error?.message || 'Migration failed');
        }

        // Validate data integrity
        const integrityResult = await DataMigrationService.validateDataIntegrity();
        if (!integrityResult.success || !integrityResult.data) {
          console.warn('Data integrity issues detected:', integrityResult.error?.message);
        }

        // Load current year data
        const currentYear = new Date().getFullYear();
        const yearResult = await LocalStorageService.loadYearSchedule(currentYear);
        
        let yearSchedule: YearSchedule;
        if (yearResult.success && yearResult.data) {
          yearSchedule = yearResult.data;
        } else {
          // Create new year schedule if none exists
          yearSchedule = {
            year: currentYear,
            monthSchedules: new Map(),
            totalYearPoints: 0,
            totalCompletedYearPoints: 0
          };
        }

        dispatch({
          type: TodoActionType.INITIALIZE_DATA,
          payload: {
            yearSchedule,
            selectedDate: new Date()
          }
        });

        // Clean old backups
        await DataMigrationService.cleanOldBackups();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize app';
        dispatch({ type: TodoActionType.SET_ERROR, payload: errorMessage });
      } finally {
        dispatch({ type: TodoActionType.SET_LOADING, payload: false });
      }
    };

    if (!state.isInitialized) {
      initializeApp();
    }
  }, [state.isInitialized]);

  // Auto-save when data changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      autoSave();
    }, 1000); // Debounce auto-save by 1 second

    return () => clearTimeout(saveTimeout);
  }, [autoSave]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.hasUnsavedChanges) {
        autoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges, autoSave]);

  const addTodo = async (todo: Omit<TodoItem, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: TodoActionType.SET_LOADING, payload: true });
      dispatch({ type: TodoActionType.CLEAR_ERROR });

      const response = await todoService.createTodo(todo, state.selectedDate);
      
      dispatch({ 
        type: TodoActionType.ADD_TODO, 
        payload: { 
          todo: response.todo, 
          targetDate: state.selectedDate 
        } 
      });
      
      // Animation is only triggered when tasks are completed, not when added
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add todo';
      dispatch({ type: TodoActionType.SET_ERROR, payload: errorMessage });
    } finally {
      dispatch({ type: TodoActionType.SET_LOADING, payload: false });
    }
  };

  const completeTodo = async (todoId: string) => {
    try {
      dispatch({ type: TodoActionType.SET_LOADING, payload: true });
      dispatch({ type: TodoActionType.CLEAR_ERROR });

      const response = await todoService.completeTodo(todoId);
      
      dispatch({ 
        type: TodoActionType.COMPLETE_TODO, 
        payload: todoId 
      });
      
      // Trigger animation
      animationHandler.queueAnimation(response.todo.pointValue);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete todo';
      dispatch({ type: TodoActionType.SET_ERROR, payload: errorMessage });
    } finally {
      dispatch({ type: TodoActionType.SET_LOADING, payload: false });
    }
  };

  const setSelectedDate = (date: Date) => {
    // Emit date change event for animation component
    const dateChangeEvent = new CustomEvent('date:changed', { detail: date });
    window.dispatchEvent(dateChangeEvent);
    
    dispatch({ type: TodoActionType.SET_SELECTED_DATE, payload: date });
  };

  const loadYearData = async (year: number) => {
    try {
      dispatch({ type: TodoActionType.SET_LOADING, payload: true });
      dispatch({ type: TodoActionType.CLEAR_ERROR });

      const response = await LocalStorageService.loadYearSchedule(year);
      
      if (response.success && response.data) {
        dispatch({ type: TodoActionType.LOAD_YEAR_DATA, payload: response.data });
      } else {
        // Create new year schedule if none exists
        const newYearSchedule: YearSchedule = {
          year,
          monthSchedules: new Map(),
          totalYearPoints: 0,
          totalCompletedYearPoints: 0
        };
        dispatch({ type: TodoActionType.LOAD_YEAR_DATA, payload: newYearSchedule });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load year data';
      dispatch({ type: TodoActionType.SET_ERROR, payload: errorMessage });
    } finally {
      dispatch({ type: TodoActionType.SET_LOADING, payload: false });
    }
  };

  // New persistence methods
  const exportData = async (): Promise<string> => {
    const result = await LocalStorageService.exportData();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to export data');
    }
    return result.data;
  };

  const importData = async (data: string): Promise<void> => {
    const result = await LocalStorageService.importData(data);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to import data');
    }
    
    // Reload current year data after import
    await loadYearData(state.currentYear);
  };

  const createBackup = async (label?: string): Promise<string> => {
    const result = await DataMigrationService.createBackup(label);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create backup');
    }
    return result.data;
  };

  const getBackups = (): Array<{ key: string; timestamp: number; type: string }> => {
    return DataMigrationService.listBackups();
  };

  const restoreFromBackup = async (backupKey: string): Promise<void> => {
    const result = await DataMigrationService.restoreFromBackup(backupKey);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to restore from backup');
    }
    
    // Reload current year data after restore
    await loadYearData(state.currentYear);
  };

  const validateDataIntegrity = async (): Promise<boolean> => {
    const result = await DataMigrationService.validateDataIntegrity();
    return result.success && result.data === true;
  };

  return (
    <TodoContext.Provider value={{
      state,
      addTodo,
      completeTodo,
      setSelectedDate,
      loadYearData,
      exportData,
      importData,
      createBackup,
      getBackups,
      restoreFromBackup,
      validateDataIntegrity
    }}>
      {children}
    </TodoContext.Provider>
  );
};

// Custom hook for consuming the context
export const useTodoContext = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
}; 