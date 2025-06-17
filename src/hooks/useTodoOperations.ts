import { useCallback, useState } from 'react';
import { useService } from '../core/di/react';
import { useStateManagement } from './useStateManagement';
import { useAnimationIntegration } from './useAnimationIntegration';
import { ITodoService } from '../services/interfaces/ITodoService';
import { SERVICE_TOKENS } from '../core/di/ServiceToken';
import { TodoItem } from '../types';

export interface TodoOperationsHook {
  addTodo: (text: string, description?: string, pointValue?: number) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  loadTodosForDate: (date: Date) => Promise<void>;
  setYear: (year: number) => Promise<void>;
  dayStats: {
    total: number;
    completed: number;
    percentage: number;
  };
  isLoading: boolean;
  error: Error | null;
  // Animation state from integration
  isAnimating: boolean;
  animationQueueLength: number;
}

export function useTodoOperations(): TodoOperationsHook {
  const todoService = useService(SERVICE_TOKENS.TODO_SERVICE);
  const { state, dispatch } = useStateManagement();
  const { triggerAnimationWithTaskMovement, isAnimating, queueLength } = useAnimationIntegration();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAddTodo = useCallback(async (text: string, description = '', pointValue = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the TodoSlice actions
      dispatch({
        type: 'TODO_ADD_STARTED',
        payload: {
          todo: {
            title: text,
            description,
            pointValue,
            isCompleted: false
          },
          targetDate: state.todo.selectedDate
        }
      });

      const todoData: Omit<TodoItem, 'id' | 'createdAt'> = {
        title: text,
        description,
        pointValue,
        isCompleted: false
      };

      const response = await todoService.createTodo(todoData, state.todo.selectedDate);
      
      // Dispatch success action with the response data
      dispatch({
        type: 'TODO_ADD_SUCCESS',
        payload: {
          todo: response.todo,
          daySchedule: response.daySchedule,
          targetDate: state.todo.selectedDate
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add todo';
      setError(err instanceof Error ? err : new Error(errorMessage));
      dispatch({
        type: 'TODO_ADD_FAILURE',
        payload: { error: errorMessage }
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [todoService, dispatch, state.todo.selectedDate]);

  const handleUpdateTodo = useCallback(async (id: string, updates: Partial<TodoItem>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await todoService.updateTodo(id, updates);
      // Update logic would go here - dispatch success action
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update todo'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [todoService]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await todoService.deleteTodo(id);
      // Delete logic would go here - dispatch success action
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete todo'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [todoService]);

  const handleToggleTodo = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      dispatch({
        type: 'TODO_COMPLETE_STARTED',
        payload: { todoId: id }
      });

      const response = await todoService.completeTodo(id);

      dispatch({
        type: 'TODO_COMPLETE_SUCCESS',
        payload: {
          todoId: id,
          daySchedule: response.daySchedule
        }
      });

      // Trigger animation with task movement when todo is completed
      if (response.todo && response.todo.pointValue) {
        triggerAnimationWithTaskMovement(
          response.todo.pointValue, 
          id,
          () => {
            // Optional callback when animation completes
            console.log(`Animation completed for todo ${id} with ${response.todo.pointValue} points`);
          }
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle todo';
      setError(err instanceof Error ? err : new Error(errorMessage));
      dispatch({
        type: 'TODO_COMPLETE_FAILURE',
        payload: { error: errorMessage }
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [todoService, dispatch, triggerAnimationWithTaskMovement]);

  const loadTodosForDate = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      dispatch({
        type: 'TODO_SET_SELECTED_DATE',
        payload: { date }
      });
      // Load logic would be implemented here
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load todos'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const setYear = useCallback(async (year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      dispatch({
        type: 'TODO_LOAD_YEAR_STARTED',
        payload: { year }
      });
      // Year loading logic would be implemented here
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to change year'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Calculate day statistics from current day schedule
  const daySchedule = state.todo.yearSchedule?.monthSchedules?.get(
    state.todo.selectedDate.toISOString().slice(0, 7)
  )?.daySchedules?.get(
    state.todo.selectedDate.toISOString().slice(0, 10)
  );

  const dayStats = {
    total: daySchedule?.todoItems?.length || 0,
    completed: daySchedule?.completedTodoItems?.length || 0,
    get percentage() {
      return this.total === 0 ? 0 : Math.round((this.completed / this.total) * 100);
    }
  };

  return {
    addTodo: handleAddTodo,
    updateTodo: handleUpdateTodo,
    deleteTodo: handleDeleteTodo,
    toggleTodo: handleToggleTodo,
    loadTodosForDate,
    setYear,
    dayStats,
    isLoading,
    error,
    isAnimating,
    animationQueueLength: queueLength
  };
} 