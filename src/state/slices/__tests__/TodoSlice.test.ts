/**
 * TodoSlice Test Suite
 * Comprehensive tests for TodoSlice state management including actions, reducers, and selectors
 */

import { TodoSlice, TodoState, TodoActions } from '../TodoSlice';
import { 
  createTodoCollection, 
  createDaySchedule, 
  createYearSchedule,
  createCompletedTodoItem,
  createBaseTodoItem,
  createMixedPriorityTodos,
  createProductiveDaySchedule,
  createEmptyDaySchedule
} from '../../../testing/fixtures/TodoFixtures';
import { TestDates } from '../../../testing/fixtures/DateFixtures';
import { ActionFixtures, InitialStateFixtures } from '../../../testing/fixtures/StateFixtures';
import { TodoItem, DaySchedule } from '../../../types';

describe('TodoSlice', () => {
  let todoSlice: TodoSlice;

  beforeEach(() => {
    todoSlice = new TodoSlice();
  });

  describe('Initialization', () => {
    it('should have correct slice name', () => {
      expect(todoSlice.name).toBe('todo');
    });

    it('should have correct initial state structure', () => {
      const initialState = todoSlice.initialState;
      
      expect(initialState).toHaveProperty('yearSchedule');
      expect(initialState).toHaveProperty('selectedDate');
      expect(initialState).toHaveProperty('currentYear');
      expect(initialState).toHaveProperty('isLoading');
      expect(initialState).toHaveProperty('error');
      expect(initialState).toHaveProperty('lastOperation');
    });

    it('should initialize with correct default values', () => {
      const initialState = todoSlice.initialState;
      
      expect(initialState.yearSchedule.year).toBe(new Date().getFullYear());
      expect(initialState.yearSchedule.monthSchedules).toBeInstanceOf(Map);
      expect(initialState.yearSchedule.totalYearPoints).toBe(0);
      expect(initialState.yearSchedule.totalCompletedYearPoints).toBe(0);
      expect(initialState.selectedDate).toBeInstanceOf(Date);
      expect(initialState.currentYear).toBe(new Date().getFullYear());
      expect(initialState.isLoading).toBe(false);
      expect(initialState.error).toBeNull();
      expect(initialState.lastOperation).toBeNull();
    });

    it('should have empty month schedules initially', () => {
      const initialState = todoSlice.initialState;
      expect(initialState.yearSchedule.monthSchedules.size).toBe(0);
    });
  });

  describe('Actions', () => {
    describe('Action Creators', () => {
      it('should create addTodoStarted action', () => {
        const todo = createBaseTodoItem();
        const targetDate = TestDates.JANUARY_1_2024;
        const action = todoSlice.actions.addTodoStarted({ todo, targetDate });
        
        expect(action.type).toBe('TODO_ADD_STARTED');
        expect(action.payload).toEqual({ todo, targetDate });
      });

      it('should create addTodoSuccess action', () => {
        const todo = createBaseTodoItem();
        const daySchedule = createDaySchedule();
        const targetDate = TestDates.JANUARY_1_2024;
        const action = todoSlice.actions.addTodoSuccess({ todo, daySchedule, targetDate });
        
        expect(action.type).toBe('TODO_ADD_SUCCESS');
        expect(action.payload).toEqual({ todo, daySchedule, targetDate });
      });

      it('should create addTodoFailure action', () => {
        const error = 'Failed to add todo';
        const action = todoSlice.actions.addTodoFailure({ error });
        
        expect(action.type).toBe('TODO_ADD_FAILURE');
        expect(action.payload).toEqual({ error });
      });

      it('should create completeTodoStarted action', () => {
        const todoId = 'todo-1';
        const action = todoSlice.actions.completeTodoStarted({ todoId });
        
        expect(action.type).toBe('TODO_COMPLETE_STARTED');
        expect(action.payload).toEqual({ todoId });
      });

      it('should create completeTodoSuccess action', () => {
        const todoId = 'todo-1';
        const daySchedule = createDaySchedule();
        const action = todoSlice.actions.completeTodoSuccess({ todoId, daySchedule });
        
        expect(action.type).toBe('TODO_COMPLETE_SUCCESS');
        expect(action.payload).toEqual({ todoId, daySchedule });
      });

      it('should create setSelectedDate action', () => {
        const date = TestDates.JUNE_15_2024;
        const action = todoSlice.actions.setSelectedDate({ date });
        
        expect(action.type).toBe('TODO_SET_SELECTED_DATE');
        expect(action.payload).toEqual({ date });
      });

      it('should create loadYearStarted action', () => {
        const year = 2024;
        const action = todoSlice.actions.loadYearStarted({ year });
        
        expect(action.type).toBe('TODO_LOAD_YEAR_STARTED');
        expect(action.payload).toEqual({ year });
      });

      it('should create error management actions', () => {
        const error = 'Test error';
        
        const setErrorAction = todoSlice.actions.setError({ error });
        expect(setErrorAction.type).toBe('TODO_SET_ERROR');
        expect(setErrorAction.payload).toEqual({ error });
        
        const clearErrorAction = todoSlice.actions.clearError();
        expect(clearErrorAction.type).toBe('TODO_CLEAR_ERROR');
        expect(clearErrorAction.payload).toBeUndefined();
      });
    });
  });

  describe('Reducer', () => {
    describe('Todo Add Actions', () => {
      it('should handle TODO_ADD_STARTED', () => {
        const initialState = todoSlice.initialState;
        const todo = createBaseTodoItem();
        const action = ActionFixtures.todo.addTodoStarted(todo, TestDates.JANUARY_1_2024);
        
        const newState = todoSlice.reducer(initialState, action);
        
        expect(newState.isLoading).toBe(true);
        expect(newState.error).toBeNull();
        expect(newState).not.toBe(initialState); // Immutability check
      });

      it('should handle TODO_ADD_SUCCESS', () => {
        const loadingState: TodoState = {
          ...todoSlice.initialState,
          isLoading: true
        };
        
        const todo = createBaseTodoItem();
        const daySchedule = createDaySchedule();
        const action = ActionFixtures.todo.addTodoSuccess(todo, daySchedule, TestDates.JANUARY_1_2024);
        
        const newState = todoSlice.reducer(loadingState, action);
        
        expect(newState.isLoading).toBe(false);
        expect(newState.lastOperation).toMatchObject({
          type: 'ADD_TODO',
          success: true
        });
        expect(newState.lastOperation!.timestamp).toBeInstanceOf(Date);
        
        // Check that year schedule was updated
        const monthKey = TestDates.JANUARY_1_2024.toISOString().slice(0, 7);
        const dayKey = TestDates.JANUARY_1_2024.toISOString().slice(0, 10);
        expect(newState.yearSchedule.monthSchedules.has(monthKey)).toBe(true);
        expect(newState.yearSchedule.monthSchedules.get(monthKey)!.daySchedules.has(dayKey)).toBe(true);
      });

      it('should handle TODO_ADD_FAILURE', () => {
        const loadingState: TodoState = {
          ...todoSlice.initialState,
          isLoading: true
        };
        
        const error = 'Network error';
        const action = ActionFixtures.todo.addTodoFailure(error);
        
        const newState = todoSlice.reducer(loadingState, action);
        
        expect(newState.isLoading).toBe(false);
        expect(newState.error).toBe(error);
        expect(newState.lastOperation).toMatchObject({
          type: 'ADD_TODO',
          success: false
        });
      });
    });

    describe('Todo Complete Actions', () => {
      it('should handle TODO_COMPLETE_STARTED', () => {
        const initialState = todoSlice.initialState;
        const action = ActionFixtures.todo.completeTodoStarted('todo-1');
        
        const newState = todoSlice.reducer(initialState, action);
        
        expect(newState.isLoading).toBe(true);
        expect(newState.error).toBeNull();
      });

      it('should handle TODO_COMPLETE_SUCCESS', () => {
        const loadingState: TodoState = {
          ...todoSlice.initialState,
          isLoading: true,
          selectedDate: TestDates.JANUARY_1_2024
        };
        
        const daySchedule = createDaySchedule();
        const action = ActionFixtures.todo.completeTodoSuccess('todo-1', daySchedule);
        
        const newState = todoSlice.reducer(loadingState, action);
        
        expect(newState.isLoading).toBe(false);
        expect(newState.lastOperation).toMatchObject({
          type: 'COMPLETE_TODO',
          success: true
        });
        
        // Verify year schedule update
        const monthKey = loadingState.selectedDate.toISOString().slice(0, 7);
        expect(newState.yearSchedule.monthSchedules.has(monthKey)).toBe(true);
      });

      it('should handle TODO_COMPLETE_FAILURE', () => {
        const loadingState: TodoState = {
          ...todoSlice.initialState,
          isLoading: true
        };
        
        const error = 'Failed to complete todo';
        const action = ActionFixtures.todo.completeTodoFailure(error);
        
        const newState = todoSlice.reducer(loadingState, action);
        
        expect(newState.isLoading).toBe(false);
        expect(newState.error).toBe(error);
        expect(newState.lastOperation).toMatchObject({
          type: 'COMPLETE_TODO',
          success: false
        });
      });
    });

    describe('Date Management Actions', () => {
      it('should handle TODO_SET_SELECTED_DATE', () => {
        const initialState = todoSlice.initialState;
        const newDate = TestDates.JUNE_15_2024;
        const action = ActionFixtures.todo.setSelectedDate(newDate);
        
        const newState = todoSlice.reducer(initialState, action);
        
        expect(newState.selectedDate).toEqual(newDate);
        expect(newState).not.toBe(initialState);
      });
    });

    describe('Year Loading Actions', () => {
      it('should handle TODO_LOAD_YEAR_STARTED', () => {
        const initialState = todoSlice.initialState;
        const year = 2024;
        const action = ActionFixtures.todo.loadYearStarted(year);
        
        const newState = todoSlice.reducer(initialState, action);
        
        expect(newState.isLoading).toBe(true);
        expect(newState.error).toBeNull();
        expect(newState.currentYear).toBe(year);
      });

      it('should handle TODO_LOAD_YEAR_SUCCESS', () => {
        const loadingState: TodoState = {
          ...todoSlice.initialState,
          isLoading: true
        };
        
        const yearSchedule = createYearSchedule();
        const action = ActionFixtures.todo.loadYearSuccess(yearSchedule);
        
        const newState = todoSlice.reducer(loadingState, action);
        
        expect(newState.isLoading).toBe(false);
        expect(newState.yearSchedule).toEqual(yearSchedule);
      });

      it('should handle TODO_LOAD_YEAR_FAILURE', () => {
        const loadingState: TodoState = {
          ...todoSlice.initialState,
          isLoading: true
        };
        
        const error = 'Failed to load year data';
        const action = ActionFixtures.todo.loadYearFailure(error);
        
        const newState = todoSlice.reducer(loadingState, action);
        
        expect(newState.isLoading).toBe(false);
        expect(newState.error).toBe(error);
      });
    });

    describe('Error Management Actions', () => {
      it('should handle TODO_SET_ERROR', () => {
        const initialState = todoSlice.initialState;
        const error = 'Custom error message';
        const action = ActionFixtures.todo.setError(error);
        
        const newState = todoSlice.reducer(initialState, action);
        
        expect(newState.error).toBe(error);
      });

      it('should handle TODO_CLEAR_ERROR', () => {
        const stateWithError: TodoState = {
          ...todoSlice.initialState,
          error: 'Some error'
        };
        
        const action = ActionFixtures.todo.clearError();
        
        const newState = todoSlice.reducer(stateWithError, action);
        
        expect(newState.error).toBeNull();
      });
    });

    describe('Unknown Actions', () => {
      it('should return unchanged state for unknown actions', () => {
        const initialState = todoSlice.initialState;
        // @ts-ignore - Testing unknown action
        const unknownAction = { type: 'UNKNOWN_ACTION', payload: {} };
        
        const newState = todoSlice.reducer(initialState, unknownAction as any);
        
        expect(newState).toBe(initialState);
      });
    });
  });

  describe('Selectors', () => {
    let stateWithData: TodoState;

    beforeEach(() => {
      // Create a state with some test data
      const yearSchedule = createYearSchedule();
      const daySchedule = createDaySchedule();
      const monthKey = TestDates.JANUARY_1_2024.toISOString().slice(0, 7);
      const dayKey = TestDates.JANUARY_1_2024.toISOString().slice(0, 10);
      
      yearSchedule.monthSchedules.get(monthKey)!.daySchedules.set(dayKey, daySchedule);
      
      stateWithData = {
        ...todoSlice.initialState,
        yearSchedule,
        selectedDate: TestDates.JANUARY_1_2024
      };
    });

    describe('Basic Selectors', () => {
      it('should select year schedule', () => {
        const result = todoSlice.selectors.getYearSchedule(stateWithData);
        expect(result).toBe(stateWithData.yearSchedule);
      });

      it('should select selected date', () => {
        const result = todoSlice.selectors.getSelectedDate(stateWithData);
        expect(result).toBe(stateWithData.selectedDate);
      });

      it('should select current year', () => {
        const result = todoSlice.selectors.getCurrentYear(stateWithData);
        expect(result).toBe(stateWithData.currentYear);
      });

      it('should select loading state', () => {
        const result = todoSlice.selectors.getIsLoading(stateWithData);
        expect(result).toBe(stateWithData.isLoading);
      });

      it('should select error state', () => {
        const result = todoSlice.selectors.getError(stateWithData);
        expect(result).toBe(stateWithData.error);
      });
    });

    describe('Computed Selectors', () => {
      it('should select current day schedule', () => {
        const result = todoSlice.selectors.getCurrentDaySchedule(stateWithData);
        
        expect(result).toBeDefined();
        expect(result!.date).toBe(TestDates.JANUARY_1_2024.toISOString().slice(0, 10));
        expect(result!.todoItems).toBeDefined();
      });

      it('should return null for non-existent day schedule', () => {
        const emptyState = todoSlice.initialState;
        const result = todoSlice.selectors.getCurrentDaySchedule(emptyState);
        
        expect(result).toBeNull();
      });

      it('should select current day tasks', () => {
        const result = todoSlice.selectors.getCurrentDayTasks(stateWithData);
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return empty array for no tasks', () => {
        const emptyState = todoSlice.initialState;
        const result = todoSlice.selectors.getCurrentDayTasks(emptyState);
        
        expect(result).toEqual([]);
      });

      it('should select incomplete tasks', () => {
        const result = todoSlice.selectors.getIncompleteTasks(stateWithData);
        
        expect(Array.isArray(result)).toBe(true);
        result.forEach((task: TodoItem) => {
          expect(task.isCompleted).toBe(false);
        });
      });

      it('should select completed tasks', () => {
        const result = todoSlice.selectors.getCompletedTasks(stateWithData);
        
        expect(Array.isArray(result)).toBe(true);
        result.forEach((task: TodoItem) => {
          expect(task.isCompleted).toBe(true);
        });
      });

      it('should calculate current day stats', () => {
        const result = todoSlice.selectors.getCurrentDayStats(stateWithData);
        
        expect(result).toHaveProperty('totalTasks');
        expect(result).toHaveProperty('completedTasks');
        expect(result).toHaveProperty('totalPoints');
        expect(result).toHaveProperty('completedPoints');
        
        expect(typeof result.totalTasks).toBe('number');
        expect(typeof result.completedTasks).toBe('number');
        expect(typeof result.totalPoints).toBe('number');
        expect(typeof result.completedPoints).toBe('number');
        
        expect(result.completedTasks).toBeLessThanOrEqual(result.totalTasks);
        expect(result.completedPoints).toBeLessThanOrEqual(result.totalPoints);
      });

      it('should return zero stats for empty day', () => {
        const emptyState = todoSlice.initialState;
        const result = todoSlice.selectors.getCurrentDayStats(emptyState);
        
        expect(result).toEqual({
          totalTasks: 0,
          completedTasks: 0,
          totalPoints: 0,
          completedPoints: 0
        });
      });
    });
  });

  describe('Complex State Updates', () => {
    it('should properly update year schedule when adding todo to new month', () => {
      const initialState = todoSlice.initialState;
      const todo = createBaseTodoItem();
      const daySchedule = createDaySchedule();
      const targetDate = TestDates.JUNE_15_2024; // Different month
      
      const action = ActionFixtures.todo.addTodoSuccess(todo, daySchedule, targetDate);
      const newState = todoSlice.reducer(initialState, action);
      
      const monthKey = targetDate.toISOString().slice(0, 7);
      const dayKey = targetDate.toISOString().slice(0, 10);
      
      expect(newState.yearSchedule.monthSchedules.has(monthKey)).toBe(true);
      const monthSchedule = newState.yearSchedule.monthSchedules.get(monthKey)!;
      expect(monthSchedule.daySchedules.has(dayKey)).toBe(true);
      expect(monthSchedule.daySchedules.get(dayKey)).toEqual(daySchedule);
    });

    it('should update existing month schedule when adding todo to existing month', () => {
      // Setup initial state with existing data
      const yearSchedule = createYearSchedule();
      const initialState: TodoState = {
        ...todoSlice.initialState,
        yearSchedule
      };
      
      const todo = createBaseTodoItem();
      const newDaySchedule = createDaySchedule();
      const targetDate = new Date('2024-01-15'); // Same month as existing data
      
      const action = ActionFixtures.todo.addTodoSuccess(todo, newDaySchedule, targetDate);
      const newState = todoSlice.reducer(initialState, action);
      
      const monthKey = targetDate.toISOString().slice(0, 7);
      const dayKey = targetDate.toISOString().slice(0, 10);
      
      expect(newState.yearSchedule.monthSchedules.has(monthKey)).toBe(true);
      const monthSchedule = newState.yearSchedule.monthSchedules.get(monthKey)!;
      expect(monthSchedule.daySchedules.get(dayKey)).toEqual(newDaySchedule);
    });

    it('should recalculate totals when updating schedules', () => {
      const initialState = todoSlice.initialState;
      const todo = createBaseTodoItem({ pointValue: 50 });
      const daySchedule = createDaySchedule({ totalPointValue: 50, totalCompletedPointValue: 0 });
      
      const action = ActionFixtures.todo.addTodoSuccess(todo, daySchedule, TestDates.JANUARY_1_2024);
      const newState = todoSlice.reducer(initialState, action);
      
      expect(newState.yearSchedule.totalYearPoints).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid actions', () => {
      let state = todoSlice.initialState;
      
      // Simulate rapid todo additions
      for (let i = 0; i < 5; i++) {
        const todo = createBaseTodoItem({ id: `todo-${i}`, pointValue: i * 10 });
        const daySchedule = createDaySchedule();
        const action = ActionFixtures.todo.addTodoSuccess(todo, daySchedule, TestDates.JANUARY_1_2024);
        state = todoSlice.reducer(state, action);
      }
      
      expect(state.isLoading).toBe(false);
      expect(state.lastOperation!.success).toBe(true);
    });

    it('should handle date boundary conditions', () => {
      const initialState = todoSlice.initialState;
      
      // Test year boundary
      const yearEndDate = TestDates.YEAR_END;
      const todo = createBaseTodoItem();
      const daySchedule = createDaySchedule();
      
      const action = ActionFixtures.todo.addTodoSuccess(todo, daySchedule, yearEndDate);
      const newState = todoSlice.reducer(initialState, action);
      
      const monthKey = yearEndDate.toISOString().slice(0, 7);
      expect(newState.yearSchedule.monthSchedules.has(monthKey)).toBe(true);
    });

    it('should handle empty day schedules', () => {
      const initialState = todoSlice.initialState;
      const emptyDaySchedule = createEmptyDaySchedule();
      const todo = createBaseTodoItem();
      
      const action = ActionFixtures.todo.addTodoSuccess(todo, emptyDaySchedule, TestDates.JANUARY_1_2024);
      const newState = todoSlice.reducer(initialState, action);
      
      expect(newState.yearSchedule.totalYearPoints).toBe(0);
      expect(newState.yearSchedule.totalCompletedYearPoints).toBe(0);
    });

    it('should maintain immutability across all updates', () => {
      const initialState = todoSlice.initialState;
      const todo = createBaseTodoItem();
      const daySchedule = createDaySchedule();
      
      const action = ActionFixtures.todo.addTodoSuccess(todo, daySchedule, TestDates.JANUARY_1_2024);
      const newState = todoSlice.reducer(initialState, action);
      
      // Check top-level immutability
      expect(newState).not.toBe(initialState);
      expect(newState.yearSchedule).not.toBe(initialState.yearSchedule);
      expect(newState.yearSchedule.monthSchedules).not.toBe(initialState.yearSchedule.monthSchedules);
      
      // Original state should be unchanged
      expect(initialState.yearSchedule.monthSchedules.size).toBe(0);
    });
  });

  describe('Selector Integration', () => {
    it('should work with selectors after state updates', () => {
      let state = todoSlice.initialState;
      
      // Add some todos
      const todos = createMixedPriorityTodos();
      const daySchedule = createDaySchedule({ todoItems: todos });
      
      const action = ActionFixtures.todo.addTodoSuccess(todos[0], daySchedule, TestDates.JANUARY_1_2024);
      state = todoSlice.reducer(state, action);
      
      // Update selected date to match
      state = { ...state, selectedDate: TestDates.JANUARY_1_2024 };
      
      // Test selectors
      const currentTasks = todoSlice.selectors.getCurrentDayTasks(state);
      const incompleteTasks = todoSlice.selectors.getIncompleteTasks(state);
      const completedTasks = todoSlice.selectors.getCompletedTasks(state);
      const stats = todoSlice.selectors.getCurrentDayStats(state);
      
      expect(currentTasks.length).toBeGreaterThan(0);
      expect(incompleteTasks.length + completedTasks.length).toBe(currentTasks.length);
      expect(stats.totalTasks).toBe(currentTasks.length);
      expect(stats.completedTasks).toBe(completedTasks.length);
    });
  });
}); 