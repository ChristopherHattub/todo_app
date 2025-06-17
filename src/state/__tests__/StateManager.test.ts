/**
 * StateManager Test Suite
 * Tests the core state management functionality including state initialization,
 * action dispatching, subscriptions, and slice management.
 */

import { StateManager, RootState } from '../StateManager';
import { TodoSlice } from '../slices/TodoSlice';
import { UISlice } from '../slices/UISlice';
import { DateSlice } from '../slices/DateSlice';
import { TestBuilders } from '../../testing/patterns/TestBuilderPattern';
import { RootStateFixtures, ActionFixtures, InitialStateFixtures } from '../../testing/fixtures/StateFixtures';
import { TestDates } from '../../testing/fixtures/DateFixtures';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  afterEach(() => {
    // Clean up any listeners
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct initial state', () => {
      const state = stateManager.getState();
      
      expect(state).toBeDefined();
      expect(state.todo).toBeDefined();
      expect(state.ui).toBeDefined();
      expect(state.date).toBeDefined();
    });

    it('should have all slices registered', () => {
      const state = stateManager.getState();
      
      // Verify todo slice
      expect(state.todo.yearSchedule).toBeDefined();
      expect(state.todo.selectedDate).toBeInstanceOf(Date);
      expect(state.todo.isLoading).toBe(false);
      expect(state.todo.error).toBeNull();
      
      // Verify UI slice
      expect(state.ui.isLoading).toBe(false);
      expect(state.ui.notifications).toEqual([]);
      expect(state.ui.theme).toBe('auto');
      
      // Verify date slice
      expect(state.date.currentDate).toBeInstanceOf(Date);
      expect(state.date.selectedDate).toBeInstanceOf(Date);
      expect(state.date.calendarView).toBe('month');
    });

    it('should create slices with correct initial state structure', () => {
      const state = stateManager.getState();
      
      // Check todo slice structure
      expect(state.todo).toHaveProperty('yearSchedule');
      expect(state.todo).toHaveProperty('selectedDate');
      expect(state.todo).toHaveProperty('currentYear');
      expect(state.todo).toHaveProperty('isLoading');
      expect(state.todo).toHaveProperty('error');
      expect(state.todo).toHaveProperty('lastOperation');
      
      // Check UI slice structure
      expect(state.ui).toHaveProperty('isLoading');
      expect(state.ui).toHaveProperty('globalError');
      expect(state.ui).toHaveProperty('notifications');
      expect(state.ui).toHaveProperty('modals');
      expect(state.ui).toHaveProperty('theme');
      expect(state.ui).toHaveProperty('sidebarCollapsed');
      
      // Check date slice structure
      expect(state.date).toHaveProperty('currentDate');
      expect(state.date).toHaveProperty('selectedDate');
      expect(state.date).toHaveProperty('currentMonth');
      expect(state.date).toHaveProperty('isDateSelectorOpen');
      expect(state.date).toHaveProperty('calendarView');
      expect(state.date).toHaveProperty('timezone');
    });
  });

  describe('Action Dispatching', () => {
    describe('Todo Actions', () => {
      it('should handle TODO_ADD_STARTED action', () => {
        const initialState = stateManager.getState();
        expect(initialState.todo.isLoading).toBe(false);
        
        const action = ActionFixtures.todo.addTodoStarted({
          title: 'Test Todo',
          description: 'Test Description',
          pointValue: 10,
          isCompleted: false
        });
        
        stateManager.dispatch(action);
        
        const newState = stateManager.getState();
        expect(newState.todo.isLoading).toBe(true);
        expect(newState.todo.error).toBeNull();
      });

      it('should handle TODO_ADD_SUCCESS action', () => {
        // First set loading state
        stateManager.dispatch(ActionFixtures.todo.addTodoStarted({
          title: 'Test Todo',
          description: 'Test Description',
          pointValue: 10,
          isCompleted: false
        }));
        
        const todo = TestBuilders.todo().build();
        const daySchedule = TestBuilders.daySchedule().addTodo(todo).build();
        
        stateManager.dispatch(ActionFixtures.todo.addTodoSuccess(todo, daySchedule));
        
        const state = stateManager.getState();
        expect(state.todo.isLoading).toBe(false);
        expect(state.todo.lastOperation).toMatchObject({
          type: 'ADD_TODO',
          success: true
        });
      });

      it('should handle TODO_ADD_FAILURE action', () => {
        const errorMessage = 'Failed to add todo';
        
        stateManager.dispatch(ActionFixtures.todo.addTodoFailure(errorMessage));
        
        const state = stateManager.getState();
        expect(state.todo.isLoading).toBe(false);
        expect(state.todo.error).toBe(errorMessage);
        expect(state.todo.lastOperation).toMatchObject({
          type: 'ADD_TODO',
          success: false
        });
      });

      it('should handle TODO_SET_SELECTED_DATE action', () => {
        const newDate = TestDates.JUNE_15_2024;
        
        stateManager.dispatch(ActionFixtures.todo.setSelectedDate(newDate));
        
        const state = stateManager.getState();
        expect(state.todo.selectedDate).toEqual(newDate);
      });

      it('should handle TODO_CLEAR_ERROR action', () => {
        // First set an error
        stateManager.dispatch(ActionFixtures.todo.setError('Test error'));
        expect(stateManager.getState().todo.error).toBe('Test error');
        
        // Then clear it
        stateManager.dispatch(ActionFixtures.todo.clearError());
        
        const state = stateManager.getState();
        expect(state.todo.error).toBeNull();
      });
    });

    describe('UI Actions', () => {
      it('should handle UI_SET_LOADING action', () => {
        stateManager.dispatch(ActionFixtures.ui.setLoading(true));
        
        let state = stateManager.getState();
        expect(state.ui.isLoading).toBe(true);
        
        stateManager.dispatch(ActionFixtures.ui.setLoading(false));
        
        state = stateManager.getState();
        expect(state.ui.isLoading).toBe(false);
      });

      it('should handle UI_ADD_NOTIFICATION action', () => {
        const notification = {
          type: 'success' as const,
          title: 'Success',
          message: 'Operation completed successfully'
        };
        
        stateManager.dispatch(ActionFixtures.ui.addNotification(notification));
        
        const state = stateManager.getState();
        expect(state.ui.notifications).toHaveLength(1);
        expect(state.ui.notifications[0]).toMatchObject(notification);
        expect(state.ui.notifications[0].id).toBeDefined();
        expect(state.ui.notifications[0].timestamp).toBeInstanceOf(Date);
      });

      it('should handle UI_REMOVE_NOTIFICATION action', () => {
        // First add a notification
        stateManager.dispatch(ActionFixtures.ui.addNotification({
          type: 'info',
          title: 'Info',
          message: 'Test message'
        }));
        
        const stateWithNotification = stateManager.getState();
        const notificationId = stateWithNotification.ui.notifications[0].id;
        
        // Then remove it
        stateManager.dispatch(ActionFixtures.ui.removeNotification(notificationId));
        
        const finalState = stateManager.getState();
        expect(finalState.ui.notifications).toHaveLength(0);
      });

      it('should handle UI_SET_MODAL action', () => {
        stateManager.dispatch(ActionFixtures.ui.setModal('isDateSelectorOpen', true));
        
        let state = stateManager.getState();
        expect(state.ui.modals.isDateSelectorOpen).toBe(true);
        
        stateManager.dispatch(ActionFixtures.ui.setModal('isDateSelectorOpen', false));
        
        state = stateManager.getState();
        expect(state.ui.modals.isDateSelectorOpen).toBe(false);
      });

      it('should handle UI_SET_THEME action', () => {
        stateManager.dispatch(ActionFixtures.ui.setTheme('dark'));
        
        let state = stateManager.getState();
        expect(state.ui.theme).toBe('dark');
        
        stateManager.dispatch(ActionFixtures.ui.setTheme('light'));
        
        state = stateManager.getState();
        expect(state.ui.theme).toBe('light');
      });

      it('should handle UI_TOGGLE_SIDEBAR action', () => {
        const initialCollapsed = stateManager.getState().ui.sidebarCollapsed;
        
        stateManager.dispatch(ActionFixtures.ui.toggleSidebar());
        
        const newState = stateManager.getState();
        expect(newState.ui.sidebarCollapsed).toBe(!initialCollapsed);
      });
    });

    describe('Date Actions', () => {
      it('should handle DATE_SET_SELECTED action', () => {
        const newDate = TestDates.JUNE_15_2024;
        
        stateManager.dispatch(ActionFixtures.date.setSelectedDate(newDate));
        
        const state = stateManager.getState();
        expect(state.date.selectedDate).toEqual(newDate);
        expect(state.date.currentMonth).toEqual(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
        expect(state.date.isDateSelectorOpen).toBe(false);
      });

      it('should handle DATE_SET_CURRENT_MONTH action', () => {
        const newMonth = TestDates.JUNE_15_2024;
        
        stateManager.dispatch(ActionFixtures.date.setCurrentMonth(newMonth));
        
        const state = stateManager.getState();
        expect(state.date.currentMonth).toEqual(new Date(newMonth.getFullYear(), newMonth.getMonth(), 1));
      });

      it('should handle DATE_TOGGLE_SELECTOR action', () => {
        // Test explicit toggle
        stateManager.dispatch(ActionFixtures.date.toggleSelector(true));
        
        let state = stateManager.getState();
        expect(state.date.isDateSelectorOpen).toBe(true);
        
        // Test implicit toggle
        stateManager.dispatch(ActionFixtures.date.toggleSelector());
        
        state = stateManager.getState();
        expect(state.date.isDateSelectorOpen).toBe(false);
      });

      it('should handle DATE_SET_CALENDAR_VIEW action', () => {
        stateManager.dispatch(ActionFixtures.date.setCalendarView('year'));
        
        let state = stateManager.getState();
        expect(state.date.calendarView).toBe('year');
        
        stateManager.dispatch(ActionFixtures.date.setCalendarView('month'));
        
        state = stateManager.getState();
        expect(state.date.calendarView).toBe('month');
      });

      it('should handle DATE_SET_TIMEZONE action', () => {
        const newTimezone = 'America/New_York';
        
        stateManager.dispatch(ActionFixtures.date.setTimezone(newTimezone));
        
        const state = stateManager.getState();
        expect(state.date.timezone).toBe(newTimezone);
      });
    });

    describe('Unknown Actions', () => {
      it('should ignore unknown actions without changing state', () => {
        const initialState = stateManager.getState();
        
        // @ts-ignore - Testing unknown action
        stateManager.dispatch({ type: 'UNKNOWN_ACTION', payload: { test: 'data' } });
        
        const finalState = stateManager.getState();
        expect(finalState).toEqual(initialState);
      });
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers when state changes', () => {
      const listener = jest.fn();
      
      stateManager.subscribe(listener);
      
      stateManager.dispatch(ActionFixtures.ui.setLoading(true));
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(stateManager.getState());
    });

    it('should not notify subscribers when state does not change', () => {
      const listener = jest.fn();
      
      stateManager.subscribe(listener);
      
      // Dispatch an unknown action that shouldn't change state
      // @ts-ignore - Testing unknown action
      stateManager.dispatch({ type: 'UNKNOWN_ACTION' });
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);
      
      stateManager.dispatch(ActionFixtures.ui.setLoading(true));
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      
      const unsubscribe = stateManager.subscribe(listener);
      
      stateManager.dispatch(ActionFixtures.ui.setLoading(true));
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      stateManager.dispatch(ActionFixtures.ui.setLoading(false));
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      stateManager.subscribe(errorListener);
      stateManager.subscribe(normalListener);
      
      stateManager.dispatch(ActionFixtures.ui.setLoading(true));
      
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error in state listener:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Slice Management', () => {
    it('should provide slice selectors', () => {
      const todoSelectors = stateManager.getSliceSelectors('todo');
      
      expect(todoSelectors).toBeDefined();
      expect(typeof todoSelectors.getYearSchedule).toBe('function');
      expect(typeof todoSelectors.getSelectedDate).toBe('function');
      expect(typeof todoSelectors.getCurrentDayTasks).toBe('function');
    });

    it('should provide slice actions', () => {
      const todoActions = stateManager.getSliceActions('todo');
      
      expect(todoActions).toBeDefined();
      expect(typeof todoActions.addTodoStarted).toBe('function');
      expect(typeof todoActions.setSelectedDate).toBe('function');
      expect(typeof todoActions.clearError).toBe('function');
    });

    it('should return empty object for unknown slice', () => {
      // @ts-ignore - Testing unknown slice
      const unknownSelectors = stateManager.getSliceSelectors('unknown' as any);
      const unknownActions = stateManager.getSliceActions('unknown' as any);
      
      expect(unknownSelectors).toEqual({});
      expect(unknownActions).toEqual({});
    });
  });

  describe('Complex State Updates', () => {
    it('should handle rapid sequential actions', () => {
      const listener = jest.fn();
      stateManager.subscribe(listener);
      
      // Dispatch multiple actions in quick succession
      stateManager.dispatch(ActionFixtures.ui.setLoading(true));
      stateManager.dispatch(ActionFixtures.ui.setTheme('dark'));
      stateManager.dispatch(ActionFixtures.date.setCalendarView('year'));
      
      expect(listener).toHaveBeenCalledTimes(3);
      
      const finalState = stateManager.getState();
      expect(finalState.ui.isLoading).toBe(true);
      expect(finalState.ui.theme).toBe('dark');
      expect(finalState.date.calendarView).toBe('year');
    });

    it('should maintain state consistency across multiple slice updates', () => {
      const testDate = TestDates.JUNE_15_2024;
      
      // Update both todo and date slices
      stateManager.dispatch(ActionFixtures.todo.setSelectedDate(testDate));
      stateManager.dispatch(ActionFixtures.date.setSelectedDate(testDate));
      
      const state = stateManager.getState();
      expect(state.todo.selectedDate).toEqual(testDate);
      expect(state.date.selectedDate).toEqual(testDate);
    });
  });

  describe('Performance', () => {
    it('should handle large number of actions efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        stateManager.dispatch(ActionFixtures.ui.addNotification({
          type: 'info',
          title: `Notification ${i}`,
          message: `Message ${i}`
        }));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
      
      const state = stateManager.getState();
      expect(state.ui.notifications).toHaveLength(1000);
    });

    it('should handle large number of subscribers efficiently', () => {
      const listeners: jest.Mock[] = [];
      
      // Add many listeners
      for (let i = 0; i < 100; i++) {
        const listener = jest.fn();
        listeners.push(listener);
        stateManager.subscribe(listener);
      }
      
      const startTime = performance.now();
      
      stateManager.dispatch(ActionFixtures.ui.setLoading(true));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should notify all listeners efficiently
      expect(duration).toBeLessThan(100); // 100ms
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledTimes(1);
      });
    });
  });
}); 